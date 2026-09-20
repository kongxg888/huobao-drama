# 吉祥Ai短剧：AI 剧本改写轻量升级设计

## 状态

待用户审阅。本文档只描述本次 AI 改写升级，不包含图片、视频模型或 RunningHub 适配器的改动。

## 目标

在保留当前剧本数据结构和下游制作流程的前提下，让“AI 改写”从单一的格式化动作升级为可控、可检查的短剧改稿入口：

1. 用户可以选择改写方式，而不是每次都使用同一套固定指令。
2. 用户可以输入本次改写的额外要求。
3. 改写结果仍然使用当前工作台能识别的剧本格式：
   `## S01 | 内景/外景 · 地点 | 时间段`、动作段落、`角色名：（状态/表情）台词`。
4. 借鉴 `drama-skills-local/skills/short-drama-write` 的“场景职责、可见行动、对白目的、因果推进、去模板感”原则，但不直接移植它的文件系统生产流程、Markdown 方言或脚本工具。
5. 保存前做轻量结构检查，避免把明显不合格的结果直接覆盖到当前剧本。

## 不做的事情

- 不新增 Agent；继续使用现有 `script_rewriter`。
- 不新增数据库表或剧本版本系统；本次保留现有“原始内容 + 当前剧本”两字段模型。
- 不更换当前剧本格式，不采用外部技能中的 `EP001-SC001`、`[VO]` 等另一套格式。
- 不把 `short-drama-review`、`short-drama-develop` 或 `manju-laoli-skill` 的整套规则引擎直接塞进改写流程。
- 不改图片提示词、四视图、视频提示词、Seedance、MiniMax H3 或 RunningHub 适配器。
- 不把固定镜头语言、视频提示词或 `@角色` 引用写入剧本改写结果。

## 方案选择

### 方案 A：只修改系统提示词

改写 `SKILL.md` 和 Agent Prompt，让模型自行遵守更多规则。

- 优点：改动最少。
- 缺点：用户不能选择改写目标；自定义要求无法明确传入；模型偶尔会绕过格式或保存不完整结果。

### 方案 B：改造现有入口，增加模式、额外要求和轻量检查（采用）

保留现有 Agent 和数据流，在改写入口增加三个模式和一个可选要求框；后端工具负责把模式规则传给模型，并在 `save_script` 时检查剧本结构。

- 优点：改动集中，用户可控，兼容现有下游；失败时可以阻止明显坏结果覆盖原剧本。
- 缺点：需要同步前端文案、四种语言的 Prompt/Skill 变体，并增加少量测试。

### 方案 C：引入完整外部剧本生产管线

把外部技能的阶段契约、场景索引、时长脚本和审查规则全部接入。

- 优点：规则最丰富。
- 缺点：会引入第二套文件格式和生产状态，和当前 SQLite/Electron 工作台边界冲突；范围过大，容易影响已有提取、分镜和视频流程。

采用方案 B。它能解决当前“固定改写、自定义能力弱、结果缺少检查”的问题，同时保持现有 APP 的稳定边界。

## 用户界面设计

在当前“剧本 → AI 改写”步骤中增加两个轻量控件：

### 改写方式

提供三个选项，默认选中“规范整理”，保证旧行为可复现：

| 内部值 | 用户名称 | 用途 |
|---|---|---|
| `normalize` | 规范整理 | 保留原剧情，主要整理场景头、动作和对白格式，少量补足可见动作。 |
| `short_drama` | 真人短剧化 | 强化每场戏的目标、阻力、行动、转折和退出状态；减少说明腔和 AI 模板感。 |
| `dialogue_polish` | 台词润色 | 重点改善对白目的、人物语气、潜台词和节奏；不随意改动场景事实与动作结构。 |

三个模式不是三套互相冲突的剧本格式，而是同一格式下的不同改稿重点。所有模式都必须服从原文事实、用户本次要求和当前剧本格式。

### 额外要求

增加一个可选的多行输入框，例如：

> 例如：加强男女主第一次见面的试探感；保留这句台词；不要增加新角色。

额外要求只作用于本次改写，不写入数据库，不改变系统默认规则。格式、原文关键事实和安全边界优先级高于与它们冲突的自由要求。

### 执行流程

1. 用户编辑原始内容。
2. 选择改写方式并填写可选要求。
3. 点击“开始改写”或“重新改写”。
4. 前端先等待原始内容保存成功，再把模式代码和额外要求拼入 Agent 请求。
5. Agent 读取原始内容，调用 `rewrite_to_screenplay`，按模式完成改写，调用 `save_script` 保存。
6. 保存工具完成结构检查；如果是阻断级错误，则拒绝覆盖并把错误返回给 Agent 继续修正。
7. 成功后刷新当前剧本，用户再进入资产提取和分镜流程。

