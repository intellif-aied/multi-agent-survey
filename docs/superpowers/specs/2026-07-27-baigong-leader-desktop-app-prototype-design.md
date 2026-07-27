# 百工 Leader 桌面工作台产品原型设计

> 日期：2026-07-27
>
> 状态：已通过对话和可视化方案确认，待书面复核
>
> 产品形态：桌面优先的 Web App
>
> 核心用户：团队或部门 Leader
>
> 首要旅程：发起目标并委派
>
> 领域基础：`2026-07-27-baigong-organizational-agent-collaboration-design.md`

## 1. 产品结论

百工 App 不是聊天机器人、项目管理表格或 Agent 监控屏，而是：

> Leader 面向真实组织发起目标，审阅 Agent 生成的递归委派方案，在需要人类判断时介入，并按 Artifact 和证据完成逐级验收的数字组织工作台。

产品采用融合式交互：

1. **目标指挥会话**负责低门槛表达目标；
2. **组织任务图**负责理解和调整递归委派；
3. **任务合同检查器**负责确认责任、预算、权限、人工决策点和验收要求；
4. **组织运行态**负责展示逐级压缩的进度、异常和人工介入；
5. **Artifact Review**负责按 Definition of Done、证据和 Lineage 逐级验收。

三种交互不是三个独立产品，而是同一 Task 生命周期的连续阶段。

## 2. 设计目标

### 2.1 用户目标

Leader 应能够：

- 用自然语言表达一个组织目标；
- 看见系统如何理解目标和完成标准；
- 看见任务将沿哪些 Role 和管理链递归委派；
- 明确哪个人负责、哪个 Agent 代理执行；
- 在委派前发现预算、权限、期限和责任缺口；
- 在运行中只处理影响目标的变化、越权行为和待验收产物；
- 在 Agent 或 Leader 更换后继续组织工作；
- 依据 Artifact、测试证据和来源链完成最终验收。

### 2.2 产品目标

- 首次接入软件团队控制在 10 分钟左右；
- 首页只突出“发起目标”一个主动作；
- 自然语言降低表达门槛，结构化对象保障正确性；
- 组织层级越深，Leader 收到的信息越应该被逐级压缩；
- 人、Role、Agent、Workspace 和 Task 的责任关系始终可见；
- 简单任务保持快速，复杂任务按风险渐进披露；
- 所有具有外部副作用的操作明确说明“将发生什么”。

### 2.3 非目标

本原型不设计：

- 手机端；
- 跨企业联邦管理；
- 矩阵式组织和多重汇报；
- 公网 Agent 市场和支付；
- 完整员工即时通讯；
- 完整企业管理后台；
- 无人类责任人的自治组织；
- 生产级 Agent 运行、消息队列或权限系统。

## 3. 核心心智模型

产品需要让用户形成以下理解：

```text
我以某个 Role 发起目标
→ 我的 Leader Agent 起草任务计划
→ 计划沿真实组织责任链向下递归
→ 下属 Role 接受、拒绝或提出反提案
→ Agent 在人的授权范围内执行
→ 越过目标、权限或风险边界时回到人
→ Artifact 经过逐级 Review 汇聚为最终交付
```

界面始终遵循：

> 任务属于组织，责任属于 Role，Role 由人担任，Agent 接受人的授权执行工作。

## 4. 交互方案选择

### 4.1 目标指挥会话

优势是发起目标快、学习成本低，符合 Leader 按结果工作的方式。风险是被误解为普通 Agent Chat。

### 4.2 组织作战地图

优势是直观表达组织、上下级、递归委派和责任关系，能够形成百工的产品差异。风险是大型组织视觉过载。

### 4.3 任务合同编排器

优势是能在委派前发现 DoD、Artifact、权限、预算和人工审批缺口。风险是简单任务变慢并产生表单感。

### 4.4 最终组合

- 目标指挥会话成为首页和新目标入口；
- 组织任务图成为计划和运行的主视图；
- 任务合同编排能力收进右侧上下文检查器；
- Task Thread 作为目标内的协作时间线，不做全局聊天产品；
- 列表、责任树和执行 DAG 作为可切换辅助视图。

