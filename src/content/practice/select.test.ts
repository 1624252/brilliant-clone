import { describe, it, expect } from 'vitest'
import { makeRng } from './rng'
import {
  selectNextTopic,
  topicWeight,
  retrievalWeight,
  spacingWeight,
  type MasteryLike,
} from './select'
import { practiceTopicIds } from './topics'

describe('retrievalWeight', () => {
  it('weights a frequently-wrong topic above a frequently-right one', () => {
    const weak = retrievalWeight({ attempts: 10, wrong: 8 })
    const strong = retrievalWeight({ attempts: 10, wrong: 1 })
    expect(weak).toBeGreaterThan(strong)
  })

  it('gives unseen topics a moderate (between) weight', () => {
    const unseen = retrievalWeight(undefined)
    const weak = retrievalWeight({ attempts: 10, wrong: 9 })
    const strong = retrievalWeight({ attempts: 10, wrong: 0 })
    expect(unseen).toBeLessThan(weak)
    expect(unseen).toBeGreaterThan(strong)
  })
})

describe('spacingWeight', () => {
  it('treats unseen topics as maximally due', () => {
    expect(spacingWeight(undefined, 100)).toBe(4)
    expect(spacingWeight({ attempts: 0, wrong: 0 }, 100)).toBe(4)
  })

  it('damps a just-seen topic and lifts an overdue one', () => {
    // box 0 → review gap 2. Seen at index 50.
    const fresh = spacingWeight({ attempts: 3, wrong: 0, box: 0, lastSeenIndex: 50 }, 50)
    const overdue = spacingWeight({ attempts: 3, wrong: 0, box: 0, lastSeenIndex: 50 }, 80)
    expect(fresh).toBeLessThan(1)
    expect(overdue).toBeGreaterThan(fresh)
  })

  it('spaces a high-box (well-known) topic out further than a low-box one', () => {
    // Same elapsed gap of 6 questions: box 0 (gap 2) is overdue, box 5 (gap 21) is not.
    const lowBox = spacingWeight({ attempts: 9, wrong: 0, box: 0, lastSeenIndex: 0 }, 6)
    const highBox = spacingWeight({ attempts: 9, wrong: 0, box: 5, lastSeenIndex: 0 }, 6)
    expect(lowBox).toBeGreaterThan(highBox)
  })
})

describe('topicWeight', () => {
  it('combines retrieval emphasis and spacing dueness', () => {
    const m = { attempts: 10, wrong: 5, box: 1, lastSeenIndex: 0 }
    expect(topicWeight(m, 20)).toBeCloseTo(retrievalWeight(m) * spacingWeight(m, 20))
  })
})

describe('selectNextTopic', () => {
  it('never repeats the previous topic (interleaving)', () => {
    let last: string | null = null
    for (let seed = 0; seed < 1000; seed++) {
      const next = selectNextTopic({}, last, makeRng(seed))
      expect(next).not.toBe(last)
      expect(practiceTopicIds).toContain(next)
      last = next
    }
  })

  it('selects a weak topic far more often than strong ones', () => {
    const mastery: MasteryLike = {}
    for (const id of practiceTopicIds) mastery[id] = { attempts: 20, wrong: 0 }
    // Make one topic the clear weak point.
    mastery['thin-lens'] = { attempts: 20, wrong: 19 }

    const counts: Record<string, number> = {}
    for (let seed = 0; seed < 4000; seed++) {
      // lastTopicId null so every topic is eligible each draw.
      const next = selectNextTopic(mastery, null, makeRng(seed * 2654435761))
      counts[next] = (counts[next] ?? 0) + 1
    }
    const weak = counts['thin-lens'] ?? 0
    const others = practiceTopicIds
      .filter((id) => id !== 'thin-lens')
      .map((id) => counts[id] ?? 0)
    for (const c of others) expect(weak).toBeGreaterThan(c)
  })

  it('prefers an overdue topic over a just-seen one of equal strength', () => {
    const mastery: MasteryLike = {}
    // All topics equally strong; one was just seen, one is long overdue.
    for (const id of practiceTopicIds) {
      mastery[id] = { attempts: 10, wrong: 1, box: 2, lastSeenIndex: 95 }
    }
    mastery['ray-tracing'] = { attempts: 10, wrong: 1, box: 2, lastSeenIndex: 5 } // overdue
    mastery['curvature'] = { attempts: 10, wrong: 1, box: 2, lastSeenIndex: 100 } // just seen

    const counts: Record<string, number> = {}
    for (let seed = 0; seed < 4000; seed++) {
      const next = selectNextTopic(mastery, null, makeRng(seed * 2654435761), 100)
      counts[next] = (counts[next] ?? 0) + 1
    }
    expect(counts['ray-tracing'] ?? 0).toBeGreaterThan(counts['curvature'] ?? 0)
  })

  it('falls back to the only topic when it is also the last one', () => {
    const only = selectNextTopic({}, 'convex-images', makeRng(3), 0, ['convex-images'])
    expect(only).toBe('convex-images')
  })
})
