import type { LessonDefinition } from '../types'

// "Focusing Light": the first lesson. It introduces the focal point with an
// animated explainer (parallel rays bending to meet at F), then two quick
// hands-on steps that connect dragging the candle to what F actually means.

const FOCAL_LENGTH = 20
const objectControl = {
  key: 'objectDistance',
  type: 'drag-axis' as const,
  min: 0,
  // 80 is the visible left edge of the scene; sliding/dragging to it means ∞.
  max: 80,
  step: 0.5,
  label: 'Object distance',
  allowInfinity: true,
  // Snap to the lens (0), F, 2F, and 3F so key positions are easy to hit.
  snaps: [0, FOCAL_LENGTH, 2 * FOCAL_LENGTH, 3 * FOCAL_LENGTH],
}

export const focusLesson: LessonDefinition = {
  id: 'focusing-light',
  title: 'Focusing Light',
  order: 1,
  estMinutes: 3,
  summary: 'See where parallel rays meet — the focal point F.',
  intro: {
    heading: 'Where light comes to a focus',
    animation: 'focus',
    paragraphs: [
      'A convex lens (one that bulges outward) converges parallel rays so they all cross at one spot on the axis: the focal point, F.',
      'The distance from the lens to F is the focal length, f — a fixed property of the lens. The stronger the lens, the shorter the f.',
      'When you start, you can drag the candle and watch how its rays meet. F is the key to where (and how big) the image forms.',
    ],
  },
  steps: [
    {
      id: 'object-at-f',
      prompt: 'Slide the candle onto the focal point F. Watch the rays leave parallel.',
      controls: [objectControl],
      fixed: { focalLength: FOCAL_LENGTH },
      initial: { objectDistance: 50 },
      success: (state) => Math.abs(state.objectDistance - state.focalLength) < 0.75,
      correctFeedback:
        'At F the outgoing rays are parallel, so the image races off to infinity.',
      hint: 'Drag the candle right onto the F mark (distance 20).',
    },
    {
      id: 'far-object-focuses-at-f',
      prompt: 'Now pull the candle far away. Where does the image settle?',
      controls: [objectControl],
      fixed: { focalLength: FOCAL_LENGTH },
      initial: { objectDistance: 30 },
      success: (state, image) => image.isReal && state.objectDistance >= 60,
      correctFeedback: 'A faraway object focuses close to F — that is why F is "the focus."',
      hint: 'Drag the candle far from the lens (past 60).',
    },
    {
      kind: 'predict',
      id: 'predict-parallel-rays',
      prompt:
        'A star is so far away its rays reach the lens essentially parallel. Predict where they cross before you reveal it.',
      scene: { objectDistance: Infinity, focalLength: FOCAL_LENGTH },
      choices: [
        {
          id: 'never',
          label: 'They stay parallel and never cross',
          feedback:
            'A converging lens bends parallel rays inward, so they must cross somewhere.',
        },
        {
          id: 'focal',
          label: 'They cross right at the focal point, F',
          correct: true,
          feedback: 'Yes — F is defined as where parallel rays converge.',
        },
        {
          id: 'twice',
          label: 'They cross farther out, at 2F',
          feedback:
            'Rays from an object at 2F meet at 2F. Truly parallel rays come from infinitely far away, so they focus closer — right at F.',
        },
      ],
      reveal:
        'Parallel rays converge exactly at F — that is what "focal point" means. The farther the object, the closer its image creeps toward F.',
    },
  ],
}
