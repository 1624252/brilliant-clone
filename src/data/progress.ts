import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  type Timestamp,
} from 'firebase/firestore'
import { db } from '../firebase/config'

// Firestore persistence for user profile, streak, and per-lesson progress.
// Layout (see PRD §10.3):
//   users/{uid}                      profile + streak
//   users/{uid}/progress/{lessonId}  one doc per lesson

export type LessonStatus = 'in-progress' | 'completed'

export interface LessonProgress {
  lessonId: string
  status: LessonStatus
  currentStepIndex: number
  completedAt?: Timestamp | null
}

export interface Streak {
  current: number
  longest: number
  lastActiveDate: string // "YYYY-MM-DD" in the user's local time
}

export interface QuestionStreak {
  current: number
  longest: number
  lastAnsweredAt?: Timestamp | null
}

export interface PracticeStats {
  solvedCount: number
  totalAttempts: number
  totalCorrect: number
  questionStreak: QuestionStreak
}

export interface PracticeProgress {
  problemId: string
  attempts: number
  correctAttempts: number
  solved: boolean
  lastAnswer?: number | null
  lastCorrectAt?: Timestamp | null
  updatedAt?: Timestamp | null
}

export interface UserProfile {
  displayName: string
  email: string
  streak: Streak
  practiceStats?: PracticeStats
}

export interface PracticeAttemptResult {
  correct: boolean
  answer: number | null
}

/** Local calendar day as YYYY-MM-DD (offset in days, e.g., -1 = yesterday). */
export function localDay(offsetDays = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const userRef = (uid: string) => doc(db, 'users', uid)
const progressRef = (uid: string, lessonId: string) =>
  doc(db, 'users', uid, 'progress', lessonId)
const practiceRef = (uid: string, problemId: string) =>
  doc(db, 'users', uid, 'practice', problemId)

export const emptyPracticeStats = (): PracticeStats => ({
  solvedCount: 0,
  totalAttempts: 0,
  totalCorrect: 0,
  questionStreak: { current: 0, longest: 0, lastAnsweredAt: null },
})

/** Create or update the user profile document (called on sign-up / first login). */
export async function ensureUserDoc(
  uid: string,
  displayName: string,
  email: string,
): Promise<void> {
  const ref = userRef(uid)
  const snap = await getDoc(ref)
  if (snap.exists()) {
    // Keep the latest display name/email but don't clobber the streak.
    await setDoc(ref, { displayName, email }, { merge: true })
    return
  }
  await setDoc(ref, {
    displayName,
    email,
    createdAt: serverTimestamp(),
    streak: { current: 0, longest: 0, lastActiveDate: '' },
    practiceStats: emptyPracticeStats(),
  })
}

/** Persist resume state as the learner advances through steps. */
export async function saveStepProgress(
  uid: string,
  lessonId: string,
  currentStepIndex: number,
): Promise<void> {
  const ref = progressRef(uid, lessonId)
  const snap = await getDoc(ref)
  const existing = snap.data() as LessonProgress | undefined

  await setDoc(
    ref,
    {
      lessonId,
      // Replaying a completed lesson should never make it incomplete again.
      status: existing?.status === 'completed' ? 'completed' : 'in-progress',
      currentStepIndex,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
}

/** Mark a lesson complete and bump the daily streak. */
export async function completeLesson(uid: string, lessonId: string): Promise<void> {
  await setDoc(
    progressRef(uid, lessonId),
    {
      lessonId,
      status: 'completed',
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  )
  await bumpStreak(uid)
}

/** Persist one AP-style practice submission and update question/daily streaks. */
export async function recordPracticeAttempt(
  uid: string,
  problemId: string,
  result: PracticeAttemptResult,
): Promise<void> {
  const problemRef = practiceRef(uid, problemId)
  const problemSnap = await getDoc(problemRef)
  const previousProblem = problemSnap.data() as PracticeProgress | undefined
  const wasSolved = previousProblem?.solved === true

  const nextProblem: Record<string, unknown> = {
    problemId,
    attempts: (previousProblem?.attempts ?? 0) + 1,
    correctAttempts: (previousProblem?.correctAttempts ?? 0) + (result.correct ? 1 : 0),
    solved: wasSolved || result.correct,
    updatedAt: serverTimestamp(),
  }
  if (result.answer !== null) nextProblem.lastAnswer = result.answer
  if (result.correct) nextProblem.lastCorrectAt = serverTimestamp()

  await setDoc(problemRef, nextProblem, { merge: true })

  const userSnap = await getDoc(userRef(uid))
  const prevStats: PracticeStats = userSnap.data()?.practiceStats ?? emptyPracticeStats()
  const nextCurrent = result.correct ? (prevStats.questionStreak?.current ?? 0) + 1 : 0
  const nextStats = {
    solvedCount: (prevStats.solvedCount ?? 0) + (result.correct && !wasSolved ? 1 : 0),
    totalAttempts: (prevStats.totalAttempts ?? 0) + 1,
    totalCorrect: (prevStats.totalCorrect ?? 0) + (result.correct ? 1 : 0),
    questionStreak: {
      current: nextCurrent,
      longest: Math.max(prevStats.questionStreak?.longest ?? 0, nextCurrent),
      lastAnsweredAt: serverTimestamp(),
    },
  }
  await setDoc(userRef(uid), { practiceStats: nextStats }, { merge: true })

  if (result.correct) await bumpStreak(uid)
}

/** Increment the streak once per local day; reset if a day was missed. */
export async function bumpStreak(uid: string): Promise<void> {
  const ref = userRef(uid)
  const snap = await getDoc(ref)
  const prev: Streak = snap.data()?.streak ?? {
    current: 0,
    longest: 0,
    lastActiveDate: '',
  }
  const today = localDay()
  if (prev.lastActiveDate === today) return // already counted today

  const current = prev.lastActiveDate === localDay(-1) ? prev.current + 1 : 1
  const longest = Math.max(prev.longest ?? 0, current)
  await setDoc(
    ref,
    { streak: { current, longest, lastActiveDate: today } },
    { merge: true },
  )
}
