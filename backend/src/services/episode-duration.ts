export const DEFAULT_EPISODE_BREAKDOWN_MODE = 'auto' as const
export const DEFAULT_EPISODE_TARGET_DURATION = 165
export const DEFAULT_TARGET_STORYBOARD_COUNT = 0
export const MIN_EPISODE_TARGET_DURATION = 30
export const MAX_EPISODE_TARGET_DURATION = 1800
export const MAX_TARGET_STORYBOARD_COUNT = 200
export const EPISODE_DURATION_TOLERANCE = 0.1

export type EpisodeBreakdownMode = 'auto' | 'custom'

export function normalizeEpisodeBreakdownMode(value: unknown): EpisodeBreakdownMode {
  return value === 'custom' ? 'custom' : DEFAULT_EPISODE_BREAKDOWN_MODE
}

export function normalizeTargetStoryboardCount(value: unknown): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return DEFAULT_TARGET_STORYBOARD_COUNT
  return Math.min(MAX_TARGET_STORYBOARD_COUNT, Math.max(1, Math.round(parsed)))
}

export function normalizeEpisodeTargetDuration(
  value: unknown,
  fallback = DEFAULT_EPISODE_TARGET_DURATION,
): number {
  if (value === undefined || value === null || (typeof value === 'string' && !value.trim())) return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(MAX_EPISODE_TARGET_DURATION, Math.max(MIN_EPISODE_TARGET_DURATION, Math.round(parsed)))
}

export function getEpisodeDurationRange(targetSeconds: number) {
  const target = normalizeEpisodeTargetDuration(targetSeconds)
  return {
    min: Math.round(target * (1 - EPISODE_DURATION_TOLERANCE)),
    max: Math.round(target * (1 + EPISODE_DURATION_TOLERANCE)),
  }
}

export function sumStoryboardDurationSeconds(rows: Array<{ duration?: number | null }>): number {
  return rows.reduce((sum, row) => {
    const duration = Math.round(Number(row.duration || 0))
    return sum + (Number.isFinite(duration) && duration > 0 ? duration : 0)
  }, 0)
}
