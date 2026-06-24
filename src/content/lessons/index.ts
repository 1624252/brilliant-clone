import type { LessonDefinition } from '../types'
import { focusLesson } from './focus'
import { concaveLesson } from './concave'
import { curvatureLesson } from './curvature'
import { rayTracingLesson } from './rayTracing'
import { thinLensLesson } from './thinLens'
import { chromaticAberrationLesson } from './chromaticAberration'
import { placeholderLessons } from './placeholders'

export const chapter = {
  id: 'geometric-optics-lenses',
  title: 'Geometric Optics: Lenses',
}

export const chromaticChapter = {
  id: 'chromatic-aberration',
  title: 'Chromatic Aberration',
}

export const chapters = [chapter, chromaticChapter]

export const lensesLessons: LessonDefinition[] = [
  focusLesson,
  concaveLesson,
  curvatureLesson,
  rayTracingLesson,
  thinLensLesson,
  ...placeholderLessons,
].sort((a, b) => a.order - b.order)

export const chromaticLessons: LessonDefinition[] = [chromaticAberrationLesson]

export const lessonsByTopic: Record<string, LessonDefinition[]> = {
  [chapter.id]: lensesLessons,
  [chromaticChapter.id]: chromaticLessons,
}

/** All lessons (real + placeholder), ordered for lookup/routing. */
export const lessons: LessonDefinition[] = [...lensesLessons, ...chromaticLessons]
