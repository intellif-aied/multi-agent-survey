# Multi-Agent 调度与通信资源

## Knowledge

- [课程中文名词表](reference/glossary.html)
  将 Worker CR、Reconcile、Runtime、Harness、Session、Runner、Mailbox 等源码术语翻译成普通中文，并说明它们在系统中的具体作用。
- [本仓库源码 walkthrough](walkthrough.md)
  已从源码生成并通过 Showboat 验证的端到端实现导览。用于：课后深入某一环节及定位对应代码。
- [Kubernetes Controllers](https://kubernetes.io/docs/concepts/architecture/controller/)
  Kubernetes 官方对控制循环、期望状态和当前状态的解释。用于：理解 AgentTeams 为什么使用持续 Reconcile，而不是一次性启动命令。
- [Kubernetes Custom Resources](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/)
  Kubernetes 官方 CRD 与声明式 API 文档。用于：理解 Worker、Manager、Team、Human 为什么被建模为资源。
- [Kubernetes Operator Pattern](https://kubernetes.io/docs/concepts/extend-kubernetes/operator/)
  Kubernetes 官方 Operator 模式说明。用于：理解 Controller 如何把领域运维知识编码为自动化。
- [Matrix Client-Server API](https://spec.matrix.org/latest/client-server-api/)
  Matrix 官方规范，定义房间、事件、成员与同步。用于：理解 Agent 间可观察通信为何建立在房间事件上。
- [AgentTeams CRD 类型](agentteams-controller/api/v1beta1/types.go)
  Worker、Team、Human 和 Manager 的源码定义。用于：查看系统允许声明哪些期望状态。
- [Worker Reconciler](agentteams-controller/internal/controller/worker_controller.go)
  Worker 收敛循环入口。用于：追踪调度阶段、状态更新和删除 finalizer。
- [共享 Member 收敛阶段](agentteams-controller/internal/controller/member_reconcile.go)
  基础设施、配置与容器三个公共阶段。用于：理解独立 Worker 与兼容 Team 成员如何复用调度逻辑。
- [Provisioner](agentteams-controller/internal/service/provisioner.go)
  Matrix、Gateway 与存储身份的跨系统编排。用于：理解“创建 Agent”为什么不只是创建容器。
- [AgentSpace 源码 walkthrough](/home/aied/liujingyi/playground/AgentSpace/walkthrough.md)
  AgentSpace 的线性源码导览。用于：从入口一路追踪任务、Daemon、AgentRouter、消息和完成闭环。
- [AgentSpace 任务服务](/home/aied/liujingyi/playground/AgentSpace/packages/services/src/tasks/tasks.ts)
  创建协作任务并按 Employee runtime binding 决定是否进入原生执行队列。
- [AgentSpace 持久化队列](/home/aied/liujingyi/playground/AgentSpace/packages/db/src/task-queue.ts)
  入队、运行时绑定、会话关联和事务抢占的核心实现。
- [AgentSpace Daemon](/home/aied/liujingyi/playground/AgentSpace/apps/cli/src/commands/daemon.ts)
  Runtime 探测、注册、心跳、轮询以及按 Runtime 控制并发的入口。
- [AgentSpace AgentRouter](/home/aied/liujingyi/playground/AgentSpace/packages/daemon/src/agent-router/router.ts)
  将统一执行请求转换为不同 CLI harness 的启动与事件流。
- [AgentSpace 消息服务](/home/aied/liujingyi/playground/AgentSpace/packages/services/src/messages/messages.ts)
  频道消息、Agent mention、并行触发与顺序交接的协作逻辑。
- [houmao 源码 walkthrough](/home/aied/liujingyi/playground/houmao/walkthrough.md)
  从项目 catalog、brain manifest 和 provider home 走到 tmux session、gateway、mailbox 与 relaunch authority。
- [houmao Runtime Controller](/home/aied/liujingyi/playground/houmao/src/houmao/agents/realm_controller/runtime.py)
  managed agent 的启动、提示、持久化、停止与恢复入口。
- [houmao Per-Agent Gateway](/home/aied/liujingyi/playground/houmao/src/houmao/agents/realm_controller/gateway_service.py)
  单个 Agent 的请求准入、SQLite 队列、串行执行和状态跟踪。
- [houmao Mailbox](/home/aied/liujingyi/playground/houmao/src/houmao/agents/mailbox_runtime_support.py)
  filesystem 或 Stalwart mailbox 如何绑定长期 Agent 身份。
- [omnigent 源码 walkthrough](/home/aied/liujingyi/playground/omnigent/walkthrough.md)
  从 Server、Session 和 Host/Runner 走到 Harness、事件、中继和持久化。
- [omnigent Multi-Agent 分析](/home/aied/liujingyi/playground/omnigent/multi-agent.md)
  `sys_session_send` 惰性创建 Child Session、异构 Harness 执行和 Inbox 回传的源码索引。
- [omnigent Sub-Agent Dispatch](/home/aied/liujingyi/playground/omnigent/omnigent/runner/tool_dispatch.py)
  Child Session 创建或复用、消息投递、权限检查与完成回传。
- [omnigent Session API](/home/aied/liujingyi/playground/omnigent/omnigent/server/routes/sessions.py)
  Session、父子关系、Runner affinity 与持久化控制面。

## Wisdom (Communities)

- [AgentTeams GitHub Discussions](https://github.com/agentscope-ai/AgentTeams/discussions)
  与维护者和使用者核对架构取舍及真实部署问题。用于：源码无法回答的演进原因与实践反馈。

## Gaps

- 完成交叉比较后，再根据练习表现收窄到用户最终希望独立实现的调度能力。
