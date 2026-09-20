import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const root = new URL('..', import.meta.url)
const read = (path) => readFileSync(new URL(path, root), 'utf8')

test('RunningHub image generation exposes and forwards 1K/2K/4K selection', () => {
  const page = read('app/views/drama/episode.vue')
  const useApi = read('app/composables/useApi.ts')
  const adapter = read('../backend/src/services/adapters/runninghub-image.ts')
  const generation = read('../backend/src/services/generation.ts')

  assert.match(page, /v-if="isRunningHubImage"/)
  assert.match(page, /const imageResolutionOptions = \[/)
  assert.match(page, /\{ key: '1k', model: '1K' \}/)
  assert.match(page, /\{ key: '2k', model: '2K' \}/)
  assert.match(page, /\{ key: '4k', model: '4K' \}/)
  assert.match(page, /return imageResolutionOptions\.some\(option => option\.key === value\) \? value : '4k'/)
  assert.match(page, /selectedImageResolution\.value\)/)

  assert.match(useApi, /resolution\?: string/)
  assert.match(useApi, /resolution: resolution \|\| undefined/)
  assert.match(adapter, /\['1k', '2k', '4k'\]/)
  assert.match(adapter, /\? normalized : '4k'/)
  assert.match(generation, /resolution: params\.resolution/)
})

test('MiniMax H3 video resolution shows 768P/2K and maps to API values', () => {
  const page = read('app/views/drama/episode.vue')
  const adapter = read('../backend/src/services/adapters/minimax-video.ts')

  assert.match(page, /minimax: \['720p', '1080p'\]/)
  assert.match(page, /'720p': '768P'/)
  assert.match(page, /'1080p': '2K'/)
  assert.match(adapter, /if \(r === '2k' \|\| r === '1080p'\) return '2K'/)
  assert.match(adapter, /return '768P'/)
})
