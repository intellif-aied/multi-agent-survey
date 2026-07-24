---
layout: default
title: houmao 调研
---

# houmao：可恢复 Agent 会话

houmao 把 Claude Code、Codex 等命令行工具包装成有稳定身份、隔离配置、运行清单、控制入口和异步邮箱的 Agent。它默认不是另一个集中式聊天网站，核心部署对象是实际运行 Agent 的开发机或服务器。

> 核心链路：项目角色定义 → Provider Home → Brain Manifest → Launch Plan → tmux / Headless 进程 → Session Manifest → Per-Agent Gateway 与 Mailbox。

## 产品入口与参与者

典型入口是用户已经在使用的 Claude Code、Codex 或 Kimi。用户让当前“前台 Agent”创建一个后台审查员；前台 Agent 读取 Houmao Skill，再调用 `houmao-mgr` 执行确定性的创建、投递和恢复操作。人类也可以直接运行同一套 CLI。

| 参与者 | 入口 | 职责 |
| --- | --- | --- |
| Human | 现有 Claude / Codex 终端 | 用自然语言或 CLI 管理后台 Agent |
| 前台 Agent | 当前终端中的 Agent | 理解请求并通过 Skill 调用管理命令 |
| `houmao-mgr` | 管理 CLI | 初始化项目、启动、投递、查看、停止和恢复 |
| 后台 Agent | 独立 tmux 会话或 Headless 进程 | 使用自己的配置和工作目录执行任务 |
| Passive Server | 可选 HTTP 服务 | 远程发现、观察和转发控制请求 |

Skill 描述“应当做什么”，CLI 负责把启动、写清单和投递等动作精确落地。CLI 同时为人类排障和自动化脚本提供不依赖模型解释的接口。

## 部署边界

houmao 的基本使用不要求中央 Web 服务。每台执行主机需要 Python 工具、`tmux`、目标 Agent CLI 及其凭据，并将 Houmao Skill 安装给前台 Agent。

```bash
uv tool install houmao
command -v tmux
npx skills add igamenovoer/tool-skills/houmao
```

项目定义和状态主要位于项目 `.houmao` 目录及各 Agent 的运行目录。只有需要跨机器统一发现或 API 管理时才启动 Passive Server；需要邮件式异步通信时还可以部署 Stalwart。

## 端到端请求路径

以“创建 reviewer-1 审查最近提交”为例：

1. 用户在现有 Codex 或 Claude 会话中提出要求。
2. 前台 Agent 通过 Houmao Skill 调用 `houmao-mgr`，选择 reviewer 角色和 profile。
3. CLI 读取项目定义，生成 reviewer-1 的独立 Provider Home、Brain Manifest、Launch Plan 和工作目录。
4. Runtime Controller 在稳定 tmux 窗口或 Headless 后端中启动 Agent，并写入 Session Manifest。
5. 请求进入 reviewer-1 自己的 Gateway 队列；Mailbox 未读邮件也可以被转换为受控任务。
6. reviewer-1 使用独立的 Codex 会话检查代码，不污染前台 Agent 的配置和上下文。
7. 用户通过前台 Agent 或 CLI 查看状态、读取结果、追加请求、连接 tmux 人工接管，或停止后恢复。

## 角色定义与运行实例

项目定义保存可复用的角色、模型、工具、提示词和启动偏好，回答“以后怎样创建这种 Agent”。运行实例则拥有自己的工作目录、工具配置、后台终端、供应商会话标识和实时状态。

启动时，[`brain_builder.py`](https://github.com/igamenovoer/houmao/blob/main/src/houmao/agents/brain_builder.py) 合并角色与项目覆盖配置，为每个 Agent 生成隔离的 Provider Home 和 Brain Manifest；[`launch_plan.py`](https://github.com/igamenovoer/houmao/blob/main/src/houmao/agents/realm_controller/launch_plan.py) 再把声明转换为最终命令、环境变量和工作目录。

隔离 Provider Home 很重要。多个 Agent 若共用同一套 Claude Code 或 Codex 配置，认证、模型、技能和会话文件可能互相污染。

## 进程承载与恢复

交互模式把原生 Agent 界面保留在稳定 tmux 窗口中，便于观察与人工接管；Headless 模式保留稳定会话位置，但每轮任务可以启动一个独立命令行进程，便于后台自动化和结构化输出。

Session Manifest 记录 Agent 配置、工作目录、tmux 名称、供应商会话标识和控制入口。每次启动、执行、停止和恢复都会更新清单。[`RuntimeSessionController`](https://github.com/igamenovoer/houmao/blob/main/src/houmao/agents/realm_controller/runtime.py) 因此不依赖当前 Python 对象作为唯一事实来源；管理进程重启后仍能依据清单重新找到或恢复 Agent。

这三个对象职责不同：

- tmux 提供稳定的进程位置和人工接管入口；
- Session Manifest 描述怎样重新找到和恢复这次运行；
- Shared Registry 告诉其他服务当前有哪些 Agent、在哪里找到其清单和控制地址。

## Per-Agent Gateway

每个已启动 Agent 可以拥有独立 Gateway。它不是一个管理所有 Agent 的中央队列，而是单 Agent 的准入与串行化边界：

- 判断当前 Agent 是否可接收新任务；
- 将请求写入该 Agent 的 SQLite 队列；
- 顺序执行，避免同一上下文和工作目录被并发修改；
- 记录请求事件和运行状态；
- 使用运行实例编号，阻止旧请求误投到重启后的新实例。

主要实现位于 [`gateway_service.py`](https://github.com/igamenovoer/houmao/blob/main/src/houmao/agents/realm_controller/gateway_service.py) 及相邻存储模块。

## Mailbox 与发现

Mailbox 可以使用本地文件目录或 Stalwart。发送方不要求接收方同时在线；未读邮件会被渲染为有长度限制的唤醒任务，再经过 Gateway 的准入和排队规则，而不是绕过控制入口直接写入模型进程。入口见 [`mailbox_runtime_support.py`](https://github.com/igamenovoer/houmao/blob/main/src/houmao/agents/mailbox_runtime_support.py)。

Shared Registry 保存 Agent 身份、清单位置、在线期限和 Gateway 地址，用于发现和转发。真正的运行状态仍由 Agent 的 Session Manifest 与 Gateway 拥有，发现服务不会接管这一事实来源。

## 故障恢复与排查

排障应从执行主机开始：

1. `tmux` 和目标供应商 CLI 是否可用；
2. 项目角色、profile 和凭据是否正确；
3. `houmao-mgr agents list` 是否能找到目标 Agent；
4. Session Manifest 中的工作目录、tmux 名称和会话标识是否有效；
5. Gateway 状态、实例编号和请求队列是否一致；
6. Mailbox 是否完成投递和消费。

houmao 通常没有一个中央 Controller 自动重建所有本机环境，执行主机上的清单、进程和工具配置才是恢复证据。

[返回报告总览](index.md) · [继续阅读 omnigent](omnigent.md) · [名词解释](glossary.md)
