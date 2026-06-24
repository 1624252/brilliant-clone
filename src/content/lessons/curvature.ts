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
    animation: 'curvature',
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
      hint: (_state, image) =>
        image.focalLength < 0
          ? 'The lens is **concave** right now, so it is spreading rays apart. To make rays converge, reshape it until it bulges outward.'
          : 'The lens is still nearly **flat**, so the focus is too far away to see. Add more outward curve until the rays clearly meet.',
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
      hint: (_state, image) =>
        image.focalLength > 0
          ? 'The lens is still **convex**, so it is pulling rays together. Reverse the curve so the rays fan outward instead.'
          : 'The lens is close to flat. Keep curving it inward until the focal length becomes clearly negative.',
    },
    {
      id: 'make-flat',
      prompt:
        'Make the lens neither concave nor convex by sliding the curvature to the center. What happens to incoming parallel rays?',
      controls: [curvatureControl],
      fixed: { objectDistance: 40 },
      initial: { curvature: 0.4 },
      success: (_state, image) => isFlat(image.focalLength),
      choices: [
        {
          id: 'straight',
          label: 'They pass almost straight through',
          correct: true,
          feedback:
            'Yes. With no inward or outward curve, the lens does not steer the parallel rays together or apart.',
        },
        {
          id: 'converge',
          label: 'They bend together to a real focus',
          feedback:
            'That would mean the lens is still convex. Move the shape closer to the center where it is neither concave nor convex.',
        },
        {
          id: 'diverge',
          label: 'They spread apart from a virtual focus',
          feedback:
            'That would mean the lens is still concave. Move the shape closer to the center where it is neither concave nor convex.',
        },
      ],
      correctFeedback:
        'A **flat** lens has an **enormous (infinite) focal length** — almost no focal point, so light passes nearly straight through.',
      hint: (_state, image) =>
        image.focalLength > 0
          ? 'The lens still bends rays **together**, so it is not flat yet. Reduce the outward curve until the rays pass almost straight through.'
          : 'The lens still spreads rays **apart**, so it is not flat yet. Reduce the inward curve until the rays pass almost straight through.',
    },
  ],
}
