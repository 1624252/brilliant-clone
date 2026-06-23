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
    'ray-tracing',
    'Ray Tracing',
    2,
    4,
    'Trace the three principal rays to locate any image.',
  ),
  placeholder(
    'convex-concave',
    'Convex & Concave Lenses',
    4,
    4,
    'Adjust the lens’s curvature and watch it converge or diverge.',
  ),
  placeholder(
    'magnification',
    'Magnification',
    5,
    3,
    'Measure how much larger or smaller the image becomes.',
  ),
  placeholder(
    'cover-half',
    'Cover Half the Lens',
    6,
    3,
    'What happens to the image when you block half the lens?',
  ),
  placeholder(
    'lensmaker',
    "Lensmaker's Equation",
    7,
    5,
    'How a lens’s shape and glass set its focal length.',
  ),
  placeholder(
    'chromatic',
    'Chromatic Aberration',
    8,
    4,
    'Why a simple lens splits white light into colors.',
  ),
]
