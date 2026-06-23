import type { LessonDefinition } from '../types'
import { FLAT_FOCAL } from '../../engine'

// "Convex & Concave Lenses": one lens, one continuous curvature slider. The
// slider position (sliderToFocalLength) reshapes the lens smoothly and
// logarithmically: positive = convex (converging), negative = concave
// (diverging), and the center is flat (focal length -> infinity, no focusing).
// The learner reshapes the same lens to feel how shape sets the sign and
// strength of f.

const curvatureControl = {
  key: 'curvature',
  type: 'curvature' as const,
  min: -1,
  max: 1,
  step: 0.01, // continuous, no snapping
  label: 'Curvature',
}

/** A lens is "flat enough" when its focal length is huge (or infinite). */
const isFlat = (f: number) => !Number.isFinite(f) || Math.abs(f) > FLAT_FOCAL

export const curvatureLesson: LessonDefinition = {
  id: 'convex-concave',
  title: 'Convex & Concave Lenses',
  order: 3,
  estMinutes: 4,
  summary: 'Adjust the lens’s curvature and watch it converge or diverge.',
  intro: {
    heading: 'Shape decides everything',
    paragraphs: [
      'A lens’s **shape** sets how it bends light. Bulging outward (**convex**) pulls rays together; caving inward (**concave**) spreads them apart.',
      'The **curvature** slider reshapes one lens across the whole range: positive curvature makes it **converging** (f is positive), negative makes it **diverging** (f is negative).',
      'Right in the middle the lens is **flat** — it has no focal point at all, so light passes straight through. Reshape it and watch f flip sign.',
    ],
  },
  steps: [
    {
      id: 'make-converging',
      prompt: 'Curve the lens outward so it bends light together (a converging lens).',
      controls: [curvatureControl],
      fixed: { objectDistance: 40 },
      initial: { curvature: 0 },
      success: (_state, image) =>
        image.focalLength > 0 && !isFlat(image.focalLength),
      correctFeedback:
        'A **convex** lens has a **positive focal length** — it bends parallel rays together at F.',
      hint: 'Drag the curvature slider to the right (the positive, convex side).',
    },
    {
      id: 'make-diverging',
      prompt: 'Now curve it the other way so it spreads light apart (a diverging lens).',
      controls: [curvatureControl],
      fixed: { objectDistance: 40 },
      initial: { curvature: 0.4 },
      success: (_state, image) => image.focalLength < 0 && !isFlat(image.focalLength),
      correctFeedback:
        'A **concave** lens has a **negative focal length** — it spreads parallel rays apart.',
      hint: 'Drag the curvature slider to the left (the negative, concave side).',
    },
    {
      id: 'make-flat',
      prompt: 'Flatten the lens (slide toward the center). What happens to the focus?',
      controls: [curvatureControl],
      fixed: { objectDistance: 40 },
      initial: { curvature: 0.4 },
      success: (_state, image) => isFlat(image.focalLength),
      correctFeedback:
        'A **flat** lens has an **enormous (infinite) focal length** — almost no focal point, so light passes nearly straight through.',
      hint: 'Drag the curvature slider toward the middle until the lens goes flat.',
    },
  ],
}
