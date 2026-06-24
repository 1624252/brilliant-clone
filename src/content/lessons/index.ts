import type { LessonDefinition } from '../types'
import { focusLesson } from './focus'
import { concaveLesson } from './concave'
import { curvatureLesson } from './curvature'
import { rayTracingLesson } from './rayTracing'
import { thinLensLesson } from './thinLens'
import { placeholderLessons } from './placeholders'

export const chapter = {
  id: 'geometric-optics-lenses',
  title: 'Geometric Optics: Lenses',
}

export const chapters = [chapter]

export const lensesLessons: LessonDefinition[] = [
  focusLesson,
  concaveLesson,
  curvatureLesson,
  rayTracingLesson,
  thinLensLesson,
  ...placeholderLessons,
].sort((a, b) => a.order - b.order)

export const lessonsByTopic: Record<string, LessonDefinition[]> = {
  [chapter.id]: lensesLessons,
}

/** All lessons (real + placeholder), ordered for lookup/routing. */
export const lessons: LessonDefinition[] = [...lensesLessons]