## 5. 全局信息架构

### 5.1 顶级导航

Leader 的常用主导航保持五项；Workspace 接入和组织设置放入次级管理区。

| 层级 | 入口 | 核心内容 |
|---|---|---|
| 主导航 | 指挥台 | 发起目标、当前组织上下文、组织运行图、Task Thread |
| 主导航 | 目标与任务 | 任务组合、责任树、执行 DAG、TaskPlan 和历史版本 |
| 主导航 | 决策箱 | 审批、澄清、反提案、异常、Artifact Review 和接管 |
| 主导航 | 组织 | OrgUnit、Role、Member、ReportingLine、HumanRoleAssignment |
| 主导航 | Artifact | Artifact Version、Submission、Review、Lineage、Deliverable |
| 次级管理 | Workspace | 工作空间接入、Agent、Capability、AgentDelegation 和健康状态 |
| 次级管理 | 组织设置 | 自治策略、预算、授权、审计和数据边界 |

### 5.2 顶部全局区

始终显示：

- 当前 Organization 和 OrgUnit 作用域；
- 当前 Member 和正在担任的 Role；
- 全局搜索；
- 待人处理的事项数量；
- `发起目标`主按钮；
- 用户菜单和组织切换。

### 5.3 页面层级

```text
App
├── First-run
│   ├── Create Organization
│   ├── Organization Template
│   ├── Human Role Assignment
│   ├── Workspace Connection
│   ├── Agent Delegation
│   └── Readiness Test
├── Command Center
│   ├── Goal Composer
│   ├── Goal Brief
│   ├── Organization Task View
│   ├── Contract Inspector
│   ├── Runtime Overview
│   └── Task Thread
├── Decision Inbox
├── Artifact Review
└── Organization Assets
```

## 6. 桌面主框架

### 6.1 尺寸

- 设计基准：1440px 宽；
- 完整三栏最小宽度：1280px；
- 低于 1280px 时，右侧检查器收为抽屉；
- 不设计手机断点；
- 内容使用 8px 间距网格。

### 6.2 三栏结构

```text
┌─────────────────────────────────────────────────────────────┐
│ Organization / Role / Search / Decisions / New Goal        │
├────────────┬──────────────────────────────┬─────────────────┤
│ 左侧导航   │ 中央工作区                   │ 右侧检查器      │
│ 148–168px  │ Goal / Graph / Thread        │ 290–360px       │
│            │                              │ Contract/Risk   │
└────────────┴──────────────────────────────┴─────────────────┘
```

### 6.3 中央工作区

根据 Task 阶段切换：

- Goal Composer；
- Goal Brief；
- 组织任务图；
- 责任树；
- 执行 DAG；
- 运行态；
- 计划版本差异；
- Artifact Review。

工作区保持同一 Task 上下文，不因步骤变化频繁跳转页面。

### 6.4 右侧检查器

按当前选中对象显示：

- 目标契约；
- Role、Human Sponsor 和 AgentDelegation；
- Definition of Done；
- 预算、期限、权限和数据范围；
- Human Checkpoint；
- 预期 Artifact；
- Review 和 Lineage；
- 历史版本。

正常继承的规则默认折叠，只展开影响 Leader 判断的异常。

## 7. 首次使用流程

### 7.1 创建组织

Leader 设置：

- 组织名称；
- 团队类型；
- 数据区域；
- 默认安全等级。

### 7.2 使用组织模板

MVP 提供“软件研发团队”模板：

```text
研发负责人
├── 前端负责人
│   └── 前端工程师
├── 后端负责人
│   ├── API 工程师
│   └── 数据库工程师
└── 测试负责人
    └── 测试工程师
```

用户可以增加、删除、重命名 OrgUnit 和 Role，但不要求从空白画组织树。

### 7.3 分配人类角色

为 Role 设置：

- Primary HumanRoleAssignment；
- Backup HumanRoleAssignment；
- Human Sponsor；
- 有效期；
- 责任范围。

界面先完成“谁负责”，再出现 Agent 配置。

### 7.4 接入 Workspace

成员在 App 中选择 Agent 类型，并通过 Edge Connection Code 建立向外连接。

接入页必须明确区分：

