import { describe, it, expect } from 'vitest'
import { deriveMilestones, earnedMilestoneIds } from './milestones'
import type { Streak } from './progress'

const streak = (longest: number): Streak => ({
  current: longest,
  longest,
  lastActiveDate: '2026-06-22',
})

const earned = (status: { completedCount: number; totalCount: number }, s: Streak | null) =>
  earnedMilestoneIds(deriveMilestones(status, s))

describe('deriveMilestones', () => {
  it('earns nothing for a brand-new learner', () => {
    expect(earned({ completedCount: 0, totalCount: 5 }, null)).toEqual([])
  })

  it('earns the first-lesson badge after one completion', () => {
    expect(earned({ completedCount: 1, totalCount: 5 }, null)).toContain('first-lesson')
    expect(earned({ completedCount: 1, totalCount: 5 }, null)).not.toContain('halfway')
  })

  it('earns the halfway badge at three completions', () => {
    expect(earned({ completedCount: 3, totalCount: 5 }, null)).toContain('halfway')
  })

  it('earns course-complete only when every lesson is done', () => {
    expect(earned({ completedCount: 4, totalCount: 5 }, null)).not.toContain('course-complete')
    expect(earned({ completedCount: 5, totalCount: 5 }, null)).toContain('course-complete')
  })

  it('never earns course-complete when there are no lessons', () => {
    expect(earned({ completedCount: 0, totalCount: 0 }, null)).not.toContain('course-complete')
  })

  it('uses the longest streak for streak badges', () => {
    expect(earned({ completedCount: 0, totalCount: 5 }, streak(1))).not.toContain('streak-2')
    expect(earned({ completedCount: 0, totalCount: 5 }, streak(2))).toContain('streak-2')
    expect(earned({ completedCount: 0, totalCount: 5 }, streak(6))).not.toContain('streak-7')
    expect(earned({ completedCount: 0, totalCount: 5 }, streak(7))).toContain('streak-7')
  })

  it('always returns all five milestone slots', () => {
    expect(deriveMilestones({ completedCount: 0, totalCount: 5 }, null)).toHaveLength(5)
  })
})
