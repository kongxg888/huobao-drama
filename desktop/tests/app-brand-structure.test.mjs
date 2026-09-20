import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import assert from 'node:assert/strict'

const root = new URL('../../', import.meta.url)
const read = (path) => readFileSync(new URL(path, root), 'utf8')

test('brand rename changes visible names but preserves app identity and data paths', () => {
  const pkg = JSON.parse(read('desktop/package.json'))
  const builder = read('desktop/electron-builder.yml')
  const main = read('desktop/src/main.ts')
  const updater = read('desktop/src/updater.ts')
  const nuxt = read('frontend/nuxt.config.ts')
  const zh = read('frontend/app/locales/zh.json')
  const layout = read('frontend/app/layouts/default.vue')
  const feed = read('desktop/scripts/make-update-feed.mjs')

  assert.equal(pkg.productName, '吉祥Ai短剧')
  assert.match(builder, /appId: com\.huobao\.drama/)
  assert.match(builder, /productName: 吉祥Ai短剧/)
  assert.match(main, /app\.isPackaged \? 'HuobaoDrama' : 'HuobaoDrama-Dev'/)
  assert.match(nuxt, /title: '吉祥Ai短剧'/)
  assert.match(zh, /"title": "吉祥Ai短剧"/)
  assert.match(layout, /brand-name">吉祥Ai短剧/)
  assert.match(layout, /brand-sub">Jixiang AI Shorts/)
  assert.match(feed, /pkg\.productName/)
  assert.match(updater, /readdirSync\(tmpExtract/)
  assert.doesNotMatch(updater, /path\.join\(tmpExtract, 'HuobaoDrama\.app'\)/)
})
