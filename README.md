# Multi-Agent 框架调研

本仓库汇总 Multi-Agent 框架的调度、通信、状态持久化与失败恢复设计。
当前课程以源码为依据，对比以下四个项目：

- AgentTeams：长期 Agent 身份与 Worker 容器生命周期
- AgentSpace：持久化任务队列与 Daemon 执行
- houmao：可恢复的命令行 Agent 会话
- omnigent：按需扩展的父子 Session 树

## 阅读入口

- [课程首页](lessons/index.html)
- [课程目标](MISSION.md)
- [四框架速查表](reference/multiagent-comparison.html)
- [中文名词表](reference/glossary.html)
- [AgentTeams 线性源码导览](walkthrough.md)
- [调研资料索引](RESOURCES.md)

建议从课程首页开始，依次阅读共同导论、四个仓库的端到端实现课和最终综合比较。

## 本地浏览

直接打开 HTML 可以阅读主要内容。若要同时访问课程中链接的本地源码，需将
`AgentTeams`、`AgentSpace`、`houmao`、`omnigent` 和本仓库放在同一个
`playground/` 目录下，然后运行：

```bash
docker compose -f teaching/compose.yaml up -d
```

默认监听 `0.0.0.0:18089`。Compose 网络不固定子网或容器 IP，由 Docker 自动
选择空闲网段，以减少和宿主机、局域网及其他 Docker 网络冲突。

更完整的启动与停止方式见 [teaching/README.md](teaching/README.md)。
