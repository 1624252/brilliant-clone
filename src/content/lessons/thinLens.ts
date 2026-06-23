import type { LessonDefinition } from '../types'

// "The Thin Lens Equation" lesson. A fixed converging lens (f = 20); the learner
// drags the object along the axis to satisfy each goal. Success rules read the
// engine's image classification, so they stay correct by construction.

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

export const thinLensLesson: LessonDefinition = {
  id: 'thin-lens-equation',
  title: 'The Thin Lens Equation',
  order: 3,
  estMinutes: 4,
  summary: 'Drag the candle to control where and how big the image forms.',
  intro: {
    heading: 'One equation ties it all together',
    animation: 'source',
    paragraphs: [
      'Light leaves each point of an object, fans out through the lens, and meets again at the **image** — passing through the **focal point F**.',
      'This is a **convex lens** (it bulges outward), so it converges light and its **focal length f** is positive.',
      'The **thin lens equation** links the three distances:  \\frac{1}{f} = \\frac{1}{dₒ} + \\frac{1}{dᵢ}.',
      'With f fixed, moving the candle (dₒ) changes where the image forms (dᵢ) — and the **magnification** m = \\frac{−dᵢ}{dₒ} tells you if it flips and by how much. The live equation updates as you go.',
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
      correctFeedback: 'That is **2F** — **same size**, just flipped.',
      hint: 'Try the 2F mark (twice the focal length).',
    },
    {
      id: 'virtual-magnifier',
      prompt: 'Make an upright, magnified image (a magnifying glass).',
      controls: [objectControl],
      fixed: { focalLength: FOCAL_LENGTH },
      initial: { objectDistance: 60 },
      success: (_state, image) => !image.isReal && image.orientation === 'upright',
      correctFeedback: 'Inside **F** the lens magnifies: **upright** and **enlarged**.',
      hint: 'Move the candle closer than F.',
    },
    {
      id: 'projector-real-magnified',
      prompt: 'Project a magnified, flipped image (a projector).',
      controls: [objectControl],
      fixed: { focalLength: FOCAL_LENGTH },
      initial: { objectDistance: 60 },
      success: (_state, image) => image.isReal && image.isMagnified,
      correctFeedback: 'Between **F and 2F**: **real**, flipped, and **enlarged**.',
      hint: 'Place the candle between F and 2F.',
    },
    {
      id: 'extreme-object-at-infinity',
      prompt: 'Extreme 1: send the candle infinitely far away (tap ∞). Where does the image form?',
      controls: [objectControl],
      fixed: { focalLength: FOCAL_LENGTH },
      initial: { objectDistance: 60 },
      // Only a truly infinite dₒ lands the image exactly on F (di → f).
      success: (state, image) =>
        image.isReal && Math.abs(image.imageDistance - state.focalLength) < 0.5,
      correctFeedback:
        'With dₒ → ∞ the \\frac{1}{dₒ} term vanishes, so \\frac{1}{dᵢ} = \\frac{1}{f}: the image shrinks to a point right at **F**.',
      hint: 'Tap the ∞ button so dₒ becomes infinite.',
    },
    {
      id: 'extreme-object-at-lens',
      prompt: 'Extreme 2: slide the candle all the way onto the lens (dₒ = 0). What happens?',
      controls: [objectControl],
      fixed: { focalLength: FOCAL_LENGTH },
      initial: { objectDistance: 60 },
      success: (state) => state.objectDistance <= 0.5,
      correctFeedback:
        'As dₒ → 0, dᵢ → 0 and m → 1: the image collapses onto the lens at the **same size**.',
      hint: 'Drag the candle onto the lens, or slide dₒ down to 0.',
    },
    {
      kind: 'predict',
      id: 'predict-inside-f',
      prompt:
        'The candle now sits inside the focal length (closer than F). Predict the image before you reveal the rays.',
      scene: { objectDistance: 12, focalLength: FOCAL_LENGTH },
      choices: [
        {
          id: 'real-inverted',
          label: 'Real and inverted, like a projector',
          feedback:
            'Inverted real images need the object beyond F. Inside F the rays diverge after the lens, so they never meet on the far side.',
        },
        {
          id: 'none',
          label: 'No image forms at all',
          feedback:
            'An image still forms — your eye traces the diverging rays backward to a virtual image behind the candle.',
        },
        {
          id: 'virtual-upright',
          label: 'Virtual, upright, and enlarged — a magnifying glass',
          correct: true,
          feedback:
            'Right: inside F the lens works as a magnifier — upright, enlarged, on the candle’s side.',
        },
      ],
      reveal:
        'Inside the focal length the outgoing rays diverge, so they only appear to come from a **virtual, upright, enlarged** image. That is exactly how a **magnifying glass** works.',
    },
  ],
}