**向组织发布：**

- Agent Endpoint；
- Capability；
- 可接收的 Task Contract；
- 按 Task 共享的 Artifact 和摘要。

**保持 Workspace 私有：**

- 原始代码；
- 长期密钥；
- 个人记忆；
- 未授权文件；
- Workspace 内部 Agent 编排。

### 7.5 创建 AgentDelegation

配置：

- Agent 代表哪个 Role；
- Human Sponsor；
- 动作范围；
- 资源范围；
- 预算；
- 有效期；
- 自治等级；
- 可撤销状态。

自治等级使用：

```text
AUTO
AUTO_WITH_NOTIFY
REQUIRE_APPROVAL
HUMAN_ONLY
DENY
```

### 7.6 接入演练

系统发送一个无外部副作用的测试 Task，验证：

- Role Inbox 路由；
- Agent 在线状态；
- Workspace Representative；
- Artifact 提交；
- Human Sponsor；
- 撤销 AgentDelegation。

## 8. 主旅程：从目标到正式委派

### 8.1 阶段一：描述目标

首页中心显示：

> 今天希望组织完成什么？

Goal Composer 支持：

- 自然语言；
- 上传需求文档；
- 引用现有 Artifact；
- 选择 OrgUnit；
- 截止日期；
- 预算；
- 敏感等级；
- 模板。

除目标外，其他信息以可选胶囊呈现，不用长表单阻塞输入。

示例目标：

> 两周内为现有系统增加企业登录和权限控制，要有自动化测试，不影响现有账号。上线前让我确认。

### 8.2 阶段二：Goal Brief

系统提取：

- 目标；
- 范围；
- 明确不做什么；
- 截止日期；
- 完成定义；
- 输入 Artifact；
- 人工决策点。

只有会改变计划的问题才要求 Leader 回答，最多同时展示三项。

示例：

> 首期采用 OIDC、SAML，还是交给架构负责人评估？

Leader 可以直接编辑结构化语句，也可以用自然语言提出修改。修改以 Plan/Goal Diff 呈现。

### 8.3 阶段三：生成组织委派方案

系统生成：

- Root Task；
- Child Task；
- Responsibility Tree；
- Execution DAG；
- Accountable 和 Responsible Role；
- Human Sponsor；
- AgentDelegation；
- 预期 Artifact；
- 预算和截止日期；
- Human Checkpoint。

主视图默认使用组织任务图：

- Leader Role 在上方；
- 直接下属横向展开；
- 更深层级向下递归；
- Task 挂在 Responsible Role 下；
- 跨部门依赖使用侧向虚线；
- 人工决策点使用闸门节点；
- Artifact 默认折叠成徽章。

### 8.4 阶段四：修改计划

Leader 可以：

- 拆分或合并子 Task；
- 把 Task 拖给其他下属 Role；
- 增加或删除依赖；
- 修改 DoD；
- 修改预算和期限；
- 禁止某个 Task 继续下委派；
- 增加 Reviewer；
- 增加 Human Checkpoint；
- 通过自然语言提出计划修改。

自然语言修改必须转换为结构化 Plan Diff，确认后才改变 TaskPlan。

### 8.5 阶段五：保障预检

预检内容：

- 是否所有 Task 都有 Responsible Role；
- 是否都有 Definition of Done；
- Execution DAG 是否无环；
- 子 Task 权限是否超出父 Task；
- 子 Task 预算是否超出父 Task；
- 是否越过父 Task 截止日期；
- AgentDelegation 是否有效；
- Artifact 是否可访问；
- 高风险行为是否有人工决策点；
- 是否存在不可补偿副作用。

严重错误阻止委派；警告允许用户填写理由后继续。

### 8.6 阶段六：确认委派

主按钮不能只写“提交”，而应显示实际副作用：

> 向 3 个 Role 发出委派 · 创建 8 个子任务

确认面板汇总：

- 目标 Role；
- 预计执行 Agent；
- 可继续委派深度；
- 总预算；
- 关键路径；
- 权限变化；
- Human Checkpoint；
- 预期 Artifact。

确认后发出 `Delegation Proposal`。界面先显示：

