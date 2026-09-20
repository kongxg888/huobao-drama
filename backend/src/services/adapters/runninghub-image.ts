/**
 * RunningHub 图片生成 Adapter
 *
 * 模型字段保留 RunningHub 展示的完整型号，例如：
 * - gpt-image-2.0/text-to-image/economy
 * - gpt-image-2.0/edit/economy
 * - gpt-image-2/image-to-image/stable
 *
 * RunningHub 是异步任务接口：提交任务得到 taskId，再 POST /openapi/v2/query 查询结果。
 */
import type {
  ImageProviderAdapter,
  ProviderRequest,
  AIConfig,
  ImageGenerationRecord,
  ImageGenResponse,
  ImagePollResponse,
} from './types'
import { joinProviderUrl } from './url'

type Mode = 'text-to-image' | 'image-to-image'

function resolveRoute(model: string): { route: string; mode: Mode } {
  const normalized = model.trim().toLowerCase()
  const mode = normalized.includes('/text-to-image/')
    ? 'text-to-image'
    : normalized.includes('/image-to-image/') || normalized.includes('/edit/')
      ? 'image-to-image'
      : null

  if (!mode) {
    throw new Error(`RunningHub 模型型号缺少图片模式：${model}（需要包含 text-to-image、image-to-image 或 edit）`)
  }

  // RunningHub 的展示型号与 API 路径不是同一个字符串，必须显式映射。
  if (normalized.startsWith('gpt-image-2.0/')) {
    return { route: `/rhart-image-g-2/${mode}`, mode }
  }
  if (normalized.startsWith('gpt-image-2/')) {
    return { route: `/rhart-image-g-2-official/${mode}`, mode }
  }

  throw new Error(`暂未登记 RunningHub 图片模型路由：${model}。请先确认该型号对应的 API endpoint`)
}
function parseReferences(raw?: string | null): string[] {
  if (!raw) return []
  try {
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean).slice(0, 10) : []
  } catch {
    return []
  }
}

function aspectRatioFromSize(size?: string | null): string {
  if (!size) return '16:9'
  const [width, height] = size.split('x').map(Number)
  if (!width || !height) return '16:9'
  const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a
  const divisor = gcd(width, height)
  return `${width / divisor}:${height / divisor}`
}

function resolutionFromSize(size?: string | null): string {
  const width = Number(String(size || '').split('x')[0])
  if (width >= 2048) return '4k'
  if (width >= 1024) return '2k'
  return '1k'
}

export class RunningHubImageAdapter implements ImageProviderAdapter {
  provider = 'runninghub'

  buildGenerateRequest(config: AIConfig, record: ImageGenerationRecord): ProviderRequest {
    const model = record.model || config.model
    if (!model) throw new Error('RunningHub 图片配置缺少模型型号')

    const { route, mode } = resolveRoute(model)
    const references = parseReferences(record.referenceImages)
    if (mode === 'image-to-image' && !references.length) {
      throw new Error(`RunningHub 模型 ${model} 需要至少一张参考图`)
    }

    const body: Record<string, any> = {
      prompt: record.prompt || '',
      aspectRatio: aspectRatioFromSize(record.size),
      resolution: resolutionFromSize(record.size),
    }
    if (references.length) body.imageUrls = references

    return {
      url: joinProviderUrl(config.baseUrl, '/openapi/v2', route),
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body,
    }
  }

  parseGenerateResponse(result: any): ImageGenResponse {
    if (result?.taskId) return { isAsync: true, taskId: String(result.taskId) }
    const imageUrl = this.extractImageUrl(result)
    if (imageUrl) return { isAsync: false, imageUrl }
    throw new Error(result?.errorMessage || 'RunningHub 未返回 taskId 或图片地址')
  }

  buildPollRequest(config: AIConfig, taskId: string): ProviderRequest {
    return {
      url: joinProviderUrl(config.baseUrl, '/openapi/v2', '/query'),
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: { taskId },
    }
  }

  parsePollResponse(result: any): ImagePollResponse {
    const status = String(result?.status || '').toUpperCase()
    if (status === 'SUCCESS' || status === 'SUCCEEDED' || status === 'COMPLETED') {
      return { status: 'completed', imageUrl: this.extractImageUrl(result) || undefined }
    }
    if (status === 'FAILED' || status === 'ERROR' || status === 'CANCELLED') {
      return { status: 'failed', error: result?.errorMessage || result?.failedReason?.message || 'RunningHub 图片任务失败' }
    }
    return { status: 'processing' }
  }

  extractImageUrl(result: any): string | null {
    const results = Array.isArray(result?.results) ? result.results : []
    return results.find((item: any) => item?.url && String(item.outputType || '').toLowerCase().startsWith('image'))?.url
      || results.find((item: any) => item?.url)?.url
      || result?.imageUrl
      || result?.image_url
      || null
  }

  extractImageBase64(): { data: string; mimeType: string } | null {
    return null
  }
}
