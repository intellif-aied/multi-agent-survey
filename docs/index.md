---
layout: default
title: Multi-Agent 调度与通信调研
---

# Multi-Agent 调度与通信调研

本报告基于四个项目的本地源码，比较它们如何把“一个 Agent 应该做什么”落成可运行、可通信、可恢复的系统。重点不是模型能力排名，而是工程边界：调度的对象是什么、谁保存最终状态、任务如何进入执行进程、结果如何返回、故障后从哪里恢复。

## 结论摘要

四个项目都可以称为 Multi-Agent 系统，但它们管理的不是同一种东西：

| 项目 | 主要调度对象 | 最接近的工程类比 | 主要使用入口 |
| --- | --- | --- | --- |
| AgentTeams | 长期 Agent 身份及其 Worker 容器或 Pod | 面向 Agent 的 Kubernetes Operator | Element Web / Matrix |
| AgentSpace | 可领取、可重试的业务任务 | 带 Agent 执行器的任务队列 | Web 频道、任务与审批 |
| houmao | 可停止、恢复和人工接管的命令行 Agent 会话 | Agent 会话进程管理器 | 现有 Codex / Claude 终端与 CLI |
| omnigent | 按委派动态扩展的父子 Session 树 | 带执行主机的会话编排服务 | Web UI 与 `omnigent` CLI |

因此，讨论“哪个框架的调度更好”之前，必须先确定需要调度的是长期身份、一次业务任务、可恢复工具会话，还是临时子 Agent。

## 共同分析框架

每个项目都沿同一条端到端路径分析：

1. 用户从哪里提出请求；
2. 运维需要部署哪些服务和执行主机；
3. CLI 在产品中的职责是什么；
4. 请求怎样转化为持久状态；
5. 哪个组件领取或对齐工作；
6. 实际 Agent 进程怎样启动；
7. 消息、状态和大文件分别走什么通道；
8. 进程或主机故障后从哪里恢复。

## 关键差异

### 生命周期

- **AgentTeams** 倾向于先建立长期 Worker，再让任务持续进入该 Worker；休眠是一种资源优化。
- **AgentSpace** 长期保存逻辑员工和任务，执行进程贴近具体任务启动，不要求每个员工始终有进程。
- **houmao** 长期保存的是恢复 Agent 会话所需的运行清单；工具进程可以停止和重启。
- **omnigent** 从根 Session 开始，第一次委派时才创建 Child Session 和对应 Harness。

### 通信

- AgentTeams 使用 Matrix 房间承担可见协作，对象存储承担持久文件传递。
- AgentSpace 使用数据库中的频道、消息、任务、事件和附件形成审计记录。
- houmao 为每个 Agent 提供独立 Gateway，并用 Mailbox 做异步点对点通信。
- omnigent 通过父会话委派工具创建子会话，结果经父会话 Inbox 回传。

### 状态所有权

组合多个框架时，最大的风险不是模型不一致，而是多个系统同时声称自己拥有任务、Agent 身份或会话的最终状态。可靠设计应为每类状态指定唯一事实来源，其余系统只保存索引、投影或临时执行状态。

## 报告导航

- [AgentTeams：长期 Worker 生命周期](agentteams.md)
- [AgentSpace：持久化任务队列](agentspace.md)
- [houmao：可恢复 Agent 会话](houmao.md)
- [omnigent：父子 Session 树](omnigent.md)
- [横向对比与选型结论](comparison.md)
- [名词解释](glossary.md)
- [调研范围、方法与源码版本](methodology.md)
