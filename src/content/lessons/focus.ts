import type { LessonDefinition } from '../types'

// "Focusing Light": the first lesson. It introduces the focal point with an
// animated explainer (parallel rays bending to meet at F), then two quick
// hands-on steps that connect dragging the candle to what F actually means.

const FOCAL_LENGTH = 20
const objectControl = {
  key: 'objectDistance',
  type: 'drag-axis' as const,
  min: 5,
  max: 75,
  step: 0.5,
  label: 'Object distance',
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
      'A converging lens bends parallel rays so they all cross at one spot on the axis: the focal point, F.',
      'The distance from the lens to F is the focal length, f — a fixed property of the lens. The stronger the lens, the shorter the f.',
      'Below, drag the candle and watch how its rays meet. F is the key to where (and how big) the image forms.',
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
  ],
}
