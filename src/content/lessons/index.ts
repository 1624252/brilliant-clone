import type { LessonDefinition } from '../types'
import { focusLesson } from './focus'
import { concaveLesson } from './concave'
import { curvatureLesson } from './curvature'
import { rayTracingLesson } from './rayTracing'
import { thinLensLesson } from './thinLens'
import { placeholderLessons } from './placeholders'

/** All lessons (real + placeholder), ordered for display. Add new lessons here. */
export const lessons: LessonDefinition[] = [
  focusLesson,
  concaveLesson,
  curvatureLesson,
  rayTracingLesson,
  thinLensLesson,
  ...placeholderLessons,
].sort((a, b) => a.order - b.order)

/** The chapter these lessons belong to. */
export const chapter = {
  id: 'geometric-optics-lenses',
  title: 'Geometric Optics: Lenses',
}
