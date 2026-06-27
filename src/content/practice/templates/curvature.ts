import type { Control, InteractiveStep } from '../../types'
import type { PracticeTemplate } from './types'

// Curvature: reshape one lens with the continuous curvature slider (Lesson 3).
// The runner derives focalLength from the slider via sliderToFocalLength.

const curvatureControl: Control = {
  key: 'curvature',
  type: 'curvature',
  min: -1,
  max: 1,
  step: 0.01,
  label: 'Curvature',
}

const flatCurvatureControl: Control = {
  ...curvatureControl,
  min: -0.12,
  max: 0.12,
  step: 0.005,
}

const FLAT_EPSILON = 0.05
const isExactlyFlat = (c: number) => Math.abs(c) <= FLAT_EPSILON
const hasVisibleCurve = (c: number) => Math.abs(c) > 0.08

const OBJECT_DISTANCES = [30, 40, 50]

const convergingTemplate: PracticeTemplate = {
  id: 'curvature-converging',
  topicId: 'curvature',
  difficulty: 1,
  generate: (rng) => {
    const objectDistance = rng.pick(OBJECT_DISTANCES)
    const sfx = rng.int(0, 1_000_000_000)
    const step: InteractiveStep = {
      id: `curvature-converging-${sfx}`,
      prompt: 'Reshape the lens so it bends light **together** (a converging lens).',
      controls: [curvatureControl],
      fixed: { objectDistance },
      initial: { curvature: -0.3 },
      success: (state, image) => image.focalLength > 0 && hasVisibleCurve(state.curvature),
      correctFeedback:
        'A **convex** lens has a **positive focal length** — it bends parallel rays together at **F**.',
      hint: (_state, image) =>
        image.focalLength < 0
          ? 'The lens is **concave** now. Curve it so it __bulges outward__ to converge the rays.'
          : 'Still nearly **flat** — add more __outward curve__ until the rays clearly meet.',
    }
    return step
  },
}

const divergingTemplate: PracticeTemplate = {
  id: 'curvature-diverging',
  topicId: 'curvature',
  difficulty: 2,
  generate: (rng) => {
    const objectDistance = rng.pick(OBJECT_DISTANCES)
    const sfx = rng.int(0, 1_000_000_000)
    const step: InteractiveStep = {
      id: `curvature-diverging-${sfx}`,
      prompt: 'Reshape the lens so it spreads light **apart** (a diverging lens).',
      controls: [curvatureControl],
      fixed: { objectDistance },
      initial: { curvature: 0.3 },
      success: (state, image) => image.focalLength < 0 && hasVisibleCurve(state.curvature),
      correctFeedback:
        'A **concave** lens has a **negative focal length** — it spreads parallel rays apart.',
      hint: (_state, image) =>
        image.focalLength > 0
          ? 'The lens is still **convex**. Reverse the curve so the rays __fan outward__.'
          : 'Close to **flat** — keep curving it __inward__ until f is clearly negative.',
    }
    return step
  },
}

const flatTemplate: PracticeTemplate = {
  id: 'curvature-flat',
  topicId: 'curvature',
  difficulty: 3,
  generate: (rng) => {
    const objectDistance = rng.pick(OBJECT_DISTANCES)
    const sfx = rng.int(0, 1_000_000_000)
    const startPositive = rng.bool()
    const step: InteractiveStep = {
      id: `curvature-flat-${sfx}`,
      prompt:
        'Slide the curvature to the center so the lens is neither concave nor convex. What happens to parallel rays?',
      controls: [flatCurvatureControl],
      fixed: { objectDistance },
      initial: { curvature: startPositive ? 0.1 : -0.1 },
      success: (state) => isExactlyFlat(state.curvature),
      choices: [
        {
          id: 'straight',
          label: 'They pass almost **straight through**',
          correct: true,
          feedback: 'Yes — with no curve the lens does not steer the rays together or apart.',
        },
        {
          id: 'converge',
          label: 'They bend to a **real focus**',
          feedback: 'That means the lens is still **convex**. Move closer to the center.',
        },
        {
          id: 'diverge',
          label: 'They spread from a **virtual focus**',
          feedback: 'That means the lens is still **concave**. Move closer to the center.',
        },
      ],
      correctFeedback:
        'A **flat** lens has an enormous (infinite) focal length — no nearby **F**, so light passes nearly straight through.',
      hint: (_state, image) =>
        image.focalLength > 0
          ? 'Still bending rays **together** — reduce the __outward curve__.'
          : 'Still spreading rays **apart** — reduce the __inward curve__.',
    }
    return step
  },
}

export const curvatureTemplates = [convergingTemplate, divergingTemplate, flatTemplate]
