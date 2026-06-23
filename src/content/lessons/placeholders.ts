import type { LessonDefinition } from '../types'

// Lessons planned for later phases. They appear on the home screen as locked
// "coming soon" cards so the chapter's shape is visible. No steps yet.

function placeholder(
  id: string,
  title: string,
  order: number,
  estMinutes: number,
  summary: string,
): LessonDefinition {
  return { id, title, order, estMinutes, summary, placeholder: true, steps: [] }
}

export const placeholderLessons: LessonDefinition[] = [
  placeholder(
    'concave-lenses',
    'Concave Lenses',
    2,
    3,
    'See how a concave lens spreads light out into a virtual focus.',
  ),
  placeholder(
    'convex-concave',
    'Convex & Concave Lenses',
    3,
    4,
    'Adjust the lens’s curvature and watch it converge or diverge.',
  ),
  placeholder(
    'ray-tracing',
    'Ray Tracing',
    4,
    4,
    'Trace the three principal rays to locate any image.',
  ),
]
