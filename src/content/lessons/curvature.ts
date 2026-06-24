import type { LessonDefinition } from '../types'

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

const FLAT_CURVATURE_EPSILON = 0.03
const isExactlyFlat = (curvature: number) => Math.abs(curvature) <= FLAT_CURVATURE_EPSILON
const hasVisibleCurve = (curvature: number) => Math.abs(curvature) > 0.08

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
      success: (state, image) =>
        image.focalLength > 0 && hasVisibleCurve(state.curvature),
      correctFeedback:
        'A **convex** lens has a **positive focal length** — it bends **parallel rays** together at **F**.',
      hint: (_state, image) =>
        image.focalLength < 0
          ? 'The lens is **concave** right now, so it is spreading rays apart. To make rays **converge**, reshape it until it __bulges outward__.'
          : 'The lens is still nearly **flat**, so **F** is too far away to see. Add more __outward curve__ until the rays clearly meet.',
    },
    {
      id: 'make-diverging',
      prompt: 'Now curve it the other way so it spreads light apart (a diverging lens).',
      controls: [curvatureControl],
      fixed: { objectDistance: 40 },
      initial: { curvature: 0.4 },
      success: (state, image) => image.focalLength < 0 && hasVisibleCurve(state.curvature),
      correctFeedback:
        'A **concave** lens has a **negative focal length** — it spreads **parallel rays** apart.',
      hint: (_state, image) =>
        image.focalLength > 0
          ? 'The lens is still **convex**, so it is pulling rays together. Reverse the curve so the rays __fan outward__ instead.'
          : 'The lens is close to **flat**. Keep curving it __inward__ until the focal length becomes clearly **negative**.',
    },
    {
      id: 'make-flat',
      prompt:
        'Make the lens neither concave nor convex by sliding the curvature to the center. What happens to incoming parallel rays?',
      controls: [curvatureControl],
      fixed: { objectDistance: 40 },
      initial: { curvature: 0.4 },
      success: (state) => isExactlyFlat(state.curvature),
      choices: [
        {
          id: 'straight',
          label: 'They pass almost **straight through**',
          correct: true,
          feedback:
            'Yes. With no **inward** or **outward** curve, the lens does not steer the **parallel rays** together or apart.',
        },
        {
          id: 'converge',
          label: 'They bend together to a **real focus**',
          feedback:
            'That would mean the lens is still **convex**. Move the shape closer to the center where it is neither concave nor convex.',
        },
        {
          id: 'diverge',
          label: 'They spread apart from a **virtual focus**',
          feedback:
            'That would mean the lens is still **concave**. Move the shape closer to the center where it is neither concave nor convex.',
        },
      ],
      correctFeedback:
        'A **flat** lens has an **enormous (infinite) focal length** — no nearby **F**, so light passes nearly **straight through**.',
      hint: (_state, image) =>
        image.focalLength > 0
          ? 'The lens still bends rays **together**, so it is not flat yet. Reduce the __outward curve__ until the rays pass almost straight through.'
          : 'The lens still spreads rays **apart**, so it is not flat yet. Reduce the __inward curve__ until the rays pass almost straight through.',
    },
  ],
}
