export type ScriptRewriteIssue = {
  severity: 'error' | 'warning'
  code: string
  message: string
}

export type ScriptRewriteValidation = {
  ok: boolean
  errors: ScriptRewriteIssue[]
  warnings: ScriptRewriteIssue[]
}

type SceneHeading = {
  lineIndex: number
  number: number
  numberText: string
  line: string
}

const SCENE_PREFIX_RE = /^##\s+S(\d+)\s*\|/
const SCENE_HEADING_RE = /^##\s+S(\d+)\s*\|\s*([^|\n]+?)\s*\|\s*([^|\n]+?)\s*$/
const CAMERA_TERMS = [
  '特写', '近景', '中景', '远景', '全景', '俯拍', '仰拍', '推镜', '拉镜', '推近', '拉远', '摇镜', '跟拍', '镜头切换',
  'close-up', 'wide shot', 'zoom in', 'pan',
]
const ABSTRACT_TERMS = ['内心', '心里', '心中', '感到', '觉得', '意识到', '想到', '不由得']

function issue(severity: ScriptRewriteIssue['severity'], code: string, message: string): ScriptRewriteIssue {
  return { severity, code, message }
}

export function validateScriptRewrite(content: string): ScriptRewriteValidation {
  const errors: ScriptRewriteIssue[] = []
  const warnings: ScriptRewriteIssue[] = []
  const normalized = String(content || '').replace(/\r\n?/g, '\n').trim()

  if (!normalized) {
    return {
      ok: false,
      errors: [issue('error', 'empty_output', '改写结果为空，未保存。')],
      warnings,
    }
  }

  const lines = normalized.split('\n')
  const headings: SceneHeading[] = []
  for (const [lineIndex, line] of lines.entries()) {
    const trimmed = line.trim()
    if (!SCENE_PREFIX_RE.test(trimmed)) continue
    const match = trimmed.match(SCENE_HEADING_RE)
    if (!match || !match[2].includes('·')) {
      errors.push(issue('error', 'invalid_scene_heading', `第 ${lineIndex + 1} 行不是当前剧本场景头格式。`))
      continue
    }
    headings.push({ lineIndex, number: Number(match[1]), numberText: match[1], line: trimmed })
  }

  if (!headings.length) {
    errors.push(issue('error', 'missing_scene_heading', '没有找到可识别的场景头，未保存。'))
    return { ok: false, errors, warnings }
  }

  const widths = new Set(headings.map(heading => heading.numberText.length))
  if (widths.size > 1) {
    errors.push(issue('error', 'mixed_number_width', '场景编号不能混用 S1 和 S01 两种写法。'))
  }

  headings.forEach((heading, index) => {
    const expected = index + 1
    if (heading.number !== expected) {
      errors.push(issue('error', 'non_continuous_scene_numbers', `场景编号应从 S01（或兼容的 S1）连续递增，发现 ${heading.line}。`))
    }
    const nextLine = headings[index + 1]?.lineIndex ?? lines.length
    const body = lines.slice(heading.lineIndex + 1, nextLine).join('\n').trim()
    if (!body) {
      errors.push(issue('error', 'empty_scene', `${heading.line} 后没有场景内容，未保存。`))
    }
  })

  const bodyText = headings.map((heading, index) => {
    const nextLine = headings[index + 1]?.lineIndex ?? lines.length
    return lines.slice(heading.lineIndex + 1, nextLine).join('\n')
  }).join('\n')
  const bodyTextLower = bodyText.toLowerCase()
  const cameraHits = CAMERA_TERMS.filter(term => bodyTextLower.includes(term.toLowerCase()))
  if (cameraHits.length) {
    warnings.push(issue('warning', 'camera_language', `疑似包含镜头语言：${cameraHits.join('、')}。剧本阶段应优先写可表演动作。`))
  }
  const abstractCount = ABSTRACT_TERMS.reduce((count, term) => count + bodyText.split(term).length - 1, 0)
  if (abstractCount >= 2) {
    warnings.push(issue('warning', 'abstract_psychology', '疑似连续使用抽象心理描写，建议改为可见动作、停顿或明确画外音。'))
  }
  if (normalized.split('\n').some(line => /^\s*说明[:：]/.test(line))) {
    warnings.push(issue('warning', 'leading_explanation', '结果中可能混入解释性文字，请保留纯剧本内容。'))
  }

  return { ok: errors.length === 0, errors, warnings }
}
