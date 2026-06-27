import type { Rng } from './rng'
import { reviewGap } from './scheduling'
import { practiceTopicIds, type PracticeTopicId } from './topics'

// Adaptive, interleaved, spaced topic selection (Phase 3 — learning science).
//
// Each candidate topic's selection weight is the product of two factors:
//   • retrieval emphasis — weak topics (high wrong-rate) recur more often, so
//     practice keeps pulling on what the learner hasn't got yet;
//   • spacing dueness    — a topic is favored once enough other questions have
//     passed since it was last seen (a Leitner gap that grows with mastery),
//     and de-emphasized while it is still "fresh".
// On top of that, the immediately-previous topic is excluded each draw so the
// stream keeps swapping topics (interleaving).

export interface TopicMasteryLike {
  attempts: number
  wrong: number
  /** Leitner box (0..MAX_BOX); controls the spacing gap. */
  box?: number
  /** The `totalAttempts` value when this topic was last shown. */
  lastSeenIndex?: number
}

export type MasteryLike = Partial<Record<string, TopicMasteryLike>>

/** Emphasis given to a topic's error rate when weighting selection. */
const ERROR_EMPHASIS = 4

/** Floor/ceiling on the spacing multiplier so it nudges without dominating. */
const MIN_DUE = 0.2
const MAX_DUE = 4

/**
 * Retrieval emphasis: a Laplace-smoothed error rate so unseen topics get a
 * moderate (exploratory) weight and frequently-missed topics get more.
 */
export function retrievalWeight(mastery: TopicMasteryLike | undefined): number {
  const attempts = mastery?.attempts ?? 0
  const wrong = mastery?.wrong ?? 0
  const wrongRate = (wrong + 1) / (attempts + 2)
  return 1 + ERROR_EMPHASIS * wrongRate
}

/**
 * Spacing dueness: `elapsed / gap`, where `elapsed` is the number of questions
 * since the topic was last shown and `gap` is its box's target review interval.
 * Unseen topics are maximally due (exploration); recently-seen ones are damped.
 */
export function spacingWeight(
  mastery: TopicMasteryLike | undefined,
  totalAttempts: number,
): number {
  if (!mastery || (mastery.attempts ?? 0) === 0 || mastery.lastSeenIndex === undefined) {
    return MAX_DUE
  }
  const elapsed = Math.max(0, totalAttempts - mastery.lastSeenIndex)
  const gap = reviewGap(mastery.box ?? 0)
  return Math.min(MAX_DUE, Math.max(MIN_DUE, elapsed / gap))
}

/**
 * Combined selection weight = retrieval emphasis × spacing dueness. `totalAttempts`
 * is the practice stream's clock; omit it (0) for a pure retrieval-only weight.
 */
export function topicWeight(
  mastery: TopicMasteryLike | undefined,
  totalAttempts = 0,
): number {
  return retrievalWeight(mastery) * spacingWeight(mastery, totalAttempts)
}

/**
 * Choose the next topic. The previous topic is excluded (unless it is the only
 * one) to force interleaving; the rest are picked by weighted random so weak
 * and overdue topics recur more often.
 */
export function selectNextTopic(
  mastery: MasteryLike,
  lastTopicId: string | null,
  rng: Rng,
  totalAttempts = 0,
  topics: PracticeTopicId[] = practiceTopicIds,
): PracticeTopicId {
  const eligible = topics.filter((id) => id !== lastTopicId)
  const pool = eligible.length > 0 ? eligible : topics

  const weighted = pool.map((id) => ({ id, weight: topicWeight(mastery[id], totalAttempts) }))
  const total = weighted.reduce((sum, t) => sum + t.weight, 0)
  if (total <= 0) return rng.pick(pool)

  let r = rng.next() * total
  for (const t of weighted) {
    r -= t.weight
    if (r <= 0) return t.id
  }
  return weighted[weighted.length - 1].id
}
