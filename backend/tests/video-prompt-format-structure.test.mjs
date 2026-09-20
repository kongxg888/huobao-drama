import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const root = new URL('..', import.meta.url)
const read = (path) => readFileSync(new URL(path, root), 'utf8')

test('video prompt format branches cover Seedance 2.5, Seedance 2.0 and MiniMax H3', () => {
  const format = read('src/services/video-prompt-format.ts')
  const skill = read('workspace/skills/prompt-generator/video-prompt/SKILL.md')
  const breaker = read('workspace/skills/storyboard-breaker/SKILL.md')
  const agentSkills = read('src/agents/skills.ts')

  assert.match(format, /seedance-2\.5/)
  assert.match(format, /seedance-2\.0/)
  assert.match(format, /minimax-h3/)
  assert.match(format, /resolveVideoPromptDialect/)

  assert.match(skill, /Seedance 2\.5/)
  assert.match(skill, /Seedance 2\.0/)
  assert.match(skill, /MiniMax H3/)
  assert.match(skill, /【画幅风格】/)
  assert.match(skill, /subject_definitions/)
  assert.match(skill, /integrated_multimodal_description/)
  assert.match(skill, /通用回退格式/)

  assert.match(breaker, /模型格式支线/)
  assert.match(agentSkills, /storyboard_breaker: \['storyboard-breaker', 'prompt-generator\/video-prompt'\]/)
})
