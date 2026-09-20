# Live-Action Style Presets Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add two built-in visual style presets for photorealistic live-action short dramas and make their image/video-specific constraints flow through the existing prompt injection path.

**Architecture:** Add the two presets to the existing SQLite seed list with stable keys `live-action` and `live-action-xianxia`. Keep the existing settings/API-driven preset flow and existing RunningHub/video adapters unchanged; the style service will continue to prefix the selected style prompt to image and video prompts. Keep the legacy `live` cleanup entry so old unedited data is still removed, while the new keys cannot be mistaken for that legacy row.

**Tech Stack:** TypeScript, Hono, Drizzle/SQLite, Nuxt/Vue, Node test runner, Electron/electron-builder.

## Global Constraints

- Do not add dependencies or change the RunningHub request contract.
- Do not store API keys or call a paid image/video supplier during verification.
- Do not modify or overwrite existing user-edited style presets.
- Keep existing 3D, anime, Ghibli, watercolor, comic, guofeng, webtoon, and noir presets unchanged.
- Use `live-action` and `live-action-xianxia` instead of the removed legacy key `live`.

---

### Task 1: Add regression coverage for the two presets

**Files:**
- Modify: `/Users/mac/Documents/ChatGPT/huobao-drama/backend/tests/style-presets-structure.test.mjs`
- Test: `/Users/mac/Documents/ChatGPT/huobao-drama/backend/tests/style-presets-structure.test.mjs`

**Interfaces:**
- Consumes: the source text exported by `/Users/mac/Documents/ChatGPT/huobao-drama/backend/src/db/sqlite-schema.ts`.
- Produces: a structural regression test that fails until both built-in presets and their video constraints exist.

- [x] **Step 1: Write the failing test**

Append this test to `backend/tests/style-presets-structure.test.mjs`:

```js
test('built-in live-action presets include image and video continuity constraints', () => {
  const schema = read('src/db/sqlite-schema.ts')

  assert.match(schema, /name: '真人影视剧质感', value: 'live-action'/)
  assert.match(schema, /name: '真人影视短剧·古风玄幻', value: 'live-action-xianxia'/)
  assert.match(schema, /natural human motion/)
  assert.match(schema, /consistent actor identity/)
  assert.match(schema, /consistent costume and prop continuity/)
  assert.match(schema, /restrained magical effects/)
  assert.match(schema, /no morphing/)
  assert.match(schema, /no flicker/)
  assert.match(schema, /REMOVED_SEED_PROMPTS/)
  assert.match(schema, /live:/)
})
```

- [x] **Step 2: Run the test to verify it fails**

Run from `/Users/mac/Documents/ChatGPT/huobao-drama/backend`:

```bash
node --test tests/style-presets-structure.test.mjs
```

Expected: the existing style tests pass, and the new test fails because the two seed entries are not present yet.

---

### Task 2: Add the built-in live-action style seeds

**Files:**
- Modify: `/Users/mac/Documents/ChatGPT/huobao-drama/backend/src/db/sqlite-schema.ts:305-344`
- Test: `/Users/mac/Documents/ChatGPT/huobao-drama/backend/tests/style-presets-structure.test.mjs`

**Interfaces:**
- Consumes: existing `stylePresetSeeds`, `SEED_SQL`, and `REMOVED_SEED_PROMPTS` startup logic.
- Produces: two active rows in `style_presets`; each row supplies one shared prompt prefix for image and video generation.

- [x] **Step 1: Insert the two seed objects**

Insert the following two objects into `stylePresetSeeds` after the `comic` entry and before `guofeng`:

```ts
  {
    name: '真人影视剧质感', value: 'live-action', sortOrder: 6,
    prompt: 'Photorealistic live-action cinematic drama style, fictional human actors, natural skin texture, realistic facial anatomy and body proportions, authentic wardrobe and real-world production design, physically accurate materials, professional film lighting, natural color grading, 35mm lens, shallow depth of field, subtle film grain, cinematic composition, consistent actor identity across shots, natural human motion, realistic facial expressions, stable identity, natural cloth and hair movement, cinematic camera movement, physically plausible motion, no cartoon, no anime, no 3D CGI, no plastic skin, no waxy face, no illustration, no morphing, no flicker, no rubbery motion',
    description: '真人影视剧摄影、灯光和自然人物运动质感，适合现代与现实题材',
  },
  {
    name: '真人影视短剧·古风玄幻', value: 'live-action-xianxia', sortOrder: 10,
    prompt: 'Photorealistic live-action Chinese xianxia fantasy short-drama style, fictional human actors, realistic facial anatomy and natural skin texture, authentic ancient Chinese costumes, detailed silk and layered fabric, historically inspired hair and accessories, grand misty mountains, celestial palaces, clouds, spiritual energy and restrained magical effects integrated with physically believable lighting, cinematic production design, professional film lighting, atmospheric depth, 35mm lens, natural skin tones, controlled color grading, consistent actor identity, costume and prop continuity across shots, natural human motion, realistic sword movement, believable wind and fabric physics, cinematic camera movement, no anime, no 3D cartoon, no game-render look, no plastic skin, no modern clothing, no excessive neon, no text or watermark, no morphing, no flicker, no rubbery motion',
    description: '真人影视短剧的古装、仙山、云海、法阵和电影级玄幻特效质感',
  },
```

