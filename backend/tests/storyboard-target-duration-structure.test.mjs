import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const root = new URL('..', import.meta.url)
const read = (path) => readFileSync(new URL(path, root), 'utf8')

test('storyboard saving stores actual duration in seconds', () => {
  const tools = read('src/agents/tools/storyboard-tools.ts')
  const schema = read('src/db/sqlite-schema.ts')
  assert.match(tools, /totalDuration/)
  assert.doesNotMatch(tools, /Math\.ceil\(totalDuration \/ 60\)/)
  assert.match(schema, /breakdown_mode TEXT DEFAULT 'auto'/)
  assert.match(schema, /target_duration INTEGER DEFAULT 165/)
  assert.match(schema, /target_storyboard_count INTEGER DEFAULT 0/)
  assert.match(schema, /ALTER TABLE episodes ADD COLUMN breakdown_mode/)
  assert.match(schema, /SUM\(COALESCE\(s\.duration, 0\)\)/)
})

test('storyboard agent keeps automatic mode and exposes custom/local branches', () => {
  const agent = read('src/agents/index.ts')
  const tools = read('src/agents/tools/storyboard-tools.ts')
  const skill = read('workspace/skills/storyboard-breaker/SKILL.md')

  assert.match(agent, /自动拆分|automatic/i)
  assert.match(agent, /自定义拆分|custom/i)
  assert.match(agent, /当前分镜|selected storyboard/i)
  assert.match(tools, /rebreak_storyboard/)
  assert.match(skill, /自定义拆分|自动拆分/)
})

test('local rebreak branch cannot replace the whole episode', () => {
  const tools = read('src/agents/tools/storyboard-tools.ts')
  assert.match(tools, /storyboard_id/)
  assert.match(tools, /replace_existing/)
  assert.match(tools, /局部|local|selected/i)
})
