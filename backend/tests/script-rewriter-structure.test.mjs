import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const root = new URL('..', import.meta.url)
const read = (path) => readFileSync(new URL(path, root), 'utf8')

test('script rewrite tool exposes stable modes and validates before saving', () => {
  const tools = read('src/agents/tools/script-tools.ts')

  assert.match(tools, /normalize/)
  assert.match(tools, /short_drama/)
  assert.match(tools, /dialogue_polish/)
  assert.match(tools, /mode: z\.enum/)
  assert.match(tools, /validateScriptRewrite\(content\)/)
  assert.match(tools, /if \(!validation\.ok\)/)
  assert.match(tools, /Script saved/)
})

test('script rewriter rules keep one format and expose the three modes', () => {
  const files = [
    'workspace/skills/script-rewriter/SKILL.md',
    'workspace/skills/script-rewriter/SKILL.en.md',
    'workspace/skills/script-rewriter/SKILL.ja.md',
    'workspace/skills/script-rewriter/SKILL.ko.md',
    'workspace/prompts/script_rewriter.md',
    'workspace/prompts/script_rewriter.en.md',
    'workspace/prompts/script_rewriter.ja.md',
    'workspace/prompts/script_rewriter.ko.md',
  ]
  for (const path of files) {
    const source = read(path)
    assert.match(source, /read_episode_script/)
    assert.match(source, /rewrite_to_screenplay/)
    assert.match(source, /save_script/)
    assert.match(source, /normalize/)
    assert.match(source, /short_drama/)
    assert.match(source, /dialogue_polish/)
    assert.match(source, /S01|S<number>|S编号/)
    assert.doesNotMatch(source, /EP001-SC001/)
  }

  const fallback = read('src/agents/index.ts')
  assert.match(fallback, /short_drama/)
  assert.match(fallback, /dialogue_polish/)
  assert.match(fallback, /save_script/)
})

test('episode rewrite UI sends the selected mode and custom requirements', () => {
  const episode = read('../frontend/app/views/drama/episode.vue')

  assert.match(episode, /rewriteMode/)
  assert.match(episode, /rewriteInstructions/)
  assert.match(episode, /normalize/)
  assert.match(episode, /short_drama/)
  assert.match(episode, /dialogue_polish/)
  assert.match(episode, /改写模式/)
  assert.match(episode, /rewriteCustomLabel/)
  assert.match(episode, /saveRaw\(\)/)
})

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