## 改写规则设计

### 规则优先级

从高到低：

1. 原文中明确的事实、角色关系、关键事件、结局和用户明确要求。
2. 当前项目的内容语言指令。
3. 当前选择的改写模式。
4. 通用格式和写作建议。

模型不得为了“更像短剧”擅自增加主线事件、主要角色、关键地点、超自然规则或结局变化。原文不确定之处保持不确定，不用套话替作者做决定。

### 场景规则

每个场景尽量回答以下问题：

- 这一场必须完成什么叙事职责？
- 谁想推进什么，受到什么阻力？
- 观众能看到什么具体行动或证据？
- 场内发生了什么方向性变化？
- 场景结束时，信息、关系、压力、风险或物理状态处于什么新状态？

这是一套改稿检查视角，不要求每个场景都硬塞“对手”或反转。过渡、氛围、后果处理和节奏场可以用必要的状态变化成立。

不再把“每场固定 30–60 秒”作为机械字数门槛。模型应按实际可表演的行动和对白节奏拆分场景，避免为了凑时长重复环境描写或口号。

### 行动与心理

优先写可表演的动作、停顿、距离、物件处理、视线和声音反应。抽象心理只有在确实需要时才保留，并尽量转化为观众能看到的行为或明确的画外音。

### 对白

- 每句对白应有目的：争取、回避、试探、施压、确认、转移、威胁、安抚或改变关系。
- 用人物身份、处境、关系和节奏区分说话方式。
- 避免对白重复解释观众已经看见的事情。
- 潜台词只在人物知道差异、风险或利益冲突时使用，不为了“高级感”强行绕弯。
- 长段对白需要动作、停顿或策略变化支撑；没有内部变化时应压缩。

### 去模板感

避免连续使用空泛形容词、万能情绪句、总结式金句和重复的“此时/紧接着/与此同时”。每一次润色都要服务于人物行动、冲突推进或可拍摄性，而不是单纯增加字数。

## 数据流与接口边界

### 前端

`frontend/app/views/drama/episode.vue` 继续调用现有 `useAgent().run()` 和 `/agent/script_rewriter/chat`，不新增 API 路由。发送的用户消息包含：

- 当前改写模式的稳定代码；
- 当前语言下的模式名称仅用于可读性；
- 用户填写的额外要求；
- “读取、改写并保存”的功能指令。

模式代码不会写入剧集表，也不会影响后面的资产、分镜或视频模型选择。

### Agent Prompt 与 Skill

同步更新以下内容：

- `backend/workspace/skills/script-rewriter/SKILL.md`
- `backend/workspace/skills/script-rewriter/SKILL.en.md`
- `backend/workspace/skills/script-rewriter/SKILL.ja.md`
- `backend/workspace/skills/script-rewriter/SKILL.ko.md`
- `backend/workspace/prompts/script_rewriter.md`
- `backend/workspace/prompts/script_rewriter.en.md`
- `backend/workspace/prompts/script_rewriter.ja.md`
- `backend/workspace/prompts/script_rewriter.ko.md`
- `backend/src/agents/index.ts` 中的代码兜底 Prompt

多语言版本保持同一规则和同一输出格式；如果用户选择英文、日文或韩文内容语言，输出语言仍由现有全局内容语言指令控制。

### 后端工具

`backend/src/agents/tools/script-tools.ts` 做两项最小扩展：

1. `rewrite_to_screenplay` 接受可选 `mode` 和 `instructions`，将稳定模式规则与本次要求返回给 Agent。
2. `save_script` 调用独立的轻量验证函数。阻断级结构错误不写入 `episodes.script_content`；通过后继续使用现有字段保存，并返回检查结果。

建议把验证逻辑放在新文件 `backend/src/services/script-rewrite-validator.ts`，使它不依赖 Agent、数据库或前端，方便单测。

## 轻量验证规则

验证只负责发现结构性问题，不代替人工审稿，也不判断故事好坏。

### 阻断级错误

- 没有任何场景头。
- 场景头无法识别为当前格式。
- 场景编号不是从 `S01` 开始连续递增；为兼容旧手写稿，允许 `S1` 这种无前导零写法，但同一份结果不能混用两种写法。
- 存在空场景，或场景头后直到下一个场景头没有正文。
- 输出为空，或明显是解释性回复而不是剧本。

遇到阻断级错误时，`save_script` 返回可读的中文错误和修正方向，不覆盖已有剧本，让 Agent 有机会在同一次调用中修正。

