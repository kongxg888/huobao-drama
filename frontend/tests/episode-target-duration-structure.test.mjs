import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const root = new URL('..', import.meta.url)
const read = (path) => readFileSync(new URL(path, root), 'utf8')

test('episode video production keeps automatic mode and adds custom mode controls', () => {
  const episode = read('app/views/drama/episode.vue')

  assert.match(episode, /breakdownMode/)
  assert.match(episode, /breakdown_mode/)
  assert.match(episode, /targetEpisodeDuration|target_duration/)
  assert.match(episode, /targetStoryboardCount|target_storyboard_count/)
  assert.match(episode, /episodeAPI\.update/)
  assert.match(episode, /doBreakdown/)
  assert.match(episode, /rebreakSelectedStoryboard/)
})

test('the custom target is passed to the storyboard agent without removing the original flow', () => {
  const episode = read('app/views/drama/episode.vue')

  assert.match(episode, /storyboard_breaker/)
  assert.match(episode, /目标总时长|target duration/i)
  assert.match(episode, /目标分镜数量|target.*count/i)
  assert.match(episode, /自动拆分|breakdownMode.*auto/i)
})

test('all UI locales expose the dual-mode controls', () => {
  for (const locale of ['zh', 'en', 'ja', 'ko']) {
    const source = read(`app/locales/${locale}.json`)
    assert.match(source, /breakdownMode/)
    assert.match(source, /targetDuration/)
    assert.match(source, /targetCount/)
    assert.match(source, /rebreakSelected/)
  }
})