```text
待接受
已接受
拒绝
反提案
```

不得在下属接受前误显示为“执行中”。

## 9. 运行态

### 9.1 组织运行图

每个 Role 卡片显示：

- Role 名称；
- Human Role Holder；
- Agent Endpoint；
- 当前 Task 数量；
- 进度；
- Inbox 待处理数量；
- 风险；
- AgentDelegation 状态。

状态变化采用局部高亮，不重新布局整张组织图。

### 9.2 逐级信息压缩

Leader 默认只看：

- 状态摘要；
- 关键决策；
- Artifact 引用；
- 验收证据；
- 已知风险；
- 需要上级处理的问题。

原始 Agent 日志进入 TaskAttempt 二级详情。

### 9.3 Task Thread

Task Thread 保存影响结果的结构化时间线：

- 委派接受或拒绝；
- 反提案；
- 计划变更；
- 权限请求；
- Artifact Submission；
- Review；
- Agent 接管；
- 取消和补偿。

普通运行日志默认不进入 Task Thread。

### 9.4 计划版本

运行态显示当前 `Plan vN` 和 epoch。出现重规划时提供：

- 旧计划；
- 新计划；
- 结构化差异；
- 已执行部分；
- 仍有效 Artifact；
- 被 Supersede 的 Task。

## 10. 人工决策

### 10.1 决策箱

待处理事项按以下顺序排序：

1. 不可逆或高风险动作；
2. 即将超时或升级的请求；
3. 影响关键路径的反提案；
4. Artifact Review；
5. 一般澄清和通知。

### 10.2 Decision Card

必须包含：

- 为什么现在需要人；
- 请求 Agent 和 Responsible Role；
- Human Sponsor；
- 规范化拟执行动作；
- 权限、预算、期限和数据影响；
- 证据；
- 有效期；
- 超时默认行为；
- 是否阻塞其他 Task。

可选动作：

```text
APPROVE
EDIT_AND_APPROVE
REJECT
REQUEST_MORE_INFORMATION
DELEGATE_TO_ANOTHER_HUMAN
TAKE_OVER
```

### 10.3 反提案

反提案使用差异视图呈现：

- 原期限与建议期限；
- 原预算与建议预算；
- 新增 Artifact；
- 新增权限；
- 对关键路径的影响；
- 提案理由。

Leader 可以接受、修改、拒绝或改派。

### 10.4 人工接管

接管时界面必须说明：

- 当前 Agent Attempt 是否暂停；
- 人将接管哪个 Task；
- 已完成的 Artifact；
- 未完成步骤；
- 可恢复方式；
- 接管是否撤销 AgentDelegation。

## 11. Artifact Review

### 11.1 Submission

提交页显示：

- 逻辑 Artifact 和不可变版本；
- 生产者 Agent；
- Responsible 和 Accountable Role；
- 来源 Task 和 Attempt；
- 输入 Artifact；
- Capability Version；
- 验证结果；
- 已知限制；
- 敏感等级；
- Lineage。

### 11.2 按 DoD 验收

Review 面板把 Artifact 与完成定义逐项对应：

- 验收条件；
- 证据；
- 通过或失败；
- Reviewer；
- 人工备注。

Review 结果：

```text
ACCEPT
REJECT
REQUEST_CHANGES
PARTIALLY_ACCEPT
ESCALATE
```

### 11.3 最终交付

Root Task 的最终页面生成 Deliverable Manifest：

- 已验收 Artifact；
- 测试和评估证据；
- 已知限制；
- 未解决风险；
- 完整责任和来源链；
- Human Sponsor 的最终验收。

## 12. 异常与恢复体验

异常界面先回答：

1. 当前系统是否安全；
2. 哪些工作仍在继续；
3. 谁负责；
4. 用户可以执行什么动作。

### 12.1 Leader Agent 离线

显示：

- Role Inbox 和 Task 未丢失；
- 旧 lease 已过期；
- 已阻止旧 Agent 开始新副作用；
- 可以切换 Backup Agent、等待恢复或人工接管。

### 12.2 权限不足

显示：

- 未授权数据未被读取；
- 哪个 Task 暂停；
- 其他不依赖该权限的 Task 是否继续；
- 批准有限范围、缩小 Task 或拒绝。

