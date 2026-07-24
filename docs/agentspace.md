---
layout: default
title: AgentSpace 调研
---

# AgentSpace：持久化任务队列

AgentSpace 长期保存的是逻辑员工、业务任务和执行记录，而不是为每个员工长期保留一个 Codex 或 Claude 进程。任务进入数据库队列后，由部署在执行机器上的 Daemon 事务领取，再交给匹配的 Agent Harness。

> 核心链路：Web 频道或任务 → 服务层校验 → 数据库队列 → Daemon 事务领取 → AgentRouter → Codex / Claude Harness → 事件与结果写回。

## 产品入口与参与者

普通用户在 Web 协作空间中建立工作区和频道、配置数字员工、发布消息或任务、查看执行过程，并审批敏感操作。`agent-space` CLI 主要用于数据库初始化、Daemon 管理、资源维护和诊断。

| 参与者 | 入口 | 职责 |
| --- | --- | --- |
| Human | Web 频道、任务、审批 | 提出工作、查看过程并决定高风险操作 |
| Employee | 数据库中的逻辑员工记录 | 保存职责、权限和任务归属，不等于常驻进程 |
| Daemon | 执行机器上的后台服务 | 领取任务并启动本机 Agent CLI |
| 运维人员 | Docker Compose 与 CLI | 维护 Web、PostgreSQL、Daemon、凭据和 Harness |

Employee 与执行进程是两个对象。Employee 表示“谁负责”，Runtime Binding 表示“应由哪种执行环境完成”。没有 Binding 时，任务仍可出现在看板上，但不会自动启动 Agent。

## 部署边界

完整执行链至少需要 Web 服务、PostgreSQL 和一个在线 Daemon。Daemon 所在机器还要安装 Codex、Claude 等目标 CLI、凭据和项目工作目录。Daemon 可以与 Web 同机，也可以携带令牌连接远程 Server。

```bash
docker compose -f deploy/postgres/docker-compose.yml up -d
npm run db:pg:init
npm run dev:web
npm run cli -- daemon start
```

只部署 Web 和数据库能够管理频道与任务，但不会自动执行任务。Web 在线和执行能力在线是两个独立条件。

## 端到端请求路径

以“让后端工程师分析接口故障”为例：

1. 团队负责人在 Web 频道中发布需求并点名目标 Employee。
2. 服务层验证频道权限、Employee 和 Runtime Binding，保存消息并创建任务记录。
3. 可自动执行的任务进入数据库队列。
4. 匹配的 Daemon 在事务中把任务从等待状态改为已领取；多个 Daemon 同时竞争时只有一个成功。
5. Daemon 把统一请求交给 AgentRouter，后者选择 Codex、Claude 或其他 Harness。
6. Agent 在指定工作目录执行；敏感操作可暂停并等待用户审批。
7. 状态、过程事件、用量、允许公开的附件和最终回复写回数据库并显示在原频道。

## 任务创建与领取

[`packages/services/src/tasks/tasks.ts`](https://github.com/HKUDS/AgentSpace/blob/main/packages/services/src/tasks/tasks.ts) 中的任务服务先完成业务校验，再决定是否调用 `enqueueNativeTaskSync`。因此，“看板任务已经创建”和“已有程序开始执行”是两种状态。

[`packages/db/src/task-queue.ts`](https://github.com/HKUDS/AgentSpace/blob/main/packages/db/src/task-queue.ts) 保存目标执行环境、连续会话和领取状态。关键操作是事务领取：检查任务仍在等待状态和把它标记为已领取必须位于同一数据库事务，否则两个 Daemon 可能重复执行同一工作。

这个设计把可靠性锚定在任务记录上。即使实际 CLI 进程失败，系统仍知道任务属于谁、已经尝试几次、使用哪个环境、产生了什么诊断，以及是否需要重试或人工介入。

## Daemon 与 Harness 路由

[`apps/cli/src/commands/daemon.ts`](https://github.com/HKUDS/AgentSpace/blob/main/apps/cli/src/commands/daemon.ts) 负责探测本机 Agent CLI、注册执行环境、报告心跳并轮询任务。同一执行环境通常一次运行一个任务，不同执行环境可以并行。

领取成功后，[`AgentRouter`](https://github.com/HKUDS/AgentSpace/blob/main/packages/daemon/src/agent-router/router.ts) 选择对应 Harness。Harness 把 Claude Code、Codex、OpenCode 等不同的启动命令、输入方式和事件格式适配成统一接口。Daemon 管理任务生命周期，Harness 管理具体工具协议，二者不与 Employee 身份混为一体。

## 频道触发与协作边界

普通频道消息默认只是一条协作记录。只有消息明确点名当前频道中的有效 Agent，服务层才创建可执行工作。一条消息可以并行点名多个 Agent，也可以形成顺序交接；系统记录根消息与传递深度，限制 Agent 回复继续点名 Agent 所形成的递归链。

相关入口位于 [`packages/services/src/messages/messages.ts`](https://github.com/HKUDS/AgentSpace/blob/main/packages/services/src/messages/messages.ts)。这使业务协作语义位于服务层，而不是由 Daemon 猜测任意文本是否应执行。

## 结果、附件与恢复

完成处理不只是写一个 `success`。系统还保存任务看板状态、执行次数、连续会话、工作目录、过程事件、模型用量和允许公开的附件。附件经过输出清单、类型和大小限制，避免 Agent 任意暴露执行主机文件。

若 Daemon 在领取后崩溃，恢复策略必须依据持久状态判断该任务是否超时、是否已经产生外部副作用、能否安全重试，或应转人工处理。任务记录比某个短命进程的内存状态更重要。

排障路径为：Web 与数据库连接 → Employee Runtime Binding → `daemon status` → 执行机器上的 CLI 与凭据 → 队列状态 → Harness 事件 → 输出清单和最终回复。

[返回报告总览](index.md) · [继续阅读 houmao](houmao.md) · [名词解释](glossary.md)
