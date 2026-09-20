# 当前集文本文件导入 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在当前集的“原始内容”步骤增加安全的单文件文本导入功能，支持 `.txt`、`.md` 和 `.markdown`，导入后预览，手动保存。

**Architecture:** 复用 `episode.vue` 现有的 `localRaw` 编辑缓冲区和 `saveRawWithToast` 保存流程，在原始内容工具栏增加隐藏的浏览器文件输入。文件只在前端本地读取、清理 BOM 和换行后写入编辑缓冲区，不增加后端接口、数据库字段或 Electron IPC。

**Tech Stack:** Vue 3 + Nuxt 3 + TypeScript；Node.js `node:test` 结构测试；Nuxt 静态生成。

## Global Constraints

- 只支持当前已打开的一个剧集，不根据文件名推断集数，不批量导入。
- 只接受 `.txt`、`.md`、`.markdown`；读取内容按 UTF-8 处理，移除 BOM 并统一换行。
- 导入只更新 `localRaw`，不自动调用保存接口、不自动改写、不自动创建剧集。
- 当前编辑区存在未保存内容时，替换前必须确认；取消确认必须保持原内容不变。
- 不增加依赖、后端接口、数据库字段、Electron IPC 或 Markdown 渲染器。
- 不覆盖工作区中与本任务无关的既有本地修改；提交时只暂存本计划涉及的文件。

---

### Task 1: 为文本导入建立失败优先的结构测试

**Files:**
- Modify: `/Users/mac/Documents/ChatGPT/huobao-drama/backend/tests/script-rewriter-structure.test.mjs`

**Interfaces:**
- Consumes: 当前 `episode.vue` 原始内容步骤。
- Produces: 能约束文件选择器、文本读取、换行清理、覆盖确认和导入提示存在的测试。

- [ ] **Step 1: 添加失败测试**

在现有测试文件末尾添加：

```js
test('episode raw content exposes safe single-file text import', () => {
  const episode = read('../frontend/app/views/drama/episode.vue')

  assert.match(episode, /textImportInput/)
  assert.match(episode, /accept="\.txt,\.md,\.markdown/)
  assert.match(episode, /openTextImport/)
  assert.match(episode, /importTextFile/)
  assert.match(episode, /file\.text\(\)/)
  assert.match(episode, /window\.confirm/)
  assert.match(episode, /replace\(\/\\r\\n\?\/g, '\\n'\)/)
  assert.match(episode, /episode\.script\.imported/)
})
```

- [ ] **Step 2: 运行测试确认当前实现会失败**

Run from `/Users/mac/Documents/ChatGPT/huobao-drama/backend`:

```bash
node --test tests/script-rewriter-structure.test.mjs
```

Expected: 现有改写测试通过，新增测试 FAIL，失败原因是 `episode.vue` 尚未包含 `textImportInput` 或 `importTextFile`。

- [ ] **Step 3: 提交测试**

```bash
git add backend/tests/script-rewriter-structure.test.mjs
git commit -m "test: define episode text import behavior"
```

### Task 2: 在原始内容步骤实现本地文本导入

**Files:**
- Modify: `/Users/mac/Documents/ChatGPT/huobao-drama/frontend/app/views/drama/episode.vue`（Step 0 工具栏、脚本状态和脚本操作函数）
- Modify: `/Users/mac/Documents/ChatGPT/huobao-drama/frontend/app/locales/zh.json`（`episode.script`）
- Modify: `/Users/mac/Documents/ChatGPT/huobao-drama/frontend/app/locales/en.json`（`episode.script`）
- Modify: `/Users/mac/Documents/ChatGPT/huobao-drama/frontend/app/locales/ja.json`（`episode.script`）
- Modify: `/Users/mac/Documents/ChatGPT/huobao-drama/frontend/app/locales/ko.json`（`episode.script`）

**Interfaces:**
- Consumes: `localRaw`, `rawContent`, `epId`, `saveRawWithToast`, `toast`, `toastError` 和 `t`。
- Produces: `textImportInput`、`openTextImport()`、`importTextFile(event)`；导入成功后只修改 `localRaw`，保存仍由现有 `saveRawWithToast()` 完成。

- [ ] **Step 1: 在 Step 0 工具栏添加按钮和文件输入**

在 `frontend/app/views/drama/episode.vue` 的原始内容工具栏中，把保存按钮前加入：

```vue
<button class="btn btn-sm" type="button" :disabled="textImporting" @click="openTextImport">
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="m7 8 5-5 5 5"/><path d="M5 21h14"/></svg>
  {{ t('episode.script.importText') }}
</button>
<input
  ref="textImportInput"
  class="sr-only"
  type="file"
  accept=".txt,.md,.markdown,text/plain,text/markdown"
  @change="importTextFile"
/>
```