### 12.3 计划版本冲突

显示：

- 用户正在查看的版本；
- 当前权威版本；
- 旧版本已经被 Supersede；
- 旧版本不能创建新 Attempt；
- 查看差异或切换最新版。

### 12.4 Artifact 验证失败

显示：

- 失败版本已隔离；
- 未进入父 Task 正式交付；
- 测试证据和 Lineage 已保存；
- 要求修改、重新执行或改派 Reviewer。

### 12.5 下属无可用执行者

显示：

- 哪个 Role 仍然 Accountable；
- 无可用 Agent 的原因；
- 等待、使用 Backup、改派或人工执行；
- 对期限和预算的影响。

### 12.6 消息延迟或重复

用户界面不暴露消息队列术语，只显示：

- 最近一次确认时间；
- 当前状态是否权威；
- 是否正在重试；
- 重新加载 Task Snapshot。

## 13. 视觉语言

### 13.1 风格

命名为“现代工坊控制台”：

- 现代、克制、可操作；
- 有温度但不仿古；
- 强调责任、工作流和交付；
- 避免传统蓝色 SaaS；
- 避免黑客式深色 Agent 监控屏。

### 13.2 颜色

| Token | 色值 | 用途 |
|---|---|---|
| Deep Jade | `#153F36` | 全局导航、主要行动、稳定组织结构 |
| Warm Stone | `#F4F1EA` | 主工作画布 |
| Craft Gold | `#D69A39` | 风险、反提案、等待处理 |
| Human Purple | `#6B4A7D` | 人工决策、Human Sponsor、接管 |
| Critical Red | `#B4544C` | 失败、禁止、不可逆风险 |
| Success Green | `#3F806F` | 通过、接受、正常执行 |

颜色不单独传递状态，必须与图标、文字和线型共同使用。

### 13.3 字体

- 中文：Noto Sans SC；
- 英文和数字：Inter；
- ID、Hash、TaskRef：系统等宽字体；
- 正文最小 13px；
- 密集元数据最小 11px；
- 标题使用明确层级，不使用装饰性书法字体。

### 13.4 形状与层级

- 卡片圆角 8–14px；
- 主工作区容器圆角 16–18px；
- 阴影只用于悬浮层和当前操作对象；
- 组织结构使用稳定、克制的实线；
- 执行依赖使用虚线；
- Human Checkpoint 使用闸门图标；
- 选中对象通过边框、背景和焦点环共同强调。

### 13.5 运动

- 一般反馈 150–220ms；
- 状态变化只局部更新；
- 组织图默认不因实时状态重新布局；
- 动效表达任务从哪里到哪里，不制造“Agent 很忙”的表演；
- 遵循 `prefers-reduced-motion`。

## 14. 核心组件

第一版原型需要：

- App Shell；
- Organization/Role Switcher；
- Goal Composer；
- Goal Brief Card；
- Clarification Card；
- Organization Task Canvas；
- Role Card；
- Task Node；
- Responsibility/Dependency Edge；
- Goal/Plan Diff；
- Contract Inspector；
- Guardrail Chip；
- Human Checkpoint；
- Dispatch Summary；
- Decision Card；
- Counteroffer Diff；
- Task Thread Event；
- Artifact Card；
- Submission Panel；
- DoD Review Checklist；
- Lineage Summary；
- Recovery Banner；
- Empty、Loading、Blocked 和 Superseded 状态。

## 15. 可点击原型范围

### 15.1 固定演示组织

```text
研发负责人：张三
├── 前端负责人：王珊
├── 后端负责人：李四
└── 测试负责人：周琪
```

每个人具有一个 Workspace Representative Agent。

### 15.2 固定演示任务

> 两周内为现有系统增加企业登录和权限控制，要有自动化测试，不影响现有账号。上线前由研发负责人确认。

### 15.3 十个关键画面

1. 创建组织；
2. 组织模板与 HumanRoleAssignment；
3. Workspace、Agent 和 AgentDelegation 接入；
4. Leader 指挥台；
5. Goal Brief 和关键澄清；
6. 组织任务图和计划修改；
7. 合同预检和正式委派；
8. 任务运行态和局部重规划；
9. Human Decision、反提案和接管；
10. Artifact Review 和最终交付。