### 非阻断提醒

- 发现疑似镜头语言，例如景别、推拉摇移、俯仰拍等。
- 发现明显的抽象心理连续堆叠。
- 发现对白格式疑似不完整。
- 单场过度冗长或过度简短。

非阻断提醒不改变保存结果，避免误伤创作者的特殊写法；同时作为工具结果返回，供 Agent 最后一次自检。

## 错误与兼容性

- 原始内容为空：沿用现有前端提示，不调用 Agent。
- 原始内容保存失败：不启动改写，显示错误，避免 Agent 读取旧版本。
- 模式缺失或未知：后端按 `normalize` 处理，保证旧调用仍可用。
- 用户未填写额外要求：按所选模式的默认规则执行。
- AI 返回不合格剧本：阻断级结果不覆盖现有 `script_content`；用户可以重新改写或手动修改。
- 现有数据库、RunningHub、图片生成、视频生成和分镜结构不变。
- 不执行真实付费供应商调用作为本次代码验收。

## 计划修改的文件

### 必改

- `/Users/mac/Documents/ChatGPT/huobao-drama/frontend/app/views/drama/episode.vue`
- `/Users/mac/Documents/ChatGPT/huobao-drama/frontend/app/locales/zh.json`
- `/Users/mac/Documents/ChatGPT/huobao-drama/frontend/app/locales/en.json`
- `/Users/mac/Documents/ChatGPT/huobao-drama/frontend/app/locales/ja.json`
- `/Users/mac/Documents/ChatGPT/huobao-drama/frontend/app/locales/ko.json`
- `/Users/mac/Documents/ChatGPT/huobao-drama/backend/src/agents/tools/script-tools.ts`
- `/Users/mac/Documents/ChatGPT/huobao-drama/backend/src/agents/index.ts`
- `/Users/mac/Documents/ChatGPT/huobao-drama/backend/workspace/skills/script-rewriter/SKILL.md`
- `/Users/mac/Documents/ChatGPT/huobao-drama/backend/workspace/skills/script-rewriter/SKILL.en.md`
- `/Users/mac/Documents/ChatGPT/huobao-drama/backend/workspace/skills/script-rewriter/SKILL.ja.md`
- `/Users/mac/Documents/ChatGPT/huobao-drama/backend/workspace/skills/script-rewriter/SKILL.ko.md`
- `/Users/mac/Documents/ChatGPT/huobao-drama/backend/workspace/prompts/script_rewriter.md`
- `/Users/mac/Documents/ChatGPT/huobao-drama/backend/workspace/prompts/script_rewriter.en.md`
- `/Users/mac/Documents/ChatGPT/huobao-drama/backend/workspace/prompts/script_rewriter.ja.md`
- `/Users/mac/Documents/ChatGPT/huobao-drama/backend/workspace/prompts/script_rewriter.ko.md`
- `/Users/mac/Documents/ChatGPT/huobao-drama/backend/src/services/script-rewrite-validator.ts`

### 测试

- `/Users/mac/Documents/ChatGPT/huobao-drama/backend/tests/script-rewrite-validator.test.mjs`
- `/Users/mac/Documents/ChatGPT/huobao-drama/backend/tests/script-rewriter-structure.test.mjs`

不修改数据库 Schema、Agent 路由、图片/视频适配器和外部技能目录。

## 验收标准

1. 剧本步骤能看到三个改写方式，并能填写本次额外要求。
2. 默认“规范整理”下，现有一键改写流程仍可执行。
3. 选择“真人短剧化”或“台词润色”后，发送给 Agent 的请求能明确携带对应模式。
4. Agent 仍会读取当前集原始内容并通过 `save_script` 保存，而不是只在聊天区返回文本。
5. 保存工具能拒绝没有场景头、编号断裂、空场景和空输出等明显坏结果。
6. 现有格式可被资产提取和分镜拆解继续读取；不出现外部技能的另一套场景编号或标签方言。
7. 四种语言的界面和 Prompt/Skill 变体不出现缺失键或规则漂移。
8. 目标测试、类型检查、前端生成、`git diff --check` 通过。
9. 不调用真实 RunningHub、Seedance 或其他付费生成服务。

## 实施后的用户使用方式

第一次使用时选择“真人短剧化”，需要控制改动范围时在“额外要求”中写清楚，例如“保留原有结局，不新增角色，只加强两人的对抗对白”。如果只是把已有文字整理成当前工作台格式，选择“规范整理”；如果剧情已经稳定，只想改对白，选择“台词润色”。