文件输入必须只允许单选；按钮只放在 `scriptStep === 0` 的原始内容步骤。

- [ ] **Step 2: 添加安全的本地读取流程**

在脚本状态变量附近加入：

```ts
const textImportInput = ref<HTMLInputElement | null>(null)
const textImporting = ref(false)

function openTextImport() {
  textImportInput.value?.click()
}

async function importTextFile(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  const extension = file.name.toLowerCase().split('.').pop() || ''
  if (!['txt', 'md', 'markdown'].includes(extension)) {
    toast.warning(t('episode.script.importUnsupported'))
    return
  }

  if (textImporting.value) return
  textImporting.value = true
  try {
    const content = (await file.text())
      .replace(/^\uFEFF/, '')
      .replace(/\r\n?/g, '\n')
    if (!content.trim()) {
      toast.warning(t('episode.script.importEmpty'))
      return
    }

    const hasUnsavedRaw = Boolean(localRaw.value.trim() && localRaw.value !== rawContent.value)
    if (hasUnsavedRaw && !window.confirm(t('episode.script.importReplaceConfirm'))) return

    localRaw.value = content
    toast.success(t('episode.script.imported', { name: file.name, n: content.length }))
  } catch (error) {
    toastError(error, { fallback: 'episode.script.importFailed' })
  } finally {
    textImporting.value = false
  }
}
```

必须在读取前清空 `input.value`，这样用户可以连续两次选择同一个文件。错误、空文件和取消确认都不能修改 `localRaw`。

- [ ] **Step 3: 增加四种语言文案**

在每个 `episode.script` 中增加以下键；中文内容固定为：

```json
{
  "importText": "导入文本",
  "importUnsupported": "请选择 .txt、.md 或 .markdown 文本文件",
  "importEmpty": "文件内容为空，未导入",
  "importReplaceConfirm": "当前有未保存的原始内容，导入后会替换它。是否继续？",
  "imported": "已导入 {name}（{n} 字）",
  "importFailed": "文本文件读取失败，未导入"
}
```

英文、日文、韩文保持同一键名和语义，不改变既有翻译键。

- [ ] **Step 4: 运行结构测试确认实现通过**

Run from `/Users/mac/Documents/ChatGPT/huobao-drama/backend`:

```bash
node --test tests/script-rewriter-structure.test.mjs
```

Expected: 所有改写和文本导入结构测试 PASS。

- [ ] **Step 5: 提交功能实现**

```bash
git add frontend/app/views/drama/episode.vue frontend/app/locales/zh.json frontend/app/locales/en.json frontend/app/locales/ja.json frontend/app/locales/ko.json
git commit -m "feat: import episode raw text files"
```

### Task 3: 完成回归验证和构建检查

**Files:**
- Read-only verification: `/Users/mac/Documents/ChatGPT/huobao-drama/backend/tests/script-rewriter-structure.test.mjs`
- Read-only verification: `/Users/mac/Documents/ChatGPT/huobao-drama/frontend/app/views/drama/episode.vue`
- Read-only verification: `/Users/mac/Documents/ChatGPT/huobao-drama/frontend/app/locales/*.json`

**Interfaces:**
- Consumes: Task 2 的文本导入实现。
- Produces: 可交付的当前集文本导入功能和可复现的验证结果。

- [ ] **Step 1: 检查 JSON 和差异格式**

```bash
cd /Users/mac/Documents/ChatGPT/huobao-drama
node -e "for (const f of ['zh','en','ja','ko']) JSON.parse(require('fs').readFileSync('frontend/app/locales/'+f+'.json','utf8')); console.log('locale JSON OK')"
git diff --check
```

Expected: 输出 `locale JSON OK`，没有差异格式错误。

- [ ] **Step 2: 运行后端相关测试和类型检查**

```bash
cd /Users/mac/Documents/ChatGPT/huobao-drama/backend
node --test tests/script-rewriter-structure.test.mjs
npm run typecheck
```

Expected: 结构测试通过，TypeScript 以退出码 0 结束。

- [ ] **Step 3: 生成前端生产构建**

```bash
cd /Users/mac/Documents/ChatGPT/huobao-drama/frontend
npm run generate
```

Expected: Nuxt 生成成功；不要求 SSR 预渲染动态剧集页面。

- [ ] **Step 4: 检查提交范围和保留既有修改**

```bash
cd /Users/mac/Documents/ChatGPT/huobao-drama
git status --short
git log --oneline -3
git diff --check
```

Expected: 文本导入提交只包含本计划文件；工作区原有图片、视频、四视图和其他本地改动继续保留，不执行合并、推送或桌面打包。
