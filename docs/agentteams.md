---
layout: default
title: AgentTeams 调研
---

# AgentTeams：以 Matrix 为协作入口的多 Agent 运行平台

AgentTeams 可以先理解成一个**自建的多 Agent 聊天协作产品，再加上一层 Agent 容器管理能力**：普通用户打开 Element 网页聊天；Tuwunel 保存并转发 Matrix 消息；Manager 和 Worker 背后则运行不同的 Agent Runtime。AgentTeams 本身不重新实现这些 Runtime 的推理循环，而是负责把它们组织成一个用户可见、可以介入的团队。[官方 README 对产品的定义][readme-product]

这个判断比“长期 Agent 身份及其运行载体的生命周期”更接近用户实际看到的产品，也比“一个 Web 界面下面挂着若干 Claw”更完整：

- **从用户协作看，Matrix 是核心**：谁在什么房间里对谁说了什么，都通过 Matrix 表达；
- **从任务执行看，Agent Runtime 是核心**：真正调用模型、读取上下文和使用工具的是 OpenClaw、QwenPaw、Hermes 或 OpenHuman；
- **从系统运行看，Controller 与对象存储不可缺少**：Controller 创建账号、房间和进程，对象存储让重建后的进程找回文件；
- **从模型和工具访问看，Higress 是统一网关**：模型和 MCP 工具调用经它转发，真实凭证不直接交给 Worker。[架构说明中的三条通信路径][architecture-communication]

本文核对的源码快照是本地 AgentTeams 提交 [`2540c968a642`][source-commit]。

## 官方架构图

