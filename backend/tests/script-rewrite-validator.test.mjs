import { test } from 'node:test'
import assert from 'node:assert/strict'
import { validateScriptRewrite } from '../src/services/script-rewrite-validator.ts'

const validScript = `## S01 | 内景 · 茶室 | 黄昏

沈砚把茶盏推到桌边，指尖停在杯沿，没有看对面的人。

沈砚：（克制）你来得比约定早。

## S02 | 外景 · 山门 | 深夜

风卷起石阶上的落叶，林晚握紧袖中的信物，抬头看向山门。

林晚：（低声）今晚必须进去。`

test('accepts the current screenplay format and continuous scene numbers', () => {
  const result = validateScriptRewrite(validScript)
  assert.equal(result.ok, true)
  assert.deepEqual(result.errors, [])
})

test('rejects empty or explanation-only output', () => {
  const result = validateScriptRewrite('这是改写结果：请查看下面内容。')
  assert.equal(result.ok, false)
  assert.ok(result.errors.some(issue => issue.code === 'missing_scene_heading'))
})

test('rejects missing, invalid, and non-continuous scene headings', () => {
  const cases = [
    '## S02 | 内景 · 茶室 | 黄昏\n沈砚放下茶盏。',
    '## S01 | 内景 · 茶室 | 黄昏\n沈砚放下茶盏。\n## S03 | 外景 · 山门 | 深夜\n林晚抬头。',
    '## S01 | 茶室 | 黄昏\n沈砚放下茶盏。',
    '## S01 | 内景 · 茶室 | 黄昏\n## S02 | 外景 · 山门 | 深夜\n林晚抬头。',
  ]
  for (const content of cases) {
    const result = validateScriptRewrite(content)
    assert.equal(result.ok, false)
    assert.ok(result.errors.length > 0)
  }
})

test('allows a consistently unpadded S1/S2 sequence for legacy hand-written scripts', () => {
  const result = validateScriptRewrite(
    '## S1 | 内景 · 茶室 | 黄昏\n沈砚放下茶盏。\n\n## S2 | 外景 · 山门 | 深夜\n林晚抬头。',
  )
  assert.equal(result.ok, true)
})

test('returns camera-language and abstract-psychology findings as warnings', () => {
  const result = validateScriptRewrite(
    '## S01 | 内景 · 茶室 | 黄昏\n镜头推近沈砚的脸，他心里感到不安，内心反复挣扎。',
  )
  assert.equal(result.ok, true)
  assert.ok(result.warnings.some(issue => issue.code === 'camera_language'))
  assert.ok(result.warnings.some(issue => issue.code === 'abstract_psychology'))
})

test('rejects mixed padded and unpadded scene numbers', () => {
  const result = validateScriptRewrite(
    '## S01 | 内景 · 茶室 | 黄昏\n沈砚放下茶盏。\n\n## S2 | 外景 · 山门 | 深夜\n林晚抬头。',
  )
  assert.equal(result.ok, false)
  assert.ok(result.errors.some(issue => issue.code === 'mixed_number_width'))
})
