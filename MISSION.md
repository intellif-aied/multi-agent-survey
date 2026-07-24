# Mission: 比较 Multi-Agent 系统的调度与通信设计

## Why
能够从源码解释并比较 AgentTeams、AgentSpace、houmao 与 omnigent 如何调度 Agent、Session、Runtime 和任务，以及 Human、Agent 如何交换消息、状态与产物，为后续 Multi-Agent 系统的设计、选型、实现和排障建立可靠心智模型。

## Success looks like
- 能从一次 `agt create worker` 追踪到 AgentTeams Worker 容器或 Pod 启动
- 能从 AgentSpace 的频道消息或任务追踪到队列、Daemon 抢占和 AgentRouter 执行
- 能从 houmao 的项目定义追踪到 provider home、tmux session、per-agent gateway 和 mailbox
- 能从 omnigent 的 Root Session 追踪到 `sys_session_send`、Child Session、Runner Harness 和 Inbox
- 能区分“长期 Agent 生命周期调度”和“单次任务执行调度”
- 能比较四个系统的状态所有权、通信通道、执行隔离与失败恢复
- 能根据故障现象判断应检查控制循环、任务队列、消息层、运行时还是产物存储
- 能对每个仓库说明普通用户入口、CLI 的用途、运维部署边界，并完整复述一个从请求到结果的常见用户故事

## Constraints
- 已掌握 Go 和 Docker 容器
- 使用中文短课，每课聚焦一个闭环并配有检索练习
- 每个框架都使用同一组比较问题：调度什么、谁写入工作、谁领取工作、如何选 Runtime、如何通信、如何恢复
- Kubernetes Operator、Matrix 和 Agent Runtime 概念按需引入
- 不默认读者理解项目缩写或框架术语；首次出现时先用通用中文解释，再保留英文源码名供检索
- 课程结构固定为：共同导论 → 四个仓库各自的实现课 → 综合比较；速查表用于复习，不替代实现课
- 每个仓库的实现课固定先讲产品入口、参与角色、部署方式、CLI 用途和端到端用户故事，再进入内部源码链路

## Out of scope
- 暂不深入前端界面实现、云厂商资源细节和生产参数调优；但必须交代可运行系统的部署组成与执行主机边界
- 暂不逐行学习每一种第三方 Agent Runtime 的内部实现
- 暂不做性能基准或项目成熟度排名