Keep the existing `REMOVED_SEED_PROMPTS.live` entry unchanged. It only removes the old exact `live` seed prompt; it does not match either new key.

- [x] **Step 2: Run the focused test and typecheck**

Run from `/Users/mac/Documents/ChatGPT/huobao-drama/backend`:

```bash
node --test tests/style-presets-structure.test.mjs
npm run typecheck
```

Expected: all style structure tests pass and TypeScript exits successfully.

- [x] **Step 3: Commit the source and regression test**

Run from `/Users/mac/Documents/ChatGPT/huobao-drama`:

```bash
git add backend/src/db/sqlite-schema.ts backend/tests/style-presets-structure.test.mjs
git commit -m "feat: add live-action visual style presets"
```

The commit must not stage the pre-existing RunningHub adapter changes or any API key/configuration data.

---

### Task 3: Document the selectable styles and video behavior

**Files:**
- Modify: `/Users/mac/Documents/ChatGPT/huobao-drama/README.md:236-237`
- Test: `/Users/mac/Documents/ChatGPT/huobao-drama/backend/tests/style-presets-structure.test.mjs`

**Interfaces:**
- Consumes: the two seed keys and the existing API-driven settings/project creation flow.
- Produces: user-facing documentation that explains style presets are shared by images and videos, while model IDs stay in service configuration.

- [x] **Step 1: Add the README note**

Add this paragraph after the existing project-creation visual-style paragraph:

```markdown
Built-in visual styles include `真人影视剧质感` (`live-action`) and `真人影视短剧·古风玄幻` (`live-action-xianxia`). The selected style is automatically added to image and video prompts; video shots still need their own action and camera description. Image/video model IDs remain configured separately under AI Services.
```

- [x] **Step 2: Verify documentation and prompt injection references**

Run from `/Users/mac/Documents/ChatGPT/huobao-drama`:

```bash
git diff --check
rg -n "live-action|live-action-xianxia|图片和视频|image and video" README.md backend/src/routes/tasks.ts backend/src/services/style-preset.ts
```

Expected: no whitespace errors; the README contains both keys; the existing video injection code remains present.

- [x] **Step 3: Commit the documentation**

Run:

```bash
git add README.md
git commit -m "docs: explain live-action style usage"
```

---

### Task 4: Rename the user-facing product without breaking updates

**Files:**
- Modify: `/Users/mac/Documents/ChatGPT/huobao-drama/frontend/app/locales/zh.json`
- Modify: `/Users/mac/Documents/ChatGPT/huobao-drama/frontend/nuxt.config.ts`
- Modify: `/Users/mac/Documents/ChatGPT/huobao-drama/desktop/package.json`
- Modify: `/Users/mac/Documents/ChatGPT/huobao-drama/desktop/electron-builder.yml`
- Modify: `/Users/mac/Documents/ChatGPT/huobao-drama/desktop/src/main.ts`
- Modify: `/Users/mac/Documents/ChatGPT/huobao-drama/desktop/src/migrate.ts`
- Modify: `/Users/mac/Documents/ChatGPT/huobao-drama/desktop/src/updater.ts`
- Modify: `/Users/mac/Documents/ChatGPT/huobao-drama/desktop/assets/如提示已损坏请双击我.command`
- Modify: `/Users/mac/Documents/ChatGPT/huobao-drama/desktop/scripts/make-update-feed.mjs`
- Modify: `/Users/mac/Documents/ChatGPT/huobao-drama/desktop/scripts/publish-release.mjs`
- Modify: `/Users/mac/Documents/ChatGPT/huobao-drama/package.json`
- Modify: `/Users/mac/Documents/ChatGPT/huobao-drama/README.md`
- Modify: `/Users/mac/Documents/ChatGPT/huobao-drama/README.zh-CN.md`
- Create: `/Users/mac/Documents/ChatGPT/huobao-drama/desktop/tests/app-brand-structure.test.mjs`

**Interfaces:**
- Consumes: the existing Electron app identity, updater feed format, and user-data directory.
- Produces: visible product name `吉祥Ai短剧`, with `com.huobao.drama` and `HuobaoDrama` storage paths retained for compatibility.

- [x] **Step 1: Add a failing brand compatibility test**

Create `desktop/tests/app-brand-structure.test.mjs`:

```js
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const root = new URL('../../', import.meta.url)
const read = (path) => readFileSync(new URL(path, root), 'utf8')

test('brand rename changes visible names but preserves app identity and data paths', () => {
  const pkg = JSON.parse(read('desktop/package.json'))
  const builder = read('desktop/electron-builder.yml')
  const main = read('desktop/src/main.ts')
  const updater = read('desktop/src/updater.ts')
  const nuxt = read('frontend/nuxt.config.ts')
  const zh = read('frontend/app/locales/zh.json')
  const feed = read('desktop/scripts/make-update-feed.mjs')

  assert.equal(pkg.productName, '吉祥Ai短剧')
  assert.match(builder, /appId: com\.huobao\.drama/)
  assert.match(builder, /productName: 吉祥Ai短剧/)
  assert.match(main, /app\.isPackaged \? 'HuobaoDrama' : 'HuobaoDrama-Dev'/)
  assert.match(nuxt, /title: '吉祥Ai短剧'/)
  assert.match(zh, /"title": "吉祥Ai短剧"/)
  assert.match(feed, /pkg\.productName/)
  assert.match(updater, /readdirSync\(tmpExtract/)
  assert.doesNotMatch(updater, /path\.join\(tmpExtract, 'HuobaoDrama\.app'\)/)
})
```

- [x] **Step 2: Update visible names and safe path handling**

Apply these exact compatibility changes:

```yaml
# desktop/electron-builder.yml
appId: com.huobao.drama
productName: 吉祥Ai短剧
```

```json
// desktop/package.json
"productName": "吉祥Ai短剧"
```

Keep the existing `app.setPath('userData', ...)` expression with `HuobaoDrama` and `HuobaoDrama-Dev`. In `desktop/src/updater.ts`, replace the hard-coded extracted app path with a single-app lookup:

```ts
const extractedEntries = fs.readdirSync(tmpExtract, { withFileTypes: true })
const appEntry = extractedEntries.find(entry => entry.isDirectory() && entry.name.endsWith('.app'))
if (!appEntry) throw new Error('更新包内容异常（未找到 macOS 应用包）')
const newApp = path.join(tmpExtract, appEntry.name)
```

Use `吉祥Ai短剧` for the window title, migration/startup error-box titles, Chinese application title, shortcut name, and product description. Build/feed/publish scripts must derive artifact prefixes from `pkg.productName`; do not hard-code `HuobaoDrama` as the new artifact prefix. Keep update feed domains and internal app paths unchanged.

- [x] **Step 3: Run the brand test and package scripts' static checks**

Run:

```bash
node --test desktop/tests/app-brand-structure.test.mjs
git diff --check
```

- [x] **Step 4: Commit the brand change**

```bash
git add frontend/app/locales/zh.json frontend/nuxt.config.ts desktop/package.json desktop/electron-builder.yml desktop/src/main.ts desktop/src/migrate.ts desktop/src/updater.ts 'desktop/assets/如提示已损坏请双击我.command' desktop/scripts/make-update-feed.mjs desktop/scripts/publish-release.mjs package.json README.md README.zh-CN.md desktop/tests/app-brand-structure.test.mjs
git commit -m "feat: rename app to 吉祥Ai短剧"
```

---

### Task 5: Build and package the updated application

**Files:**
- Verify: `/Users/mac/Documents/ChatGPT/huobao-drama/backend`
- Verify: `/Users/mac/Documents/ChatGPT/huobao-drama/frontend`
- Verify: `/Users/mac/Documents/ChatGPT/huobao-drama/desktop/release/`

**Interfaces:**
- Consumes: the two committed style seeds and existing provider configuration.
- Produces: generated frontend assets and macOS installer artifacts containing the new presets.

- [x] **Step 1: Run focused backend and frontend checks**

Run from `/Users/mac/Documents/ChatGPT/huobao-drama/backend`:

```bash
node --test tests/style-presets-structure.test.mjs tests/final-prompt-structure.test.mjs tests/character-image-generation.test.mjs tests/video-prompt-batch-structure.test.mjs
npm run typecheck
```

Run from `/Users/mac/Documents/ChatGPT/huobao-drama/frontend`:

```bash
node --test tests/style-preset-structure.test.mjs
npm run generate
```

Expected: focused structural tests pass, backend typecheck passes, and frontend generation completes.

- [x] **Step 2: Package the desktop application**

Run from `/Users/mac/Documents/ChatGPT/huobao-drama`:

```bash
npm run dist
```

Expected: `desktop/release/` contains refreshed arm64 and x64 macOS artifacts.

- [x] **Step 3: Verify the packaged output without a paid generation**

Run:

```bash
rg -n "真人影视剧质感|真人影视短剧·古风玄幻|live-action-xianxia|natural human motion" desktop/build desktop/release 2>/dev/null
git diff --check
git status --short --branch
```

Expected: the packaged backend contains the new seed strings, no diff-check errors exist, and no API key is present in the working tree.

Do not submit a real RunningHub image/video task as part of packaging verification; manual generation remains a separate user-authorized acceptance step.
