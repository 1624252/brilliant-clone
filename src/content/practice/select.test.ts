import { describe, it, expect } from 'vitest'
import { makeRng } from './rng'
import { selectNextTopic, topicWeight, type MasteryLike } from './select'
import { practiceTopicIds } from './topics'

describe('topicWeight', () => {
  it('weights a frequently-wrong topic above a frequently-right one', () => {
    const weak = topicWeight({ attempts: 10, wrong: 8 })
    const strong = topicWeight({ attempts: 10, wrong: 1 })
    expect(weak).toBeGreaterThan(strong)
  })

  it('gives unseen topics a moderate (between) weight', () => {
    const unseen = topicWeight(undefined)
    const weak = topicWeight({ attempts: 10, wrong: 9 })
    const strong = topicWeight({ attempts: 10, wrong: 0 })
    expect(unseen).toBeLessThan(weak)
    expect(unseen).toBeGreaterThan(strong)
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

  it('falls back to the only topic when it is also the last one', () => {
    const only = selectNextTopic({}, 'convex-images', makeRng(3), ['convex-images'])
    expect(only).toBe('convex-images')
  })
})
