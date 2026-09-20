# 真人影视风格预设设计

## 目标

为火宝短剧增加两种可在新建项目时选择、并能自动注入图片/视频提示词的真人影视视觉风格：

1. 真人影视剧质感
2. 真人影视短剧·古风玄幻

两种风格共用现有图片服务和 RunningHub 模型配置，不新增供应商、不新增依赖。

同时将用户可见的产品名称从“火宝短剧”改为“吉祥Ai短剧”。内部应用标识、数据目录、数据库文件名和更新服务地址保持不变，以保护已有项目、生成媒体和更新链路。

## 当前代码依据

- `backend/src/db/sqlite-schema.ts` 已通过 `stylePresetSeeds` 提供内置风格预设。
- `frontend/app/pages/settings.vue` 已通过风格预设管理入口支持新增、编辑、启用和停用。
- `frontend/app/pages/index.vue` 已从风格预设接口加载新建项目的风格选项。
- `backend/src/services/style-preset.ts` 根据项目绑定的风格读取提示词。
- 角色、场景、道具和视频任务已经有风格提示词注入路径。
- 旧版 `live` 预设被列入 `REMOVED_SEED_PROMPTS`，因此新预设不使用 `live` 作为内部编号。

## 用户可见预设

### 真人影视剧质感

- 内部编号：`live-action`
- 描述：真人影视剧的摄影、灯光、皮肤和真实场景质感，适合现代、都市和现实题材。
- 核心提示词：

  `Photorealistic live-action cinematic drama style, fictional human actors, natural skin texture, realistic facial anatomy and body proportions, authentic wardrobe and real-world production design, physically accurate materials, professional film lighting, natural color grading, 35mm lens, shallow depth of field, subtle film grain, cinematic composition, consistent actor identity across shots, no cartoon, no anime, no 3D CGI, no plastic skin, no waxy face, no illustration.`

### 真人影视短剧·古风玄幻

- 内部编号：`live-action-xianxia`
- 描述：真人影视短剧的古风玄幻质感，包含古装、仙山、云海、法阵和克制的电影级特效。
- 核心提示词：

  `Photorealistic live-action Chinese xianxia fantasy short-drama style, fictional human actors, realistic facial anatomy and natural skin texture, authentic ancient Chinese costumes, detailed silk and layered fabric, historically inspired hair and accessories, grand misty mountains, celestial palaces, clouds, spiritual energy and restrained magical effects integrated with physically believable lighting, cinematic production design, professional film lighting, atmospheric depth, 35mm lens, natural skin tones, controlled color grading, consistent actor identity, costume and prop continuity across shots, no anime, no 3D cartoon, no game-render look, no plastic skin, no modern clothing, no excessive neon, no text or watermark.`

## 数据流与边界

1. 内置预设由后端启动时幂等写入 `style_presets` 表。
2. 新建项目保存对应的内部编号，不复制完整提示词到项目数据。
3. 生成人物、场景、道具和视频提示词时，由现有风格服务读取并前置拼接提示词。
4. 图片模型仍由用户在服务配置中选择：首张图可使用 `gpt-image-2.0/text-to-image/economy`，参考图重绘可使用 `gpt-image-2.0/edit/economy`。
5. 本次不改变 RunningHub 请求路由、不修改 API Key 处理、不改变已有 3D、动漫、国风等风格。

## 兼容性与风险控制

- 使用 `live-action` 和 `live-action-xianxia`，避开旧版 `live` 下架键，避免启动清理逻辑误删新预设。
- 不覆盖用户在设置页编辑过的现有风格。
- 已存在的项目继续使用原有风格；新建项目可以选择两种真人影视风格。
- 真实人物照片、演员身份复刻和外部上传不纳入本次改动；本次只提供虚构人物的真人影视视觉风格。
- 产品改名只影响用户可见标题、窗口名、安装包产品名和快捷方式名称；`com.huobao.drama`、`HuobaoDrama` 数据目录、更新地址和内部桥接命名保持不变。

## 验收标准

- 设置页能看到并启用两种新风格。
- 新建项目的风格下拉框能选择两种新风格。
- 选择 `live-action-xianxia` 的项目，其人物、场景、道具和视频提示词包含对应风格前缀。
- 现有风格预设和已有项目不受影响。
- 后端结构测试、类型检查、前端生成和桌面端打包通过。
- 不执行真实 RunningHub 生图任务作为构建验收，避免未经单独确认产生外部费用。
