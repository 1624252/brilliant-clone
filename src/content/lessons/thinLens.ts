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
  steps: [
    {
      id: 'same-size-at-2f',
      prompt:
        'Drag the green object until the image is exactly the same size as the object (just flipped over).',
      controls: [objectControl],
      fixed: { focalLength: FOCAL_LENGTH },
      initial: { objectDistance: 60 },
      success: (_state, image) =>
        image.isReal && Math.abs(image.magnification + 1) < 0.06,
      correctFeedback:
        'That is the 2F point. At do = 2f the image is the same size, inverted, and also sits at 2f on the far side.',
      hint: 'Same-size happens at one special spot: try twice the focal length (the 2F mark).',
    },
    {
      id: 'virtual-magnifier',
      prompt:
        'Now move the object closer than the focal point to make a virtual, upright, magnified image — like a magnifying glass.',
      controls: [objectControl],
      fixed: { focalLength: FOCAL_LENGTH },
      initial: { objectDistance: 60 },
      success: (_state, image) => !image.isReal && image.orientation === 'upright',
      correctFeedback:
        'Inside the focal length the lens works as a magnifier: the image is virtual, upright, and enlarged.',
      hint: 'Bring the object nearer than F — less than one focal length from the lens.',
    },
    {
      id: 'projector-real-magnified',
      prompt:
        'Position the object to project a magnified, inverted image on a screen (a real image larger than the object).',
      controls: [objectControl],
      fixed: { focalLength: FOCAL_LENGTH },
      initial: { objectDistance: 60 },
      success: (_state, image) => image.isReal && image.isMagnified,
      correctFeedback:
        'Between F and 2F the lens forms a real, inverted, magnified image — exactly how a projector works.',
      hint: 'Place the object between F and 2F (between one and two focal lengths).',
    },
  ],
}
