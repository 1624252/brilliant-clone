import type { LessonDefinition } from '../types'

// "The Thin Lens Equation" lesson. Application tasks only: convex magnifier and
// projector patterns, then parallel concave-lens tasks.

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

const concaveObjectControl = {
  ...objectControl,
  snaps: [0, FOCAL_LENGTH, 2 * FOCAL_LENGTH, 3 * FOCAL_LENGTH],
}

export const thinLensLesson: LessonDefinition = {
  id: 'thin-lens-equation',
  title: 'The Thin Lens Equation',
  order: 5,
  estMinutes: 4,
  summary: 'Use f, d_o, and d_i to make magnifiers and projectors.',
  intro: {
    heading: 'One equation ties it all together',
    animation: 'source',
    paragraphs: [
      'Light leaves each point of an object, fans out through the lens, and forms an **image**. The diagram tracks **f**, **d_o**, and **d_i**.',
      'A **convex lens** has positive **f** and can make real projected images. A **concave lens** has negative **f** and keeps real-object images virtual.',
      'The **thin lens equation** links the three distances:  \\frac{1}{f} = \\frac{1}{dₒ} + \\frac{1}{dᵢ}.',
      'With f fixed, moving the candle (dₒ) changes where the image forms (dᵢ) — and the **magnification** m = \\frac{−dᵢ}{dₒ} tells you if it flips and by how much. The live equation updates as you go.',
    ],
  },
  steps: [
    {
      id: 'virtual-magnifier',
      prompt: 'Make an upright, magnified image (a magnifying glass).',
      controls: [objectControl],
      fixed: { focalLength: FOCAL_LENGTH },
      initial: { objectDistance: 60 },
      success: (_state, image) =>
        !image.isReal && image.orientation === 'upright' && image.isMagnified,
      correctFeedback:
        'Inside the **focus**, the convex lens magnifies: **virtual**, **upright**, and **enlarged**.',
      hint: (_state, image) =>
        image.isReal
          ? 'Your image is still **real and flipped**, so the rays are meeting on the opposite side of the lens from the object. Move inside **F**.'
          : 'You found a **virtual** image. Move closer to the **focus** from the inside to enlarge it.',
    },
    {
      id: 'projector-real-magnified',
      prompt: 'Project a magnified, flipped image (a projector).',
      controls: [objectControl],
      fixed: { focalLength: FOCAL_LENGTH },
      initial: { objectDistance: 60 },
      success: (_state, image) => image.isReal && image.isMagnified,
      correctFeedback:
        'Between **F** and **2F**: **real**, flipped, and **enlarged**.',
      hint: (_state, image) => {
        if (!image.isReal) {
          return 'Your image is **virtual and upright**, so the candle is too close for projection. Move outside **F**.'
        }
        return Math.abs(image.magnification) < 1
          ? 'Your projected image is **too small**. Move the candle closer to the **focus** while keeping it outside.'
          : 'Your image is real, but it has not reached the enlarged projector setup yet. Watch for the crossing point to move farther away as the object gets closer to F.'
      },
    },
    {
      id: 'concave-minify-close',
      prompt:
        'Use a concave lens to make an upright reduced image close to the object size, or place the object at d_o = 0.',
      controls: [concaveObjectControl],
      fixed: { focalLength: -FOCAL_LENGTH },
      initial: { objectDistance: 60 },
      success: (_state, image) =>
        image.imageDistance === 0 ||
        (!image.isReal &&
          image.orientation === 'upright' &&
          Math.abs(image.magnification) > 0.55 &&
          Math.abs(image.magnification) < 1),
      correctFeedback:
        'Close to the concave lens, the image is still **virtual** and **upright**, but less reduced. At d_o = 0, the object and image collapse onto the lens.',
      hint: (_state, image) =>
        image.magnification <= 0.55
          ? 'The image is too small. Move the candle closer to the concave lens, all the way to d_o = 0 if needed.'
          : 'Keep the candle very close to the lens, including the boundary case d_o = 0.',
    },
    {
      id: 'concave-minify-far',
      prompt: 'Use a concave lens to make a tiny upright image near the virtual focus.',
      controls: [concaveObjectControl],
      fixed: { focalLength: -FOCAL_LENGTH },
      initial: { objectDistance: 12 },
      success: (state, image) =>
        state.objectDistance >= 55 &&
        !image.isReal &&
        image.orientation === 'upright' &&
        Math.abs(image.magnification) < 0.3,
      correctFeedback:
        'Farther from a concave lens, the image becomes **tiny**, **virtual**, and close to the **virtual focus**.',
      hint: (_state, image) =>
        image.magnification > 0.3
          ? 'The image is not tiny yet. Move the object farther away, toward infinity.'
          : 'You have a tiny virtual image; make sure the object is far enough from the lens.',
    },
  ],
}
