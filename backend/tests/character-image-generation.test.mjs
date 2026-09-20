import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const root = new URL('..', import.meta.url)
const read = (path) => readFileSync(new URL(path, root), 'utf8')

test('character image generation uses a four-view fallback prompt and 16:9 asset size', () => {
  const source = read('src/routes/characters.ts')

  assert.match(source, /CHARACTER_IMAGE_SIZE = '1920x1080'/)
  assert.match(source, /四视图真人身份母版/)
  assert.match(source, /正面身体视图/)
  assert.match(source, /背面身体视图/)
  assert.match(source, /显示肩部以下身体直至脚部/)
  assert.match(source, /头部、脸部、下巴、耳朵、头发和颈部完全不入画/)
  assert.match(source, /正面头肩近景/)
  assert.match(source, /右侧 45 度头肩近景/)
  assert.doesNotMatch(source, /半身角色海报构图/)
  assert.match(source, /size: CHARACTER_IMAGE_SIZE/)
})
