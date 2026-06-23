import type { LessonDefinition } from '../content'
import type { LessonProgress } from './progress'

export interface LessonStatusView {
  lesson: LessonDefinition
  completed: boolean
  inProgress: boolean
  unlocked: boolean
  recommended: boolean
}

export interface ChapterStatus {
  items: LessonStatusView[]
  recommendedId: string | null
  completedCount: number
  totalCount: number // real (non-placeholder) lessons
}

/**
 * Derive per-lesson status from progress. Real lessons unlock sequentially
 * (a lesson opens once the previous real lesson is completed); placeholders are
 * always locked. The recommended lesson is the first unlocked, unfinished one.
 */
export function deriveChapterStatus(
  lessons: LessonDefinition[],
  byLesson: Record<string, LessonProgress>,
): ChapterStatus {
  const ordered = [...lessons].sort((a, b) => a.order - b.order)
  const completedOf = (id: string) => byLesson[id]?.status === 'completed'

  let prevRealCompleted = true // the first real lesson is always unlocked
  let recommendedId: string | null = null
  let completedCount = 0
  let totalCount = 0

  const items: LessonStatusView[] = ordered.map((lesson) => {
    const completed = completedOf(lesson.id)
    const inProgress = byLesson[lesson.id]?.status === 'in-progress'

    if (lesson.placeholder) {
      return { lesson, completed: false, inProgress: false, unlocked: false, recommended: false }
    }

    totalCount += 1
    if (completed) completedCount += 1

    const unlocked = prevRealCompleted
    prevRealCompleted = completed

    const recommended = unlocked && !completed && recommendedId === null
    if (recommended) recommendedId = lesson.id

    return { lesson, completed, inProgress, unlocked, recommended }
  })

  return { items, recommendedId, completedCount, totalCount }
}
