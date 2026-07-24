# Multi-Agent 调度与通信调研

本仓库对比四个 Multi-Agent 框架在调度对象、通信方式、执行隔离、状态所有权和故障恢复方面的设计：

- AgentTeams
- AgentSpace
- houmao
- omnigent

报告入口：[`docs/index.md`](docs/index.md)

线上版本通过 GitHub Pages 从 `docs/` 中的 Markdown 自动构建。主分支不保存生成后的 HTML。

## 报告结构

1. [调研总览](docs/index.md)
2. [AgentTeams：长期 Worker 生命周期](docs/agentteams.md)
3. [AgentSpace：持久化任务队列](docs/agentspace.md)
4. [houmao：可恢复 Agent 会话](docs/houmao.md)
5. [omnigent：父子 Session 树](docs/omnigent.md)
6. [横向对比与结论](docs/comparison.md)
7. [名词解释](docs/glossary.md)
8. [调研范围与源码版本](docs/methodology.md)

源码级证据附录：[AgentTeams 线性源码导览](docs/appendix-agentteams-source-walkthrough.md)。该文件保留 Showboat 捕获的代码片段，不作为 Pages 正文构建。

## GitHub Pages

`.github/workflows/pages.yml` 在 `main` 分支更新时构建并部署站点。仓库 Pages 设置需要使用 **GitHub Actions** 作为发布来源。
