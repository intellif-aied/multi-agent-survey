---
layout: default
title: 横向对比与结论
---

# 横向对比与结论

## 调度对象决定系统形态

| 维度 | AgentTeams | AgentSpace | houmao | omnigent |
| --- | --- | --- | --- | --- |
| 主要调度对象 | 长期 Worker 身份与运行载体 | 可领取的业务任务 | 可恢复的 Agent 会话 | 父子 Session 树 |
| 长期保存 | CR 状态、聊天身份、对象存储工作区 | Employee、任务、消息、执行记录 | 角色定义、Provider Home、Session Manifest | AgentSpec、Session、事件、父子关系 |
| 实际进程 | Worker 容器或 Pod | 任务到来时启动的 Agent CLI | tmux 中长期界面或每轮 Headless 进程 | Runner 启动的 Harness |
| 空闲状态 | 容器在线或休眠 | 没有 Agent 进程也成立 | 会话可在线、停止或恢复 | 未委派前没有 Child Session |

AgentTeams 适合身份先存在、任务持续进入的团队；AgentSpace 适合围绕业务任务做可靠领取与审计；houmao 适合保留真实 CLI Agent 的连续会话并允许人工接管；omnigent 适合由根 Agent 动态展开异构子 Agent。

## 委派决定与基础设施保证

| 项目 | 谁决定交给谁 | 基础设施保证什么 |
| --- | --- | --- |
| AgentTeams | Manager、Team Leader 或 Human 根据上下文选择 Worker | Worker 身份存在、运行载体达到期望状态、消息通道可用 |
| AgentSpace | 频道点名、任务负责人和 Runtime Binding 确定目标 | 任务仅被一个 Daemon 领取，由匹配 Harness 执行 |
| houmao | Human、前台 Agent 或显式流程选择已登记 Agent | 找到正确运行实例，按单 Agent 队列投递并保存恢复依据 |
| omnigent | 父 Harness 根据 AgentSpec 调用逻辑子 Agent | 权限检查、Child Session 创建或复用、结果回到父会话 |

四者都没有把业务拆解完全硬编码在基础设施中。基础设施主要保证身份、路由、执行和恢复；“为什么选择这个 Agent”通常来自 Human、Lead Agent 或业务规则。

## 通信模型

| 项目 | 协调通道 | 文件或结果通道 | 协作特征 |
| --- | --- | --- | --- |
| AgentTeams | Matrix 房间事件 | MinIO / OSS 工作区 | Human、Manager、Worker 共享可见时间线 |
| AgentSpace | 数据库频道、消息和任务 | 受控附件、事件与任务结果 | 以业务看板、审批和审计记录为中心 |
| houmao | Per-Agent Gateway | Mailbox、运行目录和结构化结果 | 独立 Agent 点对点通信，可异步唤醒 |
| omnigent | 父会话委派工具与事件 | 父会话 Inbox、Session 文件 | 根 Agent 动态拆分并汇总子任务 |

## 并发边界

- AgentTeams：每个 Worker 是独立执行循环，多个 Worker 可以并行。
- AgentSpace：同一 Runtime 环境通常一次执行一个任务，不同环境可并行。
- houmao：单 Agent Gateway 串行处理请求，多个 Agent 彼此独立。
- omnigent：同一 Session 一次只有一个 Active Turn，不同 Child Session 可并行。

并发限制不是简单的线程数问题。真正需要保护的是共享上下文、工作目录、供应商会话和外部副作用。

## 故障恢复

| 故障 | 首先检查的持久状态 | 典型恢复动作 |
| --- | --- | --- |
| AgentTeams Worker 消失 | Worker 配置记录与对象存储工作区 | Reconcile 重建载体，Runtime 恢复文件并重连 Matrix |
| AgentSpace 执行进程失败 | 任务状态、领取者、次数、诊断与连续会话 | 判断是否安全重试、更换环境或转人工 |
| houmao Agent 停止 | Session Manifest、tmux、Provider Home、Registry | 校验原运行信息并恢复稳定窗口和 Gateway |
| omnigent Runner 断开 | Server 中的 Session、父子关系、事件和 Runner 绑定 | 重新绑定 Host 并重启 Harness |

恢复机制反映了各项目真正信任的状态源：AgentTeams 信任声明和对象存储；AgentSpace 信任数据库任务记录；houmao 信任执行主机上的清单；omnigent 信任 Server 中的会话树。

## CLI 角色对比

| CLI | 主要使用者 | 是否是普通用户入口 |
| --- | --- | --- |
| `agt` | 运维、Manager Skill、自动化脚本 | 否；用户通常使用 Matrix |
| `agent-space` | 运维、开发者、Daemon 管理脚本 | 通常不是；用户使用 Web |
| `houmao-mgr` | Human、前台 Agent Skill、自动化脚本 | 可以直接使用，但常由现有 Agent 间接调用 |
| `omnigent` | Human 与运维 | 是；同时承担 Web 启动、登录、Host 和直接 Agent 入口 |

## 选型建议

- 需要长期团队成员、共享聊天室、休眠唤醒和容器自愈：优先参考 AgentTeams。
- 需要业务任务看板、可靠领取、审批、执行记录和重试：优先参考 AgentSpace。
- 需要保持 Claude/Codex 真实会话、隔离配置、tmux 接管和跨重启恢复：优先参考 houmao。
- 需要根 Agent 动态创建异构子 Agent、显示调用树并异步汇总：优先参考 omnigent。

这些能力可以组合，但必须先划分状态所有权。例如：AgentTeams 拥有长期 Agent 身份，AgentSpace 拥有业务任务最终状态，houmao 拥有某个工具会话的恢复清单，omnigent 只管理一次任务内部的子会话树。若多个系统都能独立重试同一个外部操作，组合后反而更容易重复执行。

## 对新系统设计的启示

1. 先定义调度对象，再选择队列、Controller 或会话树。
2. 将业务委派与基础设施收敛分开，避免 Lead Agent 直接承担容器自愈。
3. 为消息、状态和大文件选择不同的合适通道。
4. 每类状态只指定一个最终事实来源。
5. 在执行前定义幂等键、并发边界和重试语义，而不是在故障后补救。
6. 用户入口、管理 CLI、中央服务和执行主机必须在部署文档中明确区分。

[返回报告总览](index.md) · [名词解释](glossary.md) · [调研方法](methodology.md)
