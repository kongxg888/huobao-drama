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
