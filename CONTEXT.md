# 百工领域词汇表

本文件只定义百工领域中的稳定术语，不记录实现技术或产品路线。

## 组织与责任

### Organization

一个完整的治理、身份和信任边界。组织拥有自己的结构、政策、任务和审计记录。

### OrgUnit

组织内部可以递归嵌套的责任单元，例如公司、事业部、部门或小组。每个 OrgUnit 指定一个 Leader Role。

### Role

组织中稳定的责任位置，例如研发负责人、后端工程师或安全评审人。Role 不等于人，也不等于 Agent。

### ReportingLine

两个 Role 之间的正式汇报关系。管理型 ReportingLine 不允许形成责任环。

### Member

加入组织的真实人员。Member 可以担任一个或多个 Role，拥有 Workspace，并对授权给 Agent 的组织行为承担责任。

### HumanRoleAssignment

Member 在一段有效期内担任某个 Role 的事实。它表达组织责任，不表达 Agent 的执行授权。

### Human Sponsor

为某个 Agent Delegation 或 Task 承担最终人类责任的 Member。所有具有组织影响的 Agent 行为都必须能追溯到 Human Sponsor。

### Leader Role

OrgUnit 中对该单元收到的任务、向下委派和最终交付负责的 Role。Leader Role 是稳定职位，不随当前任职者或 Agent 更换而改变。

## Workspace 与 Agent

### Workspace

由 Member 或其他 Owner 控制的主权执行环境，包含代码、数据、工具、密钥、记忆和 Agent Runtime。加入组织不会改变 Workspace 的所有权。

### Agent Endpoint

百工能够调用或投递消息的 Agent 入口。它可以代表一个通用 Agent、专业 Agent 或 Workspace 内部的 Manager Agent。

### Workspace Representative

Workspace 向组织暴露的默认负责人 Agent Endpoint。Workspace 内部 Agent 的组织方式默认属于 Workspace 私有实现。

### Agent Delegation

Human Sponsor 授予 Agent Endpoint 的、有范围、预算、期限、自治等级且可撤销的执行授权。它不转移 Human Sponsor 或 Role 的最终责任。

### Capability

Agent 或 Workspace 对外声明并可被验证的能力。Capability 包含适用范围、输入输出、依赖、限制和实证结果。

## 任务与委派

### Task

需要产生可验收结果的工作对象。Task 属于 Organization 或 OrgUnit，并指定唯一的 Accountable Role。

### TaskPlan

Leader 对 Task 的某一版本拆解方案，包括子任务、依赖、责任角色、预算、权限和验收标准。

### Delegation

上级 Role 向下级 Role 提议并经双方接受的任务合同。委派转移执行责任，但不转移父 Task 的最终问责。

### TaskAttempt

某个具体 Agent Endpoint 在某个 Workspace 中对 Task 的一次执行。重试或更换 Agent 必须创建新的 Attempt。

### Responsibility Tree

Task 之间的单一问责关系。每个子 Task 只有一个直接负责的父 Task。

### Execution DAG

Task 之间的执行依赖关系。它可以表达并行和前后置依赖，但不得出现环。

### Definition of Done

Task 或 Delegation 的明确完成条件，包括结果、证据、质量阈值和验收方式。

## 通信

### Inbox

可靠接收结构化消息的逻辑信箱。底层是统一服务，按所有者形成 Role Inbox、Member Inbox 和 Agent Inbox。

### Role Inbox

属于稳定 Role 的 Inbox，用于接收组织任务、下属交付、审批和异常升级。更换任职者或 Agent 不会迁移该 Inbox。

### Member Inbox

属于 Member 的 Inbox，用于员工沟通、人工决策、提醒和 Agent 请求人类介入。

### Agent Inbox

属于 Agent Endpoint 的 Inbox，用于执行指令、Agent 间请求、取消和恢复信号。它不是 Task 状态的权威来源。

### Task Thread

与 Task 绑定的协作信息流，保存影响任务范围、预算、决策、风险、验收和结果的重要沟通。

## 产物与证据

### Artifact

任务产生的正式交付对象，例如代码、文档、数据、测试结果或部署记录。

### Artifact Version

Artifact 的不可变内容版本。新内容必须生成新版本，不能覆盖历史结果。

### Submission

执行者向直接上级提交的一组 Artifact、证据、风险和完成说明。

### Review

上级或指定 Reviewer 对 Submission 作出的接受、驳回、修改或升级决定。

### Deliverable Manifest

根 Task 的最终交付清单，引用已验收的 Artifact、证据、限制和完整来源链。

### Lineage

Task、Attempt、Agent、Capability、Artifact、决策和审批之间的因果与派生关系。

## 人工决策与治理

### Human Intervention Request

Agent 或系统请求人类进行澄清、计划评审、审批、Artifact 验收、仲裁、覆盖或接管的持久对象。

### Autonomy Policy

规定某个 Agent 在特定 Role、Task 和动作上可以自动执行、事后通知、事前审批、仅限人工或完全禁止的政策。

### Grant

Owner 对 Principal 授予的、有资源范围、动作范围、期限和版本的访问权限。

### Approval

授权人对规范化动作及其参数作出的、具有范围和有效期的决定。Approval 不能由普通聊天消息替代。