[![AgentTeams 官方架构图](https://img.alicdn.com/imgextra/i4/O1CN01c1VlDE1zYZ46EW3OA_!!6000000006726-49-tps-9895-8231.webp)][readme-product]

*图：AgentTeams 官方 README 中的架构图。它把浏览器、Element、Tuwunel、Manager/Worker Runtime、Higress 和对象存储放在同一张图里。*

把图进一步压缩成请求方向，可以得到下面这个更适合阅读源码的版本：

```text
用户浏览器
  └─ Element Web（聊天界面）
       └─ Matrix Client-Server API
            └─ Tuwunel（账号、房间、消息事件）
                 ├─ Manager 账号 ↔ Manager Runtime 进程
                 └─ Worker 账号  ↔ Worker Runtime 进程

Manager / Worker Runtime
  ├─ 模型与 MCP 请求 → Higress → LLM / MCP Server
  └─ 配置、任务文件和结果 → MinIO / OSS

Manager Skill / agt → Controller API
  └─ 创建并维护账号、房间、配置以及容器或 Pod
```

## 用户真正使用的产品

普通用户的入口是 **Element Web 或其他 Matrix 客户端**，不是 `agt`，也不是 Controller API。用户登录后看到的是一个类似企业 IM 的界面：

1. 与 Manager 的私聊，用自然语言要求它创建成员、组织团队或拆分工作；
2. 每个 Worker 的协作房间，在里面直接布置任务、观察进度和追加要求；
3. 使用 Team 功能时的团队房间，Team Leader、多个 Worker 和获准加入的人在同一条时间线中协作；Manager 通过另一个 Leader Room 只与 Team Leader 对接。

官方快速开始也是按“登录 Element → 私聊 Manager 创建 Alice → 打开 Alice 房间分配任务”的顺序组织，而不是让普通用户先学习 Kubernetes 资源或 CLI。[快速开始：登录与创建 Alice][quickstart-user]

| 用户界面中的对象 | 背后的实际对象 |
| --- | --- |
| `manager` 联系人 | 一个 Matrix 账号，加上一个 OpenClaw 或 QwenPaw Manager 进程 |
| `alice` 联系人 | 一个 Matrix 账号，加上一个可运行或休眠的 Worker 进程 |
| “Worker: alice” 房间 | Tuwunel 中的 Matrix Room；最简单场景下包含用户、Manager 和 Alice |
| 聊天消息 | Matrix 的 `m.room.message` 事件 |
| `@alice` | 消息正文中的可见账号，以及 `m.mentions.user_ids` 中的结构化目标 |
| 任务附件、代码和结果 | 小文件可以作为 Matrix 媒体发送；系统协作文件主要放在 MinIO/OSS 路径中 |

因此，Manager 和 Worker **不是 Element 页面里的前端组件**。Element 只是把房间和消息画出来；真正的 Agent 进程可以在另一容器、另一台主机或 Kubernetes Pod 中运行，只要它能以自己的 Matrix 身份连接同一 Homeserver。

## Matrix 在这里到底是什么

### 六个容易混淆的概念

| 概念 | 在 AgentTeams 中的含义 |
| --- | --- |
| **Matrix** | 一套开放的即时通信协议，规定客户端如何登录、创建或加入房间、发送事件以及增量同步新事件。它不是某个具体网页。 |
| **Tuwunel** | AgentTeams 自带的 Matrix Homeserver，即真正管理本地账号、房间成员关系和房间事件的服务端。Controller 的实现直接调用它的 `/_matrix/client/v3/...` API。[Matrix Client 实现][matrix-client] |
| **Element Web** | 浏览器 Matrix 客户端，类似企业 IM 的网页版。它调用 Tuwunel，而不是自己保存 Agent 状态或执行任务。[Element 配置脚本][element-config] |
| **Matrix 账号** | Human、Manager 和每个 Worker 的通信身份，例如 `@manager:matrix.example.com`、`@alice:matrix.example.com`。账号登录后获得 Access Token（登录令牌），以该身份调用 Matrix API。[账号注册实现][matrix-register] |
| **Room** | 有独立成员列表、权限和事件时间线的聊天室。Matrix 中的“私聊”本质上也是标记为 direct 的 Room，不是绕过服务器的点对点 Socket。[房间请求结构][matrix-types] |
| **Event** | 房间中的一条结构化记录。普通文本是 `m.room.message`；成员变化、房间名和加密设置是状态事件；AgentTeams 还写入 `room.meta` 来标记这是 Worker Room、Team Room 还是 Direct Room。[房间元数据实现][room-meta] |

这里的 Homeserver 可以类比为自建的 Slack/企业微信服务端，Element 是它的 Web 客户端。两者常被一起安装，但并不是同一个东西。本地默认访问 Element UI 的端口与 Matrix/Higress Homeserver 入口也不同；把 Element 的页面地址当成 Homeserver 地址会登录失败。[官方 FAQ 的端口说明][faq-homeserver]

### 房间如何组织 Human、Manager 和 Worker

最简单的单 Worker 拓扑是：

```text
Manager 私聊房间
  └─ Human Admin + Manager

Worker: alice 房间
  └─ Human Admin + Manager + Alice
```

Controller 创建 Worker 时会依次确保 Alice 的 Matrix 账号存在，创建 `Worker: alice` 房间，邀请管理员、协调者和 Alice，并让 Alice 加入自己的房间。[Worker 房间创建源码][worker-room]

Team 模式不是把所有人塞进一个大群，而是明确分成四类房间：

```text
Leader Room：Manager + Global Admin + Leader
Team Room：  Leader + Team Admin + Workers（没有 Manager）
Worker Room：Leader + Team Admin + 单个 Worker
Leader DM：  Team Admin + Leader
```

Manager 只在 Leader Room 把任务交给 Team Leader；Leader 再在 Team Room 中用结构化 `@mention` 指向具体 Worker。这样 Manager 不会越过 Leader 直接调度团队成员，而 Team Admin 仍能看到团队内部的任务来源、进展与交接。[官方 Team 房间拓扑][team-topology] Controller 源码还给这些房间写入不同的 `room.meta.roomKind`，避免 Runtime 只靠房间名称猜测用途。[Team 房间创建源码][team-room]

### 一条消息是怎样到达 Agent 的

以用户在 Alice 房间发送 `@alice 修改登录页` 为例：

1. Element 使用用户的 Access Token，向 Tuwunel 的房间消息接口写入一个 `m.room.message` 事件；
2. 事件正文包含人类能读到的 `@alice:domain`，`m.mentions.user_ids` 同时记录机器可判定的目标账号；
3. Alice Runtime 内的 Matrix Channel/Adapter 通过同步循环收到事件，先检查房间、发送者和 mention 策略，再把允许处理的文本交给 Agent Runtime；
4. Runtime 调用模型和工具完成工作；
5. Alice 仍以自己的 Matrix 账号向同一房间发送进度或结果事件，Element 随后同步并显示出来。

AgentTeams 的 Worker 默认要求群聊消息明确 mention 自己。只有正文里看起来像 `@alice`、但没有正确的 `m.mentions.user_ids`，不同 Runtime 可能把它当普通聊天而忽略。Manager 的 Matrix Skill 因而同时要求“可见的完整账号”和“结构化 mention”一致。[Matrix Skill 的 mention 规则][matrix-skill] [QwenPaw Channel 的过滤实现][copaw-matrix]

结构化 mention 还连接了通信与生命周期：当 Worker 处于 `Sleeping` 时，Tuwunel 可以通过 Matrix Application Service（一种由 Homeserver 主动推送事件的回调机制）把带 mention 的事件推给 Controller；Controller 核对房间和目标账号后把对应 Worker 改回 `Running`，再由正常的对齐循环启动运行载体。[休眠 Worker 唤醒实现][matrix-wakeup]

这说明 Matrix 不是简单的日志界面，而是任务通知与人工介入的实际消息总线。但也不能说“AgentTeams 的所有流量都走 Matrix”：模型请求、共享文件和容器管理分别走 Higress、对象存储和 Controller API。

## Manager 和 Worker 下面实际运行什么

AgentTeams 把“平台角色”和“Agent Runtime”分成两层：

- **Manager / Worker** 表示这个 Agent 在团队里负责协调还是执行；
- **OpenClaw / QwenPaw / Hermes / OpenHuman** 表示容器里究竟由哪个程序接收消息、调用模型并运行工具。

| Runtime | Manager | Worker | 当前实现中的职责 |
| --- | --- | --- | --- |
| **OpenClaw** | 支持 | 支持 | Node.js Agent Gateway；可加载 AgentTeams 的 prompts、skills 和 Matrix 配置 |
| **QwenPaw / CoPaw** | 支持 | 支持 | Python / AgentScope 路径；Manager 仍使用 `copaw`，Worker 代码同时识别兼容值 `copaw` 和较新的 `qwenpaw`，通过自己的 Matrix Channel 接入 |
| **Hermes** | 不支持 | 支持 | Python `hermes-agent` Worker；AgentTeams 提供配置桥接、文件同步和 Matrix policy overlay |
| **OpenHuman** | 不支持 | 源码已接入 | Rust `openhuman-core` Worker；使用原生 Matrix feature，并由入口脚本接入统一配置和存储 |

当前 Manager 入口脚本只识别 `openclaw` 与 `copaw`；其他值会落回 OpenClaw。Hermes 和 OpenHuman 都是 Worker-only。[Manager 入口的 Runtime 分支][manager-runtime] Worker 后端则明确识别四种 Runtime，并为它们选择不同镜像。[Worker Runtime 常量与校验][worker-runtimes]

这里有三个需要特别说明的版本差异：

1. 官方 README 的主要架构图和“多运行时协作”段落还重点展示 OpenClaw、QwenPaw、Hermes；当前源码已经额外接入 OpenHuman Worker；
2. 本地 Worker 后端和 `agt` 已识别 OpenHuman，但同一提交中的 Worker CRD 枚举还没有列出 `openhuman`；因此它是“已有运行时接入代码，但声明式入口尚未完全对齐”，不能简单理解为所有部署方式都已无差别支持；[Worker CRD 的 Runtime 枚举][worker-crd]
3. README 的 Helm 参数表把 Hermes 写进 Manager 可选项，但当前 Manager 配置格式与实际入口都只允许或启动 `openclaw`、`copaw`。本报告以可执行源码为准。[Manager 配置格式][manager-crd]

所以“下面都是某种 Claw”是便于入门、但并不严格的说法。更准确地说，下面是**可替换的 Agent Runtime**；OpenClaw 只是其中一种，Hermes 与 OpenHuman 有自己的 Agent loop 和 Matrix 接入实现。

## Matrix、Controller、MinIO 和 Higress 各负责什么

| 组件 | 用普通语言描述 | 不负责什么 |
| --- | --- | --- |
| **Tuwunel / Matrix** | 保存账号、房间成员和消息事件，让 Human 与多个 Agent 看见同一段协作过程 | 不运行模型，不创建容器，不保存完整代码工作区 |
| **Controller** | 接收“创建/更新/休眠 Worker”等确定性请求，确保账号、房间、配置和容器或 Pod 最终真的存在 | 不承担每条任务消息的推理，不代替 Manager 拆任务 |
| **MinIO / OSS** | 保存 Manager/Worker 配置、skills、共享任务目录、代码和结果，使新容器能恢复文件 | 不负责聊天时间线，也不决定哪个 Agent 应该工作 |
| **Higress** | 代理 LLM 与 MCP 请求，按 Agent 身份检查权限，并在网关侧持有真实上游凭证 | 不执行 Agent loop，也不保存 Matrix 房间历史 |
| **Element Web** | 把 Matrix 房间渲染成用户可操作的网页聊天界面 | 不调度 Worker，也不直接调用 LLM |

### Controller：把自然语言决定落实成确定性资源

Manager 可以理解“创建一个前端 Worker Alice”这样的自然语言，但不应靠模型临时拼出一串 `docker run`。它加载 `worker-management` Skill，调用 `agt create worker`；`agt` 再调用 Controller REST API。[Manager Worker Skill][worker-skill] [`agt create worker` 源码][agt-create]

Controller 随后执行可重复的创建流程：

1. 保存 Worker 配置；
2. 注册或复用 Matrix 账号；
3. 创建或解析固定别名的 Worker Room；
4. 在 Higress 中创建这个 Worker 的网关身份，并授权它访问所需的模型路径；
5. 生成统一的 Runtime 配置与 skills；
6. 根据 `runtime` 选择镜像，通过 Docker、Kubernetes Pod 或配置的后端启动进程；
7. 持续检查配置与真实状态是否一致，进程丢失时重新创建。

源码中把第 7 步称为 **Reconcile**，这里可以直接理解为“反复检查并补齐差异”。它解决的是基础设施生命周期，不是模型如何思考。[Worker Controller][worker-controller] [Worker Provisioner][worker-room]

### MinIO / OSS：共享文件和可恢复工作区

聊天适合传任务说明、问题、状态和人工纠正，不适合反复复制整个代码目录。AgentTeams 把 `agents/<name>/...`、`shared/tasks/...` 和 Manager 工作区等路径放在对象存储；Runtime 启动时拉取配置和文件，工作中再同步修改。[架构文档的存储说明][architecture-storage] [OpenClaw Worker 入口][openclaw-entrypoint]

这既降低了跨 Agent 传递大上下文的成本，也使容器可替换。但“文件可恢复”不等于“正在进行的一次模型调用可以从中断点精确续跑”：容器内存、临时子进程和尚未落盘的状态仍可能丢失。

### Higress：模型与工具的受控出口

Worker 通常只得到自己的 Consumer Token（可以理解成这个 Worker 的“网关工牌”）。它向 Higress 发出 OpenAI-compatible LLM 请求或 MCP 工具请求，由网关检查该身份能访问哪些网关路径（Route），并在网关侧使用真实 API Key、GitHub PAT 等凭证。[架构文档的网关说明][architecture-gateway]

因此，Matrix 消息和 LLM 请求是两条不同路径：Tuwunel 告诉 Alice“要做什么”，Higress 才承载 Alice“调用哪个模型或工具去做”。

## 用户视角的端到端请求路径

**本节前提是系统已经部署完成，用户已经能登录 Element，Manager 也在线。安装 Docker、配置域名、部署 Helm 不属于这条用户请求路径，统一放在下一节。**

### 第一次：创建 Worker Alice

1. 用户在 Element 中私聊 Manager：“创建一个负责前端开发的 Worker Alice。”
2. Element 把消息作为 `m.room.message` 写入 Manager 私聊房间；Tuwunel 将新事件同步给 Manager Runtime。
3. Manager Runtime 调用模型理解意图，并按 Worker Skill 询问缺少的 Runtime、角色描述和 skills 等信息。
4. 信息确定后，Manager 调用 `agt create worker --no-wait`。这一步是产品内部的资源创建动作，不要求普通用户打开终端。
5. Controller 注册 Alice 的 Matrix 身份，创建 Alice 房间，准备对象存储配置和 Higress 身份，然后启动对应 Runtime 的容器或 Pod。
6. Alice 加入房间后，Element 同步到新的房间和成员事件；用户看到 `Worker: alice` 出现在侧边栏。

这条路径与官方 Quickstart 的 POC 一致：Manager 是自然语言入口，Controller 是确定性执行者，Element 最终把新房间展示给用户。[Quickstart 的创建结果][quickstart-create]

### 日常：让 Alice 修改登录页

1. 用户打开 `Worker: alice` 房间，通过 Element 的 `@` 补全选择 Alice，发送具体任务；
2. Tuwunel 保存消息事件，并把事件同步给房间成员；如果 Alice 在休眠，结构化 mention 还会触发唤醒；
3. Alice 的 Matrix Adapter 通过发送者白名单和 mention 规则后，把任务交给选定的 Agent Runtime；
4. Runtime 读取已同步的工作区，经过 Higress 调用 LLM 和 MCP 工具，必要时在 `shared/tasks/...` 或自己的工作区写文件；
5. Alice 以自己的 Matrix 账号在房间中报告进度、问题和结果；Manager 与用户都能看见；
6. 用户可以在同一房间追加要求或纠正方向。新的要求仍是普通 Matrix 事件，不需要走另一套人工介入接口；
7. 最终摘要留在 Matrix 时间线，代码、任务规格和结果文件留在对象存储或外部 Git 仓库。

如果用户改为直接私聊 Alice，群聊所需的 `@mention` 可以省略，但 Manager 看不到那段私聊，因此不适合需要 Manager 持续协调和审计的任务。[官方 FAQ：群聊与私聊差异][faq-worker-chat]

### 多 Worker 时发生了什么

多 Worker 并不是让几个模型共享同一块内存。Manager 或 Team Leader 会：

1. 把整体目标拆成若干任务规格，写入共享任务目录；
2. 在可见的 Team/Project Room 中 `@mention` 具体 Worker；
3. 每个 Worker Runtime 独立处理自己的 Matrix 事件并并行执行；
4. Worker 把结果写入共享目录，并在房间中 mention 协调者；
5. 协调者读取结果、安排下一项任务或向用户汇总。

AgentTeams 的 agent-facing Skill 明确规定：仅创建任务记录不算真正分配，必须在团队房间发送带完整 Matrix mention 的可见消息，Worker 才收到开始工作的通知。[Team Leader 通信规则][team-communication]

## 部署与运维

这一节描述的是平台如何上线和排障，与上一节“用户发出一次任务后发生什么”分开。

### 本地单机：Docker / Podman

从源码可以运行 `make install`，官方 README 也提供安装脚本。当前多容器形态如下：[本地架构说明][architecture-local]

```text
agentteams-controller（嵌入式基础设施容器）
  ├─ Higress
  ├─ Tuwunel
  ├─ MinIO
  ├─ Element Web + nginx
  └─ Go Controller REST API

agentteams-manager（独立 Manager Runtime 容器）
agentteams-worker-*（创建 Worker 后按需出现的独立容器）
```

这里 `agentteams-controller` 是一个交付包装：为了本地安装方便，多个基础设施进程被放在同一嵌入式容器中；并不表示 Tuwunel、MinIO、Higress 和 Go Controller 是同一个程序。

本地默认的 Element 页面是 `http://127.0.0.1:18088`，Matrix/Higress 入口默认在宿主机 `18080`。如果要让局域网其他机器访问，需要在安装器中选择允许外部访问，并确保 Matrix 域名、浏览器实际访问地址和端口可达；只把 Element 静态页面暴露出去而没有可达的 Homeserver，用户仍无法登录和收发消息。[Quickstart 的本地端口][quickstart-local]

### 团队或生产：Kubernetes / Helm

Helm 模式把 Higress、Tuwunel、MinIO、Element、Controller、Manager 和 Worker 部署为独立 Pod 或 Chart 依赖。Controller 观察 Worker、Manager、Team、Human 等资源配置，并创建或更新对应 Pod。[Kubernetes 架构说明][architecture-k8s]

官方部署建议对外暴露 Higress Gateway，由它提供 Element 与 Matrix 路由；Controller API、Tuwunel、MinIO 和 Higress Console 保持集群内访问。多人使用时应配置 HTTPS，因为 Matrix 登录凭据和 Access Token 会经过入口。[README 的对外访问说明][readme-exposure]

### 运维排查顺序

建议沿六条真实线索分别检查，而不是只看 Worker 容器是否存在：

1. **产品入口**：Element 页面能否加载，配置的 Homeserver 是否能响应 `/_matrix/client/versions`；
2. **Matrix 通信**：用户、Manager、Worker 是否在预期房间，消息是否带正确 `m.mentions`；
3. **Agent 进程**：Manager 与目标 Worker 的容器或 Pod 是否 Running，Runtime 自己的 Matrix Channel 是否已完成同步；
4. **生命周期**：`agt get workers -o json` 中期望状态、阶段和错误信息是什么；
5. **模型与工具**：Higress 中的 Worker 身份、网关路径和上游 LLM/MCP 是否可用；
6. **文件恢复**：MinIO/OSS 中的 Agent 配置与任务目录是否存在、Runtime 是否能拉取和写回。

`agt` 在这里是 Manager Skill 与运维自动化共用的管理 CLI，类似只面向 AgentTeams 资源的轻量 `kubectl`；它不是普通用户的聊天客户端，也不执行模型。[`agt` 的定位][architecture-agt]

## 恢复模型与边界

AgentTeams 的恢复能力来自三处，而不是一个万能的“恢复 Agent”按钮：

- **Matrix** 保留房间事件，使重连后的客户端能继续同步历史和新消息；
- **Controller** 反复对齐期望状态，容器或 Pod 消失时可以重新创建；
- **MinIO/OSS** 保存已落盘的配置、skills、任务文件和工作区，新 Runtime 可以重新拉取。

恢复也有明确边界：

- 容器内存、正在运行但尚未落盘的命令以及半完成的外部副作用不会自动回滚；
- “Matrix 成员状态已经是 joined”不代表 Runtime 已经完成首次同步、能够立即处理消息。Controller 源码因此明确提醒调用方采用可重试的发送语义，而不能把 joined 当成处理就绪。[Worker 加房间后的就绪注释][worker-room]
- Matrix 提供通信记录，但不保证每项任务只执行一次且绝不丢失；任务是否可以重发仍要根据实际副作用和共享文件判断。

所以，AgentTeams 最准确的设计总结是：

> 它用 Matrix 把 Human、Manager 和多种 Worker Runtime 放进可见的协作房间；用 Controller 把成员与房间落实成真实账号和进程；用对象存储保留文件；再用 Higress 统一模型和工具出口。

## 主要源码与文档入口

- [官方中文 README 与架构图][readme-product]
- [中文 Quickstart][quickstart-user]
- [中文架构说明][architecture-communication]
- [Matrix Client 实现][matrix-client]
- [Worker 创建与房间 Provisioner][worker-room]
- [Manager Runtime 入口][manager-runtime]
- [Worker Runtime 后端定义][worker-runtimes]
- [Manager 的 Worker Management Skill][worker-skill]

[返回报告总览](index.md) · [继续阅读 AgentSpace](agentspace.md) · [名词解释](glossary.md)

[source-commit]: https://github.com/agentscope-ai/AgentTeams/commit/2540c968a642845c4b9382afd75d8c80ed861137
[readme-product]: https://github.com/agentscope-ai/AgentTeams/blob/2540c968a642845c4b9382afd75d8c80ed861137/README.zh-CN.md#L15-L24
[readme-exposure]: https://github.com/agentscope-ai/AgentTeams/blob/2540c968a642845c4b9382afd75d8c80ed861137/README.zh-CN.md#L244-L308
[quickstart-user]: https://github.com/agentscope-ai/AgentTeams/blob/2540c968a642845c4b9382afd75d8c80ed861137/docs/zh-cn/quickstart.md#L61-L105
[quickstart-create]: https://github.com/agentscope-ai/AgentTeams/blob/2540c968a642845c4b9382afd75d8c80ed861137/docs/zh-cn/quickstart.md#L98-L165
[quickstart-local]: https://github.com/agentscope-ai/AgentTeams/blob/2540c968a642845c4b9382afd75d8c80ed861137/docs/zh-cn/quickstart.md#L41-L75
[architecture-communication]: https://github.com/agentscope-ai/AgentTeams/blob/2540c968a642845c4b9382afd75d8c80ed861137/docs/zh-cn/architecture.md#L119-L136
[architecture-storage]: https://github.com/agentscope-ai/AgentTeams/blob/2540c968a642845c4b9382afd75d8c80ed861137/docs/zh-cn/architecture.md#L127-L130
[architecture-gateway]: https://github.com/agentscope-ai/AgentTeams/blob/2540c968a642845c4b9382afd75d8c80ed861137/docs/zh-cn/architecture.md#L132-L136
[architecture-local]: https://github.com/agentscope-ai/AgentTeams/blob/2540c968a642845c4b9382afd75d8c80ed861137/docs/zh-cn/architecture.md#L84-L110
[architecture-k8s]: https://github.com/agentscope-ai/AgentTeams/blob/2540c968a642845c4b9382afd75d8c80ed861137/docs/zh-cn/architecture.md#L100-L115
[architecture-agt]: https://github.com/agentscope-ai/AgentTeams/blob/2540c968a642845c4b9382afd75d8c80ed861137/docs/zh-cn/architecture.md#L165-L176
[faq-homeserver]: https://github.com/agentscope-ai/AgentTeams/blob/2540c968a642845c4b9382afd75d8c80ed861137/docs/zh-cn/faq.md#L386-L393
[faq-worker-chat]: https://github.com/agentscope-ai/AgentTeams/blob/2540c968a642845c4b9382afd75d8c80ed861137/docs/zh-cn/faq.md#L405-L411
[matrix-client]: https://github.com/agentscope-ai/AgentTeams/blob/2540c968a642845c4b9382afd75d8c80ed861137/agentteams-controller/internal/matrix/client.go#L30-L143
[matrix-register]: https://github.com/agentscope-ai/AgentTeams/blob/2540c968a642845c4b9382afd75d8c80ed861137/agentteams-controller/internal/matrix/client.go#L220-L329
[matrix-types]: https://github.com/agentscope-ai/AgentTeams/blob/2540c968a642845c4b9382afd75d8c80ed861137/agentteams-controller/internal/matrix/types.go#L64-L106
[room-meta]: https://github.com/agentscope-ai/AgentTeams/blob/2540c968a642845c4b9382afd75d8c80ed861137/agentteams-controller/internal/service/room_meta.go#L1-L97
[worker-room]: https://github.com/agentscope-ai/AgentTeams/blob/2540c968a642845c4b9382afd75d8c80ed861137/agentteams-controller/internal/service/provisioner.go#L330-L532
[team-room]: https://github.com/agentscope-ai/AgentTeams/blob/2540c968a642845c4b9382afd75d8c80ed861137/agentteams-controller/internal/service/provisioner.go#L767-L927
[team-topology]: https://github.com/agentscope-ai/AgentTeams/blob/2540c968a642845c4b9382afd75d8c80ed861137/docs/zh-cn/declarative-resource-management.md#L291-L320
[element-config]: https://github.com/agentscope-ai/AgentTeams/blob/2540c968a642845c4b9382afd75d8c80ed861137/manager/scripts/init/start-element-web.sh#L1-L25
[matrix-skill]: https://github.com/agentscope-ai/AgentTeams/blob/2540c968a642845c4b9382afd75d8c80ed861137/manager/agent/skills/matrix-server-management/SKILL.md#L1-L22
[copaw-matrix]: https://github.com/agentscope-ai/AgentTeams/blob/2540c968a642845c4b9382afd75d8c80ed861137/copaw/src/matrix/channel.py#L1013-L1133
[matrix-wakeup]: https://github.com/agentscope-ai/AgentTeams/blob/2540c968a642845c4b9382afd75d8c80ed861137/agentteams-controller/internal/server/appservice_handler.go#L21-L250
[manager-runtime]: https://github.com/agentscope-ai/AgentTeams/blob/2540c968a642845c4b9382afd75d8c80ed861137/manager/scripts/init/start-manager-agent.sh#L1-L30
[worker-runtimes]: https://github.com/agentscope-ai/AgentTeams/blob/2540c968a642845c4b9382afd75d8c80ed861137/agentteams-controller/internal/backend/interface.go#L30-L63
[worker-crd]: https://github.com/agentscope-ai/AgentTeams/blob/2540c968a642845c4b9382afd75d8c80ed861137/agentteams-controller/config/crd/workers.agentteams.io.yaml#L20-L30
[manager-crd]: https://github.com/agentscope-ai/AgentTeams/blob/2540c968a642845c4b9382afd75d8c80ed861137/agentteams-controller/config/crd/managers.agentteams.io.yaml#L20-L36
[worker-skill]: https://github.com/agentscope-ai/AgentTeams/blob/2540c968a642845c4b9382afd75d8c80ed861137/manager/agent/skills/worker-management/SKILL.md#L1-L53
[agt-create]: https://github.com/agentscope-ai/AgentTeams/blob/2540c968a642845c4b9382afd75d8c80ed861137/agentteams-controller/cmd/agt/create.go#L24-L124
[worker-controller]: https://github.com/agentscope-ai/AgentTeams/blob/2540c968a642845c4b9382afd75d8c80ed861137/agentteams-controller/internal/controller/worker_controller.go#L117-L316
[openclaw-entrypoint]: https://github.com/agentscope-ai/AgentTeams/blob/2540c968a642845c4b9382afd75d8c80ed861137/worker/scripts/worker-entrypoint.sh#L1-L237
[team-communication]: https://github.com/agentscope-ai/AgentTeams/blob/2540c968a642845c4b9382afd75d8c80ed861137/manager/agent/team-leader-agent/skills/communication/SKILL.md#L18-L96
