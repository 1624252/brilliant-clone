// Spaced-repetition scheduling and difficulty progression for the endless
// practice stream (Phase 3 — learning science). These are pure functions with
// no React/Firestore deps so they can be unit-tested against known schedules.
//
// The model is a lightweight Leitner system keyed to the practice stream's own
// clock (the running `totalAttempts` count) rather than wall-clock days, because
// a session is minutes long: "spacing" here means how many *other* questions
// should fall between two sightings of a topic. The gap grows as a topic is
// answered correctly (it is leaving working memory more slowly), and collapses
// to the minimum when it is missed, so missed topics resurface soon.

/** Top Leitner box: a topic here has been recalled correctly, spaced out, 5×. */
export const MAX_BOX = 5

/** Smallest review gap, in intervening questions (a freshly-missed topic). */
export const BASE_GAP = 2

/** Geometric growth of the review gap per box. 1.6 → gaps 2,3,5,8,13,21. */
export const GROWTH = 1.6

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))

/**
 * Target number of intervening questions before a topic in `box` is due again.
 * Grows geometrically with the box, so well-known topics are spaced further out.
 */
export function reviewGap(box: number): number {
  const b = clamp(Math.round(box), 0, MAX_BOX)
  return Math.round(BASE_GAP * GROWTH ** b)
}

/**
 * The Leitner box after an attempt: climb one box on a correct answer (capped),
 * drop straight back to 0 on a miss so the topic is rescheduled almost
 * immediately (spaced repetition's "resurface what you got wrong sooner").
 */
export function nextBox(box: number, correct: boolean): number {
  if (!correct) return 0
  return clamp(Math.round(box) + 1, 0, MAX_BOX)
}

/**
 * Mastery signal for a topic: reaching the top box means it was recalled
 * correctly across `MAX_BOX` suitably-spaced reviews, not just crammed once.
 */
export function isMastered(box: number | undefined): boolean {
  return (box ?? 0) >= MAX_BOX
}

export type Difficulty = 1 | 2 | 3

/**
 * Desirable difficulty with fading scaffolds: a learner still building a topic
 * (low box) gets the most supported variants; as the box climbs, harder
 * variants are favored so problems stay effortful enough to grow from.
 */
export function targetDifficulty(box: number): Difficulty {
  if (box <= 1) return 1
  if (box <= 3) return 2
  return 3
}

export type MasteryLevel = 'guided' | 'core' | 'challenge' | 'mastered'

/** Human-facing label for the current support level (drives the UI chip). */
export function masteryLevel(box: number): MasteryLevel {
  if (isMastered(box)) return 'mastered'
  switch (targetDifficulty(box)) {
    case 1:
      return 'guided'
    case 2:
      return 'core'
    default:
      return 'challenge'
  }
}
