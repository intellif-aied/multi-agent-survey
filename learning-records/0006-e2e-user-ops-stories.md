# 每个仓库补齐端到端用户与运维视角

用户指出，仅从内部调度入口开始会让没有产品上下文的读者迷失，例如第一课直接出现 `agt`，却没有说明它是 AgentTeams 的资源管理 CLI，而不是普通用户的聊天入口。

课程统一增加以下前置结构：

1. 普通用户实际打开或交谈的入口；
2. 人类、管理 Agent、执行 Agent、后台服务和运维人员的分工；
3. 本机体验与团队部署分别需要哪些服务；
4. CLI 是用户界面、管理工具还是供 Skill 调用的确定性执行层；
5. 一个从部署、输入、调度、执行到结果回传的常见用户故事；
6. 运维如何沿同一条链路反向排查。

四个项目的主要入口区别是：AgentTeams 以 Matrix / Element 为普通用户入口；AgentSpace 以 Web 协作空间为入口；houmao 默认借用用户现有的 Codex / Claude 终端 Agent；omnigent 同时提供 Web UI 和直接 CLI。理解入口后，再阅读 Controller、Daemon、Gateway 或 Runner 的代码。
