---
layout: default
title: 调研范围与方法
---

# 调研范围与方法

## 调研问题

本报告集中回答 Multi-Agent 系统的两个问题：

1. **如何调度**：系统管理的是 Agent、任务、会话还是进程；由谁做出委派决定；由谁保证实际执行状态。
2. **如何通信**：Human、协调 Agent、执行 Agent 和基础设施如何交换指令、状态、结果与大文件。

同时记录部署边界、CLI 职责、并发限制和故障恢复依据。前端交互细节、模型效果、吞吐基准和项目成熟度排名不在本次范围内。

## 方法

结论来自本地源码的静态阅读和各仓库说明文档。分析按用户请求到结果返回的真实执行路径展开，并用相同问题比较四个项目。报告中的“适合场景”是基于实现边界作出的工程判断，不代表项目官方定位或性能结论。

## 源码快照

调研时间：2026-07-24。

| 项目 | 仓库 | 本地源码提交 |
| --- | --- | --- |
| AgentTeams | [agentscope-ai/AgentTeams](https://github.com/agentscope-ai/AgentTeams) | `2540c968a642` |
| AgentSpace | [HKUDS/AgentSpace](https://github.com/HKUDS/AgentSpace) | `4bc16fd54ba4` |
| houmao | [igamenovoer/houmao](https://github.com/igamenovoer/houmao) | `242651c0cb7e` |
| omnigent | [omnigent-ai/omnigent](https://github.com/omnigent-ai/omnigent) | `e3a47fe9f0f3` |

后续项目演进可能使命令、文件路径或默认部署方式发生变化；涉及实际部署时应再对照目标版本文档。

## 原始资料

- [Kubernetes Controllers](https://kubernetes.io/docs/concepts/architecture/controller/)
- [Kubernetes Custom Resources](https://kubernetes.io/docs/concepts/extend-kubernetes/api-extension/custom-resources/)
- [Kubernetes Operator Pattern](https://kubernetes.io/docs/concepts/extend-kubernetes/operator/)
- [Matrix Client-Server API](https://spec.matrix.org/latest/client-server-api/)
- [AgentTeams 架构说明](https://github.com/agentscope-ai/AgentTeams/blob/main/docs/architecture.md)
- [AgentSpace README](https://github.com/HKUDS/AgentSpace/blob/main/README.md)
- [houmao README](https://github.com/igamenovoer/houmao/blob/main/README.md)
- [omnigent README](https://github.com/omnigent-ai/omnigent/blob/main/README.md)

[返回报告总览](index.md)
