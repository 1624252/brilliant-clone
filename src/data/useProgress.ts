import { useEffect, useState } from 'react'
import { collection, doc, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase/config'
import type { LessonProgress, Streak } from './progress'

export interface ProgressState {
  /** lessonId -> progress */
  byLesson: Record<string, LessonProgress>
  streak: Streak | null
  loading: boolean
}

const EMPTY: ProgressState = { byLesson: {}, streak: null, loading: true }

/** Live-subscribe to the signed-in user's progress docs and streak. */
export function useProgress(uid: string | null): ProgressState {
  const [state, setState] = useState<ProgressState>(EMPTY)

  useEffect(() => {
    if (!uid) {
      // Logged out: clear any prior user's data. Deferred so we don't setState
      // synchronously inside the effect body.
      const id = setTimeout(
        () => setState({ byLesson: {}, streak: null, loading: false }),
        0,
      )
      return () => clearTimeout(id)
    }

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

    const unsubUser = onSnapshot(doc(db, 'users', uid), (d) => {
      const streak = (d.data()?.streak as Streak | undefined) ?? null
      setState((s) => ({ ...s, streak }))
    })

    return () => {
      unsubProgress()
      unsubUser()
    }
  }, [uid])

  return state
}