### 15.4 必须可操作的交互

- 选择软件团队模板；
- 给 Role 分配 Member；
- 连接一个 Workspace Agent；
- 设置 AgentDelegation；
- 输入演示目标；
- 选择关键澄清项；
- 修改一个 DoD；
- 展开递归 Task；
- 改派一个子 Task；
- 插入一个 Human Checkpoint；
- 运行预检；
- 发出 Delegation Proposal；
- 模拟接受和反提案；
- 处理权限审批；
- 模拟 Leader Agent 离线并切换 Backup；
- 打开 Artifact；
- 查看证据和 Lineage；
- 接受或要求修改 Submission；
- 完成 Root Task 人工验收。

## 16. 原型验收标准

### 16.1 理解性

没有口头解释时，用户应能回答：

- 当前以哪个 Role 工作；
- 哪个人承担责任；
- 哪个 Agent 正在代理执行；
- Task 委派给了谁；
- 哪些动作需要人决定；
- 最终结果在哪里验收。

### 16.2 任务完成

目标用户应能够独立完成：

- 发起目标；
- 确认 Goal Brief；
- 审阅组织委派计划；
- 修复一个预检问题；
- 发出委派；
- 处理一个反提案；
- 批准一个有限权限请求；
- 验收一个 Artifact；
- 完成最终交付。

### 16.3 状态正确性

- 下属接受前不显示“执行中”；
- 人工决策前高风险动作不显示“已执行”；
- Artifact Review 前不进入父 Task 正式交付；
- 旧 Plan Supersede 后不显示为当前权威状态；
- Agent 离线后 Role Inbox 和 Task 保持存在；
- 人工接管显示对 Agent Attempt 和 AgentDelegation 的影响。

### 16.4 可访问性

- 正文对比度达到 WCAG AA；
- 所有状态同时使用文字和图标；
- 全部主操作可以使用键盘完成；
- 焦点顺序与视觉顺序一致；
- Canvas 节点有可访问列表替代视图；
- 支持减少动态；
- 不使用只能悬停才能获得的关键信息。

### 16.5 原型测试任务

对 5 名软件团队 Leader 进行可用性测试：

1. 让他们创建一个组织并接入自己的 Agent；
2. 发起“企业登录”目标；
3. 判断系统将任务交给了谁；
4. 修改计划并发出委派；
5. 处理权限审批和反提案；
6. 验收测试报告；
7. 说明如果 Leader Agent 离线，工作是否会丢失。

记录：

- 完成率；
- 首次目标发起时间；
- 错误点击；
- 对人/Role/Agent 责任的理解；
- 对状态是否已经执行的误判；
- 人工介入平均时间；
- 用户信任和控制感。

## 17. 实现前约束

- 原型使用固定演示数据，不连接真实 Agent Runtime；
- 交互状态必须集中定义，不能在页面组件内散落；
- 组织树与任务 DAG 在 UI 上可叠加，但数据结构保持分离；
- 自然语言输入只生成草案，结构化确认后才推进状态；
- Canvas 必须提供列表视图作为替代；
- 不在第一版实现完整拖拽编辑器，可使用有限节点改派和预设计划差异；
- 不在第一版实现通用表单生成器；
- 不把管理后台字段全部暴露给 Leader；
- 演示用日志不得伪装为 Task 状态权威。

## 18. 交付定义

原型交付应包含：

- 可在桌面浏览器打开的交互式 Web 原型；
- 10 个关键画面；
- 一条完整 Happy Path；
- 权限审批、反提案、Agent 离线和 Artifact 失败四条异常路径；
- 固定演示组织和任务数据；
- 响应式桌面布局；
- 键盘焦点和基础可访问性；
- 原型运行说明；
- 页面与领域对象的映射说明。

完成标准不是“所有按钮都能点击”，而是：

> 用户能够理解并走完整个组织目标生命周期：人建立责任和授权，Agent 递归执行，系统在边界处把决定交还给人，Artifact 最终经过可追踪的验收形成交付。
