import { describe, it, expect } from 'vitest'
import {
  MAX_BOX,
  reviewGap,
  nextBox,
  isMastered,
  targetDifficulty,
  masteryLevel,
} from './scheduling'

describe('reviewGap', () => {
  it('grows monotonically with the box (spaced intervals)', () => {
    for (let b = 1; b <= MAX_BOX; b++) {
      expect(reviewGap(b)).toBeGreaterThan(reviewGap(b - 1))
    }
  })

  it('starts small and clamps the box to [0, MAX_BOX]', () => {
    expect(reviewGap(0)).toBe(2)
    expect(reviewGap(-5)).toBe(reviewGap(0))
    expect(reviewGap(99)).toBe(reviewGap(MAX_BOX))
  })
})

describe('nextBox', () => {
  it('climbs one box on a correct answer, capped at MAX_BOX', () => {
    expect(nextBox(0, true)).toBe(1)
    expect(nextBox(MAX_BOX, true)).toBe(MAX_BOX)
  })

  it('resets to 0 on a miss so the topic resurfaces soon', () => {
    expect(nextBox(4, false)).toBe(0)
    expect(nextBox(0, false)).toBe(0)
  })
})

describe('isMastered', () => {
  it('is true only at the top box', () => {
    expect(isMastered(MAX_BOX)).toBe(true)
    expect(isMastered(MAX_BOX - 1)).toBe(false)
    expect(isMastered(undefined)).toBe(false)
  })
})

describe('targetDifficulty / masteryLevel', () => {
  it('fades scaffolds: difficulty climbs as the box climbs', () => {
    expect(targetDifficulty(0)).toBe(1)
    expect(targetDifficulty(1)).toBe(1)
    expect(targetDifficulty(2)).toBe(2)
    expect(targetDifficulty(3)).toBe(2)
    expect(targetDifficulty(4)).toBe(3)
    expect(targetDifficulty(MAX_BOX)).toBe(3)
  })

  it('labels the level, with the top box reported as mastered', () => {
    expect(masteryLevel(0)).toBe('guided')
    expect(masteryLevel(2)).toBe('core')
    expect(masteryLevel(4)).toBe('challenge')
    expect(masteryLevel(MAX_BOX)).toBe('mastered')
  })
})
