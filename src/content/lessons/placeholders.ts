import type { LessonDefinition } from '../types'

// Lessons planned for later phases appear on the home screen as locked
// "coming soon" cards so the chapter's shape is visible. The full five-lesson
// lenses course is now built, so there are none — the helper stays for future
// chapters (e.g., Lensmaker's Equation, Chromatic Aberration).

export function placeholder(
  id: string,
  title: string,
  order: number,
  estMinutes: number,
  summary: string,
): LessonDefinition {
  return { id, title, order, estMinutes, summary, placeholder: true, steps: [] }
}

export const placeholderLessons: LessonDefinition[] = []
