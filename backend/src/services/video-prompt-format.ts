/**
 * 视频提示词格式支线：只负责识别目标视频模型和给 Agent 的路由提示。
 * 这里不参与供应商请求，也不替换视频适配器；未命中时继续走通用格式。
 */
export type VideoPromptDialect = 'seedance-2.5' | 'seedance-2.0' | 'minimax-h3' | 'generic'

export function resolveVideoPromptDialect(model?: string | null, provider?: string | null): VideoPromptDialect {
  const value = `${provider || ''} ${model || ''}`.toLowerCase().replace(/[\s_]+/g, '-')
  const providerName = (provider || '').toLowerCase()

  if ((providerName === 'minimax' && (!model || /h3/i.test(model))) || /minimax[-/_.]*h3/.test(value)) {
    return 'minimax-h3'
  }

  if (/seedance|doubao[-/_.]*seedance/.test(value)) {
    if (/2[-./_-]*5/.test(value)) return 'seedance-2.5'
    if (/2[-./_-]*0/.test(value)) return 'seedance-2.0'
  }

  return 'generic'
}

export function videoPromptDialectLabel(dialect: VideoPromptDialect): string {
  switch (dialect) {
    case 'seedance-2.5': return 'Seedance 2.5'
    case 'seedance-2.0': return 'Seedance 2.0'
    case 'minimax-h3': return 'MiniMax H3'
    default: return '通用视频模型'
  }
}

export function videoPromptDialectHint(model?: string | null, provider?: string | null): string {
  const dialect = resolveVideoPromptDialect(model, provider)
  return `视频提示词格式支线：${videoPromptDialectLabel(dialect)}（${dialect}）`
}

/** ai_service_configs.model 是 JSON 数组；坏数据只回退为空，不阻断提示词任务。 */
export function firstConfiguredModel(raw?: string | null): string {
  if (!raw) return ''
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed)) return String(parsed.find(Boolean) || '').trim()
    return typeof parsed === 'string' ? parsed.trim() : ''
  } catch {
    return raw.trim()
  }
}
