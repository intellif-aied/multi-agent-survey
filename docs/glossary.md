---
layout: default
title: 名词解释
---

# 名词解释

## 共同概念

**Agent**
读取上下文、调用模型和工具并完成任务的程序角色。它可能长期在线，也可能只为一个任务临时启动。

**Manager / Lead Agent**
理解总目标、拆分任务、选择其他 Agent 并汇总结果的协调者。它通常也是 Agent，不等同于负责启动容器的系统服务。

**Worker**
接受委派并执行具体工作的 Agent。在 AgentTeams 中，Worker 既有逻辑身份，也可能对应长期运行或休眠的容器。

**Harness（Agent 启动适配器）**
把 Claude Code、Codex 等不同 Agent 客户端包装成统一的启动、传消息和收结果接口。Harness 不是模型本身。

**Session（连续会话）**
一段可持续多轮的 Agent 对话与执行记录，通常包含消息历史、所用 Harness、工作目录和恢复标识。

## AgentTeams 与 Kubernetes

**Worker CR（Worker 配置记录）**
AgentTeams 存在 Kubernetes API 中的自定义对象。`spec` 描述希望 Worker 成为什么状态，`status` 描述当前观察到的状态。CR 是 Custom Resource 的缩写。

**Controller（持续检查程序）**
持续观察配置记录和真实运行载体的后台程序。两边不一致时执行创建、启动、停止或更新。

**Reconcile（对齐检查）**
Controller 的一轮检查：读取期望状态，观察实际状态并缩小差异。它必须可以安全地重复执行。

**Backend（运行环境驱动）**
把统一的 Worker 请求翻译为具体 Docker 容器或 Kubernetes Pod 操作。

**Pod**
Kubernetes 调度容器的最小单位，可以近似理解为由 Kubernetes 管理的一组紧密相关容器。

**Runtime（Agent 运行程序）**
容器里真正等待消息、调用模型和工具并执行任务的程序，例如 OpenClaw、CoPaw、Hermes 或 OpenHuman。

**Matrix**
开放聊天协议。AgentTeams 用房间事件传递指令、问题、进度和人工干预。

**对象存储**
通过桶和对象路径保存文件的网络服务，例如 MinIO 或 OSS。容器删除后，配置、技能、任务和结果仍可保留。

## AgentSpace

**Employee（逻辑员工）**
保存职责、权限和任务归属的业务身份，不要求始终对应一个运行进程。

**Runtime Binding（执行环境绑定）**
说明某个 Employee 应由哪一种执行环境完成任务的映射。没有绑定时任务可以存在，但系统无法自动执行。

**Daemon（常驻执行服务）**
运行在执行机器上、持续领取任务并启动具体 Agent CLI 的后台程序。

**Claim（事务领取）**
在一次数据库事务中把任务从等待改为已领取。多个 Daemon 竞争时只有一个成功，防止重复执行。

**AgentRouter（执行器路由层）**
接收统一任务请求，选择 Harness，并把不同 Agent CLI 的输出转换为统一事件。

## houmao

**Provider Home（隔离工具配置目录）**
专门为某个 Agent 准备的 Claude Code、Codex 等工具配置目录，避免多个 Agent 互相污染认证、技能和会话。

**Session Manifest（运行清单）**
记录 Agent 如何启动、工作目录、tmux 名称、供应商会话标识和控制入口的结构化文件。

**Per-Agent Gateway（单 Agent 控制入口）**
接收某个 Agent 的请求、检查准入、排队并串行执行。它不是全局调度器。

**Mailbox（Agent 邮箱）**
Agent 之间的异步收件箱。接收方不必与发送方同时在线，未读消息可以在合适时机唤醒 Agent。

**Shared Registry（在线 Agent 登记表）**
记录 Agent 是否在线、清单位置和 Gateway 地址，用于发现，不替代 Agent 自己的运行状态。

## omnigent

**AgentSpec（Agent 定义）**
描述 Agent 使用哪个 Harness、提示词、工具权限和可调用子 Agent 的配置。

**Runner（本机执行服务）**
在执行主机上准备工作目录、启动 Harness、管理进程并执行本机工具。

**Child Session（子 Agent 会话）**
父 Agent 委派时创建的独立会话，有自己的 Harness、上下文和历史。

**Inbox（父会话结果箱）**
父 Agent 接收异步子任务结果的队列。子会话完成后写入，父 Agent 读取后继续汇总。

**Active Turn（正在执行的一轮）**
一个 Session 当前处理的一条输入。同一 Session 通常限制为一轮，不同 Child Session 可以并行。

**MCP（Model Context Protocol）**
向 Agent 客户端提供工具的统一协议。平台可通过 MCP 暴露创建子会话、读取文件等能力。

[返回报告总览](index.md) · [横向对比](comparison.md)
