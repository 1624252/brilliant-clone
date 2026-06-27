import {
  deleteField,
  doc,
  getDoc,
  serverTimestamp,
  writeBatch,
  type Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase/config'
import { nextBox } from '../content/practice'
import { localDay, type Streak } from './progress'

// Practice persistence: aggregate stats and per-topic mastery on the user doc,
// plus a public leaderboard mirror. Everything is written in one batch so the
// counts, streak, and leaderboard stay consistent.

export interface QuestionStreak {
  /** Consecutive correct answers; resets to 0 on a wrong answer. */
  current: number
  longest: number
  lastAnsweredAt?: Timestamp | null
}

export interface PracticeStats {
  totalAttempts: number
  totalCorrect: number
  questionStreak: QuestionStreak
}

export interface TopicMastery {
  attempts: number
  correct: number
  wrong: number
  /** Leitner box (0..MAX_BOX): climbs on a correct answer, resets to 0 on a miss. */
  box?: number
  /** The `practiceStats.totalAttempts` value when this topic was last shown. */
  lastSeenIndex?: number
  lastSeenAt?: Timestamp | null
}

/** topicId -> mastery. */
export type MasteryMap = Record<string, TopicMastery>

export const emptyPracticeStats = (): PracticeStats => ({
  totalAttempts: 0,
  totalCorrect: 0,
  questionStreak: { current: 0, longest: 0, lastAnsweredAt: null },
})

export interface PracticeAttempt {
  topicId: string
  correct: boolean
  /** Current display name, mirrored to the public leaderboard. */
  displayName: string
}

const userRef = (uid: string) => doc(db, 'users', uid)
const leaderboardRef = (uid: string) => doc(db, 'leaderboard', uid)

/**
 * Record one practice attempt: bump aggregate stats and the answer streak,
 * update the topic's mastery, advance the daily streak on a correct answer, and
 * mirror the total-correct count to the public leaderboard — all in one batch.
 */
export async function recordPracticeAttempt(
  uid: string,
  attempt: PracticeAttempt,
): Promise<void> {
  const snap = await getDoc(userRef(uid))
  const data = (snap.data() ?? {}) as {
    practiceStats?: PracticeStats
    mastery?: MasteryMap
    streak?: Streak
  }

  const prevStats = data.practiceStats ?? emptyPracticeStats()
  const prevTopic =
    data.mastery?.[attempt.topicId] ?? { attempts: 0, correct: 0, wrong: 0, box: 0 }
  const prevStreak = data.streak ?? { current: 0, longest: 0, lastActiveDate: '' }

  const nextQCurrent = attempt.correct ? (prevStats.questionStreak?.current ?? 0) + 1 : 0
  const nextStats: PracticeStats = {
    totalAttempts: (prevStats.totalAttempts ?? 0) + 1,
    totalCorrect: (prevStats.totalCorrect ?? 0) + (attempt.correct ? 1 : 0),
    questionStreak: {
      current: nextQCurrent,
      longest: Math.max(prevStats.questionStreak?.longest ?? 0, nextQCurrent),
      lastAnsweredAt: serverTimestamp() as unknown as Timestamp,
    },
  }

  const nextTopic = {
    attempts: (prevTopic.attempts ?? 0) + 1,
    correct: (prevTopic.correct ?? 0) + (attempt.correct ? 1 : 0),
    wrong: (prevTopic.wrong ?? 0) + (attempt.correct ? 0 : 1),
    // Leitner box drives spaced repetition; lastSeenIndex marks where in the
    // stream the topic was last shown so selection can measure "elapsed".
    box: nextBox(prevTopic.box ?? 0, attempt.correct),
    lastSeenIndex: nextStats.totalAttempts,
    lastSeenAt: serverTimestamp(),
  }

  const userUpdate: Record<string, unknown> = {
    // Drop the legacy `solvedCount` left by the removed practice feature so the
    // merged practiceStats matches the current (strict) schema.
    practiceStats: { ...nextStats, solvedCount: deleteField() },
    // merge:true deep-merges this map, so other topics' mastery is preserved.
    mastery: { [attempt.topicId]: nextTopic },
  }

  // A correct answer also counts toward the daily learning streak (once a day).
  const today = localDay()
  if (attempt.correct && prevStreak.lastActiveDate !== today) {
    const current = prevStreak.lastActiveDate === localDay(-1) ? (prevStreak.current ?? 0) + 1 : 1
    userUpdate.streak = {
      current,
      longest: Math.max(prevStreak.longest ?? 0, current),
      lastActiveDate: today,
    }
  }

  const batch = writeBatch(db)
  batch.set(userRef(uid), userUpdate, { merge: true })
  batch.set(
    leaderboardRef(uid),
    {
      displayName: attempt.displayName,
      totalCorrect: nextStats.totalCorrect,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
  await batch.commit()
}
