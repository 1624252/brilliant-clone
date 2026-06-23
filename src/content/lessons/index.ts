import type { LessonDefinition } from '../types'
import { focusLesson } from './focus'
import { thinLensLesson } from './thinLens'

/** All lessons, ordered for display. Add new lessons here. */
export const lessons: LessonDefinition[] = [focusLesson, thinLensLesson].sort(
  (a, b) => a.order - b.order,
)
