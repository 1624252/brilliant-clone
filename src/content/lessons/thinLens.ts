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
  step: 0.01,
  label: 'Object distance',
  allowInfinity: true,
  // Snap to the lens (0), F, 2F, and 3F so key positions are easy to hit.
  snaps: [0, FOCAL_LENGTH, 2 * FOCAL_LENGTH, 3 * FOCAL_LENGTH],
}

export const thinLensLesson: LessonDefinition = {
  id: 'thin-lens-equation',
  title: 'The Thin Lens Equation',
  order: 5,
  estMinutes: 5,
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
      hint: (_state, image) => {
        if (!image.isReal) {
          return 'Your image is **upright and virtual**, which means the candle is inside F. For a same-size flipped image, look for a **real inverted** image first.'
        }
        const size = Math.abs(image.magnification)
        if (size > 1) {
          return 'Your image is **too big**. For real images with a convex lens, moving the candle farther from the lens makes the image smaller.'
        }
        return 'Your image is **too small**. For real images with a convex lens, moving the candle closer to the lens makes the image bigger.'
      },
    },
    {
      kind: 'plot-rays',
      id: 'draw-same-size-2f',
      prompt:
        'Now draw the three rays for the 2F case. The equation predicts dᵢ = dₒ, and the drawing should show why.',
      scene: { objectDistance: 40, focalLength: FOCAL_LENGTH },
      hint:
        'Place each ray from the object tip: parallel bends through F, chief goes through the center, and focal exits parallel. They should meet at the matching 2F mark.',
      reveal:
        'At **2F**, the ray drawing and the equation agree: the image lands at **2F**, inverted and the same size.',
    },
    {
      id: 'virtual-magnifier',
      prompt: 'Make an upright, magnified image (a magnifying glass).',
      controls: [objectControl],
      fixed: { focalLength: FOCAL_LENGTH },
      initial: { objectDistance: 60 },
      success: (_state, image) => !image.isReal && image.orientation === 'upright',
      correctFeedback: 'Inside **F** the lens magnifies: **upright** and **enlarged**.',
      hint: (_state, image) =>
        image.isReal
          ? 'Your image is still **real and flipped**, so the rays are meeting on the far side of the lens. A magnifying glass happens when the rays leave diverging and only trace back to a virtual image.'
          : 'You found a **virtual** image, but it is not strongly magnified yet. Keep watching the image size as the candle approaches F from the inside.',
    },
    {
      id: 'projector-real-magnified',
      prompt: 'Project a magnified, flipped image (a projector).',
      controls: [objectControl],
      fixed: { focalLength: FOCAL_LENGTH },
      initial: { objectDistance: 60 },
      success: (_state, image) => image.isReal && image.isMagnified,
      correctFeedback: 'Between **F and 2F**: **real**, flipped, and **enlarged**.',
      hint: (_state, image) => {
        if (!image.isReal) {
          return 'Your image is **virtual and upright**, so the candle is too close for projection. A projector needs rays that really meet on the far side.'
        }
        return Math.abs(image.magnification) < 1
          ? 'Your projected image is **too small**. To enlarge a real image, move the candle closer to F while keeping it outside F.'
          : 'Your image is real, but it has not reached the enlarged projector setup yet. Watch for the crossing point to move farther away as the object gets closer to F.'
      },
    },
    {
      kind: 'predict',
      id: 'extreme-object-at-infinity',
      prompt:
        'Extreme 1: as dₒ grows huge, the \\frac{1}{dₒ} term nearly vanishes. Which diagram matches that limit?',
      scene: { objectDistance: Infinity, focalLength: FOCAL_LENGTH },
      choices: [
        {
          id: 'at-f',
          label: 'The image collapses onto F',
          visual: {
            scene: { objectDistance: Infinity, focalLength: FOCAL_LENGTH },
            caption: 'dᵢ = f',
          },
          correct: true,
          feedback:
            'Yes. When dₒ is infinite, \\frac{1}{dₒ} becomes zero, so the image distance equals the focal length.',
        },
        {
          id: 'at-2f',
          label: 'The image stays at 2F',
          visual: {
            scene: { objectDistance: 2 * FOCAL_LENGTH, focalLength: FOCAL_LENGTH },
            caption: 'dᵢ = 2f',
          },
          feedback:
            '2F is the same-size case for an object at 2F. A faraway object sends in nearly parallel rays, which focus closer, at F.',
        },
        {
          id: 'no-image',
          label: 'No image appears',
          visual: {
            scene: { objectDistance: Infinity, focalLength: FOCAL_LENGTH },
            showRays: false,
            showImage: false,
            caption: 'No image',
          },
          feedback:
            'An image still forms. Parallel incoming rays from a faraway object converge at the focal point of a convex lens.',
        },
      ],
      reveal:
        'With dₒ → ∞ the \\frac{1}{dₒ} term vanishes, so \\frac{1}{dᵢ} = \\frac{1}{f}: the image shrinks to a point right at **F**.',
      explore: objectControl,
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
      hint: (state) =>
        state.objectDistance > FOCAL_LENGTH
          ? 'The candle is still outside F, so the lens is making a normal real image. This extreme is about what happens as the object distance collapses toward zero.'
          : 'You are closer, but dₒ is not tiny yet. Watch the distance chip: this extreme happens when the candle nearly touches the lens.',
    },
    {
      kind: 'plot-rays',
      id: 'predict-inside-f',
      prompt:
        'The candle now sits inside the focal length (closer than F). Draw the rays and their back-traces to locate the virtual image.',
      scene: { objectDistance: 12, focalLength: FOCAL_LENGTH, objectHeight: 12 },
      hint:
        'The outgoing rays diverge, so use the dashed extensions: trace the rays backward to the candle side until all three rules agree.',
      reveal:
        'Inside the focal length the outgoing rays diverge, so they only appear to come from a **virtual, upright, enlarged** image. That is exactly how a **magnifying glass** works.',
    },
  ],
}
