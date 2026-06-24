import { useEffect, useState } from 'react'
import { collection, doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'
import {
  emptyPracticeStats,
  type LessonProgress,
  type PracticeProgress,
  type PracticeStats,
  type Streak,
} from './progress'

export interface ProgressState {
  /** lessonId -> progress */
  byLesson: Record<string, LessonProgress>
  /** problemId -> practice attempt state */
  byPractice: Record<string, PracticeProgress>
  streak: Streak | null
  practiceStats: PracticeStats
  loading: boolean
}

/** Fresh state for a user: empty data, loading until snapshots arrive. */
const initialFor = (uid: string | null): ProgressState => ({
  byLesson: {},
  byPractice: {},
  streak: null,
  practiceStats: emptyPracticeStats(),
  loading: !!uid, // logged out -> nothing to load
})

/** Live-subscribe to the signed-in user's progress docs and streak. */
export function useProgress(uid: string | null): ProgressState {
  const [state, setState] = useState<ProgressState>(() => initialFor(uid))

  // Reset state during render when the signed-in user changes, so a new user
  // never sees the previous user's progress or streak. This is React's
  // "adjust state when a prop changes" pattern: doing it here (rather than in an
  // effect) avoids a flash of stale data between accounts, and avoids calling
  // setState synchronously inside an effect.
  const [trackedUid, setTrackedUid] = useState(uid)
  if (uid !== trackedUid) {
    setTrackedUid(uid)
    setState(initialFor(uid))
  }

  useEffect(() => {
    if (!uid) return

    const unsubProgress = onSnapshot(
      collection(db, 'users', uid, 'progress'),
      (snap) => {
        const byLesson: Record<string, LessonProgress> = {}
        snap.forEach((d) => {
          byLesson[d.id] = d.data() as LessonProgress
        })
        setState((s) => ({ ...s, byLesson, loading: false }))
      },
      () => setState((s) => ({ ...s, loading: false })),
    )

    const unsubPractice = onSnapshot(
      collection(db, 'users', uid, 'practice'),
      (snap) => {
        const byPractice: Record<string, PracticeProgress> = {}
        snap.forEach((d) => {
          byPractice[d.id] = d.data() as PracticeProgress
        })
        setState((s) => ({ ...s, byPractice, loading: false }))
      },
      () => setState((s) => ({ ...s, loading: false })),
    )

    const unsubUser = onSnapshot(doc(db, 'users', uid), (d) => {
      const streak = (d.data()?.streak as Streak | undefined) ?? null
      const practiceStats =
        (d.data()?.practiceStats as PracticeStats | undefined) ?? emptyPracticeStats()
      setState((s) => ({ ...s, streak, practiceStats }))
    })

    return () => {
      unsubProgress()
      unsubPractice()
      unsubUser()
    }
  }, [uid])

  return state
}
