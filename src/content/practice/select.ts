import type { Rng } from './rng'
import { practiceTopicIds, type PracticeTopicId } from './topics'

// Adaptive, interleaved topic selection. Topics the learner gets wrong more
// often are weighted up (repetition), but we never repeat the same topic twice
// in a row so practice keeps swapping between topics (interleaving).

export interface TopicMasteryLike {
  attempts: number
  wrong: number
}

export type MasteryLike = Partial<Record<string, TopicMasteryLike>>

/** Emphasis given to a topic's error rate when weighting selection. */
const ERROR_EMPHASIS = 4

/**
 * Selection weight for a topic. Uses a Laplace-smoothed error rate so unseen
 * topics get a moderate (exploratory) weight and weak topics get more.
 */
export function topicWeight(mastery: TopicMasteryLike | undefined): number {
  const attempts = mastery?.attempts ?? 0
  const wrong = mastery?.wrong ?? 0
  const wrongRate = (wrong + 1) / (attempts + 2)
  return 1 + ERROR_EMPHASIS * wrongRate
}

/**
 * Choose the next topic. The previous topic is excluded (unless it is the only
 * one) to force interleaving; the rest are picked by weighted random so weaker
 * topics recur more often.
 */
export function selectNextTopic(
  mastery: MasteryLike,
  lastTopicId: string | null,
  rng: Rng,
  topics: PracticeTopicId[] = practiceTopicIds,
): PracticeTopicId {
  const eligible = topics.filter((id) => id !== lastTopicId)
  const pool = eligible.length > 0 ? eligible : topics

  const weighted = pool.map((id) => ({ id, weight: topicWeight(mastery[id]) }))
  const total = weighted.reduce((sum, t) => sum + t.weight, 0)
  if (total <= 0) return rng.pick(pool)

  let r = rng.next() * total
  for (const t of weighted) {
    r -= t.weight
    if (r <= 0) return t.id
  }
  return weighted[weighted.length - 1].id
}
