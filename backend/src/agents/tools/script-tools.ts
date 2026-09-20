/**
 * 剧本改写 Agent 工具
 * 模块级单例 — episodeId 通过 RequestContext 按请求注入
 */
import { createTool } from '@mastra/core/tools'
import { z } from 'zod'
import { db, schema } from '../../db/index.js'
import { eq } from 'drizzle-orm'
import { now } from '../../utils/response.js'
import { getEpisodeId } from '../context.js'
import { validateScriptRewrite } from '../../services/script-rewrite-validator.js'

export const SCRIPT_REWRITE_MODES = ['normalize', 'short_drama', 'dialogue_polish'] as const
type ScriptRewriteMode = typeof SCRIPT_REWRITE_MODES[number]

const MODE_INSTRUCTIONS: Record<ScriptRewriteMode, string> = {
  normalize: '保留原剧情和人物关系，整理场景头、动作段落与对白格式，只补足必要的可见动作，不为了增加字数扩写。',
  short_drama: '强化每场戏的叙事职责、人物目标、阻力、可见行动、方向性转折和退出状态；去掉说明腔与 AI 模板感，但不得新增主线事件、主要角色、关键地点或改变结局。',
  dialogue_polish: '保持场景事实和动作结构，重点润色对白的行动目的、人物语气、关系压力、潜台词和节奏；不要让对白重复解释已经看见的动作。',
}

function normalizeMode(value?: string): ScriptRewriteMode {
  return SCRIPT_REWRITE_MODES.includes(value as ScriptRewriteMode)
    ? value as ScriptRewriteMode
    : 'normalize'
}

const readEpisodeScript = createTool({
  id: 'read_episode_script',
  description: 'Read the script content of the current episode.',
  inputSchema: z.object({}),
  execute: async (_input, context) => {
    const episodeId = getEpisodeId(context?.requestContext)
    if (!episodeId) return { error: 'Missing episodeId in request context' }
    const [ep] = await db.select().from(schema.episodes)
      .where(eq(schema.episodes.id, episodeId))
    if (!ep) return { error: `Episode not found (id=${episodeId})` }
    const content = ep.content || ep.scriptContent
    if (!content) return { error: `Episode has no content (id=${episodeId})` }
    return { content, word_count: content.length, episode_id: episodeId }
  },
})

const rewriteToScreenplay = createTool({
  id: 'rewrite_to_screenplay',
  description: 'Read the original content for AI rewriting. Returns the source text with mode-specific formatting instructions.',
  inputSchema: z.object({
    mode: z.enum(SCRIPT_REWRITE_MODES).optional().describe('Rewrite mode from the user request'),
    instructions: z.string().optional().describe('Additional rewrite instructions'),
  }),
  execute: async ({ mode, instructions }, context) => {
    const episodeId = getEpisodeId(context?.requestContext)
    if (!episodeId) return { error: 'Missing episodeId in request context' }
    const [ep] = await db.select().from(schema.episodes)
      .where(eq(schema.episodes.id, episodeId))
    if (!ep) return { error: `Episode not found` }
    const source = ep.content || ep.scriptContent
    if (!source) return { error: `Episode has no content to rewrite` }
    const selectedMode = normalizeMode(mode)
    const custom = String(instructions || '').trim()

    return {
      source_content: source,
      mode: selectedMode,
      instruction: [
        '请将以下内容改写为当前工作台可继续提取资产和拆分镜的格式化剧本。',
        `【改写模式】${selectedMode}\n${MODE_INSTRUCTIONS[selectedMode]}`,
        '【共同规则】保留原文明确事实、人物关系、关键事件和结局；每场戏优先写目标、阻力、可见行动、变化和退出状态；心理尽量转为可表演行为；对白必须有行动目的；不写镜头语言、视频提示词或 @角色引用。',
        `【本次额外要求】${custom || '无'}`,
        '【输出格式】场景头为 ## S编号 | 内景/外景 · 地点 | 时间段；动作使用自然段；对白使用 角色名：（状态/表情）台词。场景编号从 S01（或全篇一致的 S1）连续递增。只输出剧本并调用 save_script 保存。',
        `【原始内容】\n${source}`,
      ].join('\n\n'),
    }
  },
})

const saveScript = createTool({
  id: 'save_script',
  description: 'Save the rewritten screenplay content to the current episode.',
  inputSchema: z.object({
    content: z.string().describe('The formatted screenplay content to save'),
  }),
  execute: async ({ content }, context) => {
    const episodeId = getEpisodeId(context?.requestContext)
    if (!episodeId) return { error: 'Missing episodeId in request context' }
    const validation = validateScriptRewrite(content)
    if (!validation.ok) {
      return {
        error: '剧本格式检查未通过，未覆盖已有剧本。请根据 errors 修正后再次保存。',
        validation,
      }
    }
    await db.update(schema.episodes)
      .set({ scriptContent: content, updatedAt: now() })
      .where(eq(schema.episodes.id, episodeId))

    return { message: `Script saved`, word_count: content.length, validation }
  },
})

export const scriptTools = { readEpisodeScript, rewriteToScreenplay, saveScript }
