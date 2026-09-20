import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const root = new URL('..', import.meta.url)
const read = (path) => readFileSync(new URL(path, root), 'utf8')

test('video prompt batch service runs per-shot async agent loop', () => {
  const svc = read('src/services/video-prompts.ts')

  // 默认只处理缺少 video_prompt 的分镜；指定 storyboardIds 时只处理所选（已有提示词也重新生成）
  assert.match(svc, /filter\(sb => !\(sb\.videoPrompt \|\| ''\)\.trim\(\)\)/)
  assert.match(svc, /storyboardIds\?\.length/)
  assert.match(svc, /storyboardIds\.includes\(sb\.id\)/)
  // 运行中不重复启动
  assert.match(svc, /status === 'running'\) return \{ started: false, total: -1 \}/)
  // 逐个分镜调用 prompt_generator，以落库结果判定成败
  assert.match(svc, /mastra\.getAgent\('prompt_generator'\)/)
  assert.match(svc, /read_storyboard_context/)
  assert.match(svc, /update_storyboard/)
  assert.match(svc, /fresh\?\.videoPrompt/)
  // 进度跟踪与文本模型覆盖
  assert.match(svc, /current_storyboard_id/)
  assert.match(svc, /modelOverride: opts\.model/)
  // 视频模型单独传递，不能把文本模型或配置名称当成视频模型
  assert.match(svc, /videoModel\?: string/)
  assert.match(svc, /opts\.videoModel/)
  assert.match(svc, /videoPromptDialectHint/)
})

test('episodes route exposes video prompt batch endpoints', () => {
  const route = read('src/routes/episodes.ts')

  assert.match(route, /app\.post\('\/:id\/generate-video-prompts'/)
  assert.match(route, /app\.get\('\/:id\/video-prompts-status'/)
  assert.match(route, /startVideoPromptBatch\(ep\.id, ep\.dramaId/)
  assert.match(route, /body\.storyboard_ids/)
  assert.match(route, /body\.video_model/)
  assert.match(route, /already_running/)
})

test('frontend batch request carries the selected target video model', () => {
  const api = read('../frontend/app/composables/useApi.ts')
  const episode = read('../frontend/app/views/drama/episode.vue')

  assert.match(api, /generateVideoPrompts: \(id: number, model\?: string, configId\?: number, storyboardIds\?: number\[\], videoModel\?: string\)/)
  assert.match(api, /video_model: videoModel \|\| undefined/)
  assert.match(episode, /generateVideoPrompts\(epId\.value, chatModelOverride\(\), chatConfigId\(\), ids, effectiveVideoModelLabel\.value\)/)
  assert.match(episode, /视频提示词格式支线/)
})
