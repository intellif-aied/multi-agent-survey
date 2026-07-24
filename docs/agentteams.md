---
layout: default
title: AgentTeams 调研
---

# AgentTeams：长期 Worker 生命周期

AgentTeams 把 Manager 和 Worker 组织进 Matrix 房间，用 Controller 维护 Worker 的期望状态，并把持久工作区放在 MinIO 或云对象存储中。它的核心不是一次任务队列，而是长期 Agent 身份及其运行载体的生命周期。

> 核心链路：用户消息 → Manager 技能 / `agt` → Controller API → Worker 配置记录 → Reconcile → 身份与工作区准备 → 容器或 Pod → Matrix 与对象存储。

## 产品入口与参与者

普通用户主要通过 Element Web 或其他 Matrix 客户端使用系统。用户可以在 Manager 私聊中要求建立团队成员，也可以进入 Worker 房间直接布置任务、追问进度和人工纠正。正常任务协作不要求用户运行 `agt`。

| 参与者 | 入口 | 职责 |
| --- | --- | --- |
| Human | Element Web / Matrix | 创建团队、分配任务、观察和干预 |
| Manager Agent | Matrix 消息与内置技能 | 理解目标、拆分任务、选择或创建 Worker |
| 运维人员 | 安装脚本、Docker、Helm、`agt` | 部署平台、管理资源和排障 |
| Worker Agent | 自己的 Matrix 房间与工作区 | 执行任务并汇报过程和结果 |

`agt` 是 AgentTeams 的资源管理 CLI，接近一个面向该平台的精简版 `kubectl`。它把 `create worker`、`get workers`、`wake`、`sleep` 等操作转换成 Controller HTTP 请求。它既不是聊天入口，也不运行模型。保留 CLI 的价值是让运维脚本和 Manager Skill 共用同一套确定性管理接口，而不是让模型直接拼接 Docker 命令。

## 部署边界

本地安装通过 `make install` 启动 Controller、Manager 以及 Matrix、Higress、对象存储和 Element Web 等依赖；Worker 在用户创建后才出现。生产部署使用 Kubernetes 与 Helm，Controller 监听 Worker、Manager、Team、Human 等自定义资源，并把 Worker 落成 Pod。

本地和 Kubernetes 的底层载体不同，但上层都遵循同一种控制循环：先记录希望状态，再由 Controller 持续比较实际状态并补齐差异。

## 端到端请求路径

以“创建 Alice 并修改登录页”为例：

1. 运维先使 Controller、Manager、Matrix、Higress 和对象存储上线。
2. 用户在 Element 中要求 Manager 创建名为 Alice 的前端 Worker，并指定模型和技能。
3. Manager Skill 调用 `agt`；Controller API 保存 Alice 的期望配置。
4. Worker Reconciler 观察到新记录，依次准备 Matrix 身份、模型网关权限、对象存储目录和运行配置。
5. Backend 把统一 Worker 请求翻译为 Docker 容器或 Kubernetes Pod。
6. Worker Runtime 从对象存储恢复工作区，连接 Matrix 房间并报告就绪。
7. 用户或 Manager 在 Alice 房间中发送任务；Alice 调模型和工具执行。
8. 代码与大文件写回对象存储，进度、阻塞和完成摘要写回 Matrix。

这里存在两条不同的数据通道：Matrix 保存可观察的协调事件；对象存储保存配置、技能、代码工作区、任务文件和结果。把大文件全部塞进聊天事件，或只在容器本地保存工作区，都会削弱恢复能力。

## Controller 调度链

`agt create worker` 首先产生的是一条期望状态，不是一次不可恢复的 `docker run`。主要源码路径如下：

1. [`cmd/agt/create.go`](https://github.com/agentscope-ai/AgentTeams/blob/main/agentteams-controller/cmd/agt/create.go) 收集名称、模型、Runtime 和技能，调用 `/api/v1/workers`。
2. [`internal/server/http.go`](https://github.com/agentscope-ai/AgentTeams/blob/main/agentteams-controller/internal/server/http.go) 创建 Worker 配置记录。
3. [`worker_controller.go`](https://github.com/agentscope-ai/AgentTeams/blob/main/agentteams-controller/internal/controller/worker_controller.go) 进入 Reconcile，比较 `spec` 与实际状态。
4. [`provisioner.go`](https://github.com/agentscope-ai/AgentTeams/blob/main/agentteams-controller/internal/service/provisioner.go) 准备 Matrix、模型网关和存储身份。
5. [`deployer.go`](https://github.com/agentscope-ai/AgentTeams/blob/main/agentteams-controller/internal/service/deployer.go) 把角色、模型、凭据、技能和工具配置写入工作区。
6. [`backend/interface.go`](https://github.com/agentscope-ai/AgentTeams/blob/main/agentteams-controller/internal/backend/interface.go) 抽象 Docker 与 Kubernetes 运行载体。
7. [`worker-entrypoint.sh`](https://github.com/agentscope-ai/AgentTeams/blob/main/worker/scripts/worker-entrypoint.sh) 在容器内恢复工作区、连接 Matrix 并启动 Runtime。

Controller 必须允许 Reconcile 安全地重复执行，因为任何一步都可能在部分成功后重试。这也是系统不让 Manager 直接拥有容器生命周期的原因：Manager 负责业务委派，Controller 负责把声明持续收敛为真实基础设施。

## Runtime 选择

Worker 配置可以选择 OpenClaw、CoPaw、Hermes 或 OpenHuman 等 Runtime。Controller 并不实现这些 Agent 的全部推理逻辑，而是准备统一的身份、工作区和环境，再由匹配的 Runtime 入口接管消息循环。这样 Worker 的基础设施生命周期与具体 Agent 框架解耦。

## 并发、休眠与预热

每个 Worker 有独立的执行循环，因此多个 Worker 可以并行。Worker 容器长期在线时，首次响应更快，但持续占用内存和进程资源；休眠后保留逻辑身份和持久文件，收到新工作时再唤醒，代价是一次冷启动延迟。这与 Sandbox 预热相似，但预热对象不仅是容器，还包括已经连接消息系统并装载工作区的 Agent Runtime。

## 故障恢复与排查

Worker 容器被删除但配置仍要求 `Running` 时，下一轮 Reconcile 会重新创建载体；新 Runtime 从对象存储恢复文件并重连 Matrix。排障应沿用户路径反向进行：

1. Element 是否可访问并能登录；
2. Manager 是否在线；
3. `agt get workers` 中期望状态和实际状态是否一致；
4. Worker 容器或 Pod 是否存在；
5. Worker 是否成功连接 Matrix；
6. 对象存储中的工作区是否可读。

这个顺序能把问题定位到产品入口、控制循环、运行载体、通信或持久文件层。

[返回报告总览](index.md) · [继续阅读 AgentSpace](agentspace.md) · [名词解释](glossary.md)
