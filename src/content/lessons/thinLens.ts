import type { LessonDefinition } from '../types'

// "The Thin Lens Equation" lesson. A fixed converging lens (f = 20); the learner
// drags the object along the axis to satisfy each goal. Success rules read the
// engine's image classification, so they stay correct by construction.

const FOCAL_LENGTH = 20
const objectControl = {
  key: 'objectDistance',
  type: 'drag-axis' as const,
  min: 5,
  max: 75,
  step: 0.5,
  label: 'Object distance',
}

export const thinLensLesson: LessonDefinition = {
  id: 'thin-lens-equation',
  title: 'The Thin Lens Equation',
  order: 3,
  estMinutes: 4,
  summary: 'Drag the candle to control where and how big the image forms.',
  intro: {
    heading: 'One equation ties it all together',
    paragraphs: [
      'The thin lens equation links the three distances:  1/f = 1/dₒ + 1/dᵢ.',
      'With f fixed, moving the candle (dₒ) changes where the image forms (dᵢ) — and the magnification m = −dᵢ/dₒ tells you if it flips and by how much.',
      'In each step, drag the candle to make a specific kind of image. The live equation updates as you go.',
    ],
  },
  steps: [
    {
      id: 'same-size-at-2f',
      prompt: 'Drag the candle so its image is the same size (just flipped).',
      controls: [objectControl],
      fixed: { focalLength: FOCAL_LENGTH },
      initial: { objectDistance: 60 },
      success: (_state, image) =>
        image.isReal && Math.abs(image.magnification + 1) < 0.06,
      correctFeedback: 'That is 2F — same size, flipped.',
      hint: 'Try the 2F mark (twice the focal length).',
    },
    {
      id: 'virtual-magnifier',
      prompt: 'Make an upright, magnified image (a magnifying glass).',
      controls: [objectControl],
      fixed: { focalLength: FOCAL_LENGTH },
      initial: { objectDistance: 60 },
      success: (_state, image) => !image.isReal && image.orientation === 'upright',
      correctFeedback: 'Inside F the lens magnifies: upright and enlarged.',
      hint: 'Move the candle closer than F.',
    },
    {
      id: 'projector-real-magnified',
      prompt: 'Project a magnified, flipped image (a projector).',
      controls: [objectControl],
      fixed: { focalLength: FOCAL_LENGTH },
      initial: { objectDistance: 60 },
      success: (_state, image) => image.isReal && image.isMagnified,
      correctFeedback: 'Between F and 2F: real, flipped, enlarged.',
      hint: 'Place the candle between F and 2F.',
    },
  ],
}
