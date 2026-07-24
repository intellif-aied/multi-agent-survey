---
layout: default
title: omnigent 调研
---

# omnigent：父子 Session 树

omnigent 将每个 Agent 运行实例表示为独立 Session。根 Agent 第一次委派任务时，系统按需创建 Child Session 并启动对应 Harness；子任务异步完成后，结果写入父会话 Inbox。多个 Agent 因而形成一棵有权限边界的会话树。

> 核心链路：AgentSpec → 根 Session → Server 路由 → Host / Runner → Harness → `sys_session_send` → Child Session → 父会话 Inbox。

## 产品入口与参与者

用户可以运行 `omnigent` 打开本地 Web UI，也可以使用 `omnigent claude`、`omnigent codex` 直接进入原生 CLI Agent。仓库中打包的多 Agent 定义可通过 `omnigent run examples/polly/` 启动。

| 参与者或程序 | 入口 | 职责 |
| --- | --- | --- |
| Human | Web UI 或 `omnigent` CLI | 选择 Agent、创建会话、发送任务并观察会话树 |
| Server | 中央 HTTP 与事件服务 | 保存用户、AgentSpec、Session、事件、文件和权限 |
| Host | `omnigent host` | 让有代码、工具和凭据的机器成为执行主机 |
| Runner | Host 内部执行服务 | 准备工作目录并启动 Harness |
| Harness | Claude、Codex 或 API Agent 适配器 | 统一启动、输入、事件和工具调用 |

与 AgentTeams 的运维 CLI 不同，`omnigent` CLI 也是用户入口：它负责登录、启动本地产品、直接运行 Agent、连接远程 Server、启动 Host 和附加会话。

## 部署边界

单机使用可以启动 Server 和 Host；团队部署则用 `deploy/` 下的 Docker Compose 运行 Server，开发者机器通过 `omnigent login https://your-host` 登录后运行 `omnigent host https://your-host`。Host 主动连接 Server，因此开发者机器通常不需要开放入站端口。

Server 在线只代表会话状态和 Web 可用。要在某台机器的仓库中运行 Codex 或 Claude，那台机器还必须有在线 Host、对应 Harness CLI、凭据和代码目录。

## 端到端请求路径

以 Polly 根 Agent 拆分“实现建议与测试建议”为例：

1. 运维部署 Server，开发者在代码所在机器启动 Host。
2. 用户选择多 Agent 定义并创建根 Session。
3. Server 保存根会话及权限，并把它绑定到在线 Runner。
4. Runner 准备工作目录，根据 AgentSpec 启动根 Harness。
5. 根 Agent 调用 `sys_session_send(agent="codex")` 或其他逻辑子 Agent。
6. Runner 检查调用权限；首次委派时请求 Server 创建直接 Child Session，并让它保持同一 Runner affinity。
7. 子 Session 使用自己的 Harness、上下文和历史独立执行；多个子 Session 可以并行。
8. 完成、失败或取消结果写入根 Session 的 Inbox。
9. 根 Agent 调用 `sys_read_inbox` 读取结果并向用户汇总；Server 保存整棵会话树供追踪与恢复。

## 核心对象

| 对象 | 含义 | 主要职责 |
| --- | --- | --- |
| AgentSpec | Agent 定义 | 声明提示词、Harness、工具权限和可调用子 Agent |
| Session | 一次连续 Agent 会话 | 保存历史、状态、父子关系和 AgentSpec 快照 |
| Server | 中央状态服务 | 保存会话树、权限、事件、文件和执行主机绑定 |
| Runner | 本机执行服务 | 准备目录、管理进程和执行本机工具 |
| Harness | Agent 启动适配器 | 对接 Claude Code、Codex 或模型 API |

根会话的启动路径大致为 [`server/routes/sessions.py`](https://github.com/omnigent-ai/omnigent/blob/main/omnigent/server/routes/sessions.py) → Host 连接 → Runner 应用。Server 决定持久状态和路由，Runner 负责本机进程，Harness 负责具体 Agent 客户端协议。

## 原生 CLI Agent 与 API Agent

对于 API Agent，Runner 可以直接构造模型请求并执行返回的工具调用。对于 Claude Code、Codex 等原生客户端，平台无法任意改写其内部每次请求，因此通过启动配置、终端桥接、技能和 MCP 向其提供平台工具。

Harness 隔离了这种差异。Server 和 Session 模型不需要理解每个供应商的终端协议，只处理统一事件、工具请求和生命周期。

## 子会话的惰性创建

`sys_session_send` 不是向现有终端写一段字符串，而是完整的子 Agent 调度入口：

1. 检查父 AgentSpec 是否允许调用目标逻辑 Agent；
2. 查找同名、同标题的直接 Child Session；
3. 不存在时创建子会话，写入 `parent_session_id`、根会话编号和 Runner affinity；
4. 根据子 AgentSpec 启动 Harness；
5. 投递第一条消息并立即返回异步任务标识。

后续委派可以复用已有 Child Session，从而保留上下文。父 Agent 默认只能控制自己的直接子节点；子 Agent 是否还能继续创建下一层，由自己的 AgentSpec 权限决定。

相关入口为 [`runner/tool_dispatch.py`](https://github.com/omnigent-ai/omnigent/blob/main/omnigent/runner/tool_dispatch.py) 和 Session API。

## Inbox、并发与权限

子 Session 独立执行，结果进入父会话 Inbox。父子关系解决“谁有权控制谁”，Inbox 解决“异步完成后结果怎样可靠送回”。只保存父子关系会缺少完成通知与结果队列；只保存 Inbox 则无法验证调用权限和展示执行树。

同一 Session 同时只处理一个 Active Turn，以保护共享上下文；不同 Child Session 是独立执行单元，可以使用不同 Harness 并行。omnigent 不额外运行一个隐藏的中央 Lead LLM，根 Agent 本身可以承担拆解与汇总职责。

## 故障恢复与排查

Server 持久保存 Session、父子关系和事件，Runner 管理实际进程。Runner 断开不会删除会话记录；重新绑定可用执行主机后，可依据会话状态重启 Harness。排障链路为：

1. Server、数据库和登录是否正常；
2. Web 中是否存在在线 Host；
3. Session 绑定了哪个 Runner；
4. 该机器是否具备 Harness CLI、凭据和代码目录；
5. 根 Session 是否实际创建 Child Session；
6. 子会话事件是否结束；
7. 结果是否写入父会话 Inbox。

网页可打开并不表示执行主机已经就绪。

[返回报告总览](index.md) · [查看横向对比](comparison.md) · [名词解释](glossary.md)
