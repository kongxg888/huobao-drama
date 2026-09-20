import { test } from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_EPISODE_TARGET_DURATION,
  normalizeEpisodeBreakdownMode,
  normalizeTargetStoryboardCount,
  normalizeEpisodeTargetDuration,
  getEpisodeDurationRange,
  sumStoryboardDurationSeconds,
} from '../src/services/episode-duration.js'

test('defaults an empty target to 165 seconds', () => {
  assert.equal(DEFAULT_EPISODE_TARGET_DURATION, 165)
  assert.equal(normalizeEpisodeTargetDuration(undefined), 165)
  assert.equal(normalizeEpisodeTargetDuration(''), 165)
})

test('keeps automatic breakdown as the default and accepts custom mode', () => {
  assert.equal(normalizeEpisodeBreakdownMode(undefined), 'auto')
  assert.equal(normalizeEpisodeBreakdownMode('auto'), 'auto')
  assert.equal(normalizeEpisodeBreakdownMode('custom'), 'custom')
  assert.equal(normalizeEpisodeBreakdownMode('unknown'), 'auto')
})

test('normalizes an optional storyboard count where zero means automatic', () => {
  assert.equal(normalizeTargetStoryboardCount(undefined), 0)
  assert.equal(normalizeTargetStoryboardCount('0'), 0)
  assert.equal(normalizeTargetStoryboardCount('14'), 14)
  assert.equal(normalizeTargetStoryboardCount(0.6), 1)
  assert.equal(normalizeTargetStoryboardCount(999), 200)
})

test('normalizes a custom target to a positive integer in the safe range', () => {
  assert.equal(normalizeEpisodeTargetDuration('180'), 180)
  assert.equal(normalizeEpisodeTargetDuration(165.8), 166)
  assert.equal(normalizeEpisodeTargetDuration(1), 30)
  assert.equal(normalizeEpisodeTargetDuration(99999), 1800)
})

test('calculates a ten percent soft range for 165 seconds', () => {
  assert.deepEqual(getEpisodeDurationRange(165), { min: 149, max: 182 })
})

test('sums storyboard durations as seconds without converting to minutes', () => {
  assert.equal(sumStoryboardDurationSeconds([{ duration: 8 }, { duration: 12 }, { duration: 15 }]), 35)
  assert.equal(sumStoryboardDurationSeconds([{ duration: null }, { duration: undefined }]), 0)
})
