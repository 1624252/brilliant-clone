import type { LessonDefinition } from '../types'

// "Concave Lenses": a diverging lens (f < 0). It always spreads light outward,
// so a real object always yields a virtual, upright, reduced image on the same
// side. The learner predicts that outcome, tests it by dragging the candle, and
// pins down where the virtual image lives (between the lens and the focal point).

const FOCAL_LENGTH = -20 // negative -> diverging
const objectControl = {
  key: 'objectDistance',
  type: 'drag-axis' as const,
  min: 0,
  max: 80,
  step: 0.5,
  label: 'Object distance',
  // A diverging lens can't focus a beam from infinity to a real point, and the
  // engine's "object at infinity" rays assume convergence, so keep it finite.
  allowInfinity: false,
  snaps: [0, 20, 40, 60],
}

export const concaveLesson: LessonDefinition = {
  id: 'concave-lenses',
  title: 'Concave Lenses',
  order: 2,
  estMinutes: 4,
  summary: 'See how a concave lens spreads light out into a virtual focus.',
  intro: {
    heading: 'A lens that spreads light out',
    animation: 'concave',
    paragraphs: [
      'A **concave lens** (one that caves inward) does the opposite of a convex lens: it makes parallel rays **diverge**, as if they fanned out from a point.',
      'That point is the **virtual focus, F**, and the lens has a **negative focal length, f**.',
      'Because the rays only ever spread apart, a concave lens makes an image you **can’t project** — a __virtual__ image. Drag the candle and watch it stay upright and small.',
    ],
  },
  steps: [
    {
      kind: 'predict',
      id: 'predict-diverging-image',
      prompt:
        'A concave lens sits in front of the candle. Predict the image, then reveal the rays.',
      scene: { objectDistance: 40, focalLength: FOCAL_LENGTH },
      choices: [
        {
          id: 'real-inverted',
          label: 'Real and inverted, like a projector',
          visual: {
            scene: { objectDistance: 30, focalLength: 20 },
            caption: 'Projector-like result',
          },
          feedback:
            'A diverging lens never brings light to a point on the far side, so it can’t make a real, inverted image.',
        },
        {
          id: 'none',
          label: 'No image forms',
          visual: {
            scene: { objectDistance: 40, focalLength: FOCAL_LENGTH },
            showRays: false,
            showImage: false,
            caption: 'No formed image',
          },
          feedback:
            'An image still forms — trace the diverging rays backward and they meet at a virtual image.',
        },
        {
          id: 'virtual-smaller',
          label: 'Virtual, upright, and smaller',
          visual: {
            scene: { objectDistance: 40, focalLength: FOCAL_LENGTH },
            caption: 'Virtual reduced image',
          },
          correct: true,
          feedback:
            'Right: a concave lens always makes a virtual, upright, reduced image on the candle’s side.',
        },
      ],
      reveal:
        'A concave lens **always** makes a __virtual__, __upright__, __reduced__ image — no matter where the object is.',
      // Stay hands-on: after committing, drag the candle and watch the virtual image.
      explore: objectControl,
    },
    {
      kind: 'plot-rays',
      id: 'draw-concave-rays',
      prompt:
        'Draw the three principal rays for this concave lens. Use the dashed back-traces to find the virtual image.',
      scene: { objectDistance: 40, focalLength: FOCAL_LENGTH },
      hint:
        'For a concave lens, the **parallel** ray leaves as if it came from the near-side F, the **chief** ray stays straight, and the **focal** ray exits parallel.',
      reveal:
        'All three rays spread out after the concave lens. Their backward extensions meet on the candle side, so the image is **virtual, upright, and reduced**.',
    },
    {
      id: 'try-to-make-real',
      prompt: 'Drag the candle right up to the lens. Can a concave lens ever make a real image?',
      controls: [objectControl],
      fixed: { focalLength: FOCAL_LENGTH },
      initial: { objectDistance: 55 },
      success: (state) => state.objectDistance <= 8,
      correctFeedback:
        'No — even up close the image stays **virtual, upright, and smaller**. A diverging lens can’t focus light to a real point.',
      hint: (state, image) =>
        state.objectDistance > 25
          ? `The image is still **virtual and reduced** (m = ${image.magnification.toFixed(1)}). Bring the candle closer and check whether a concave lens ever makes the rays truly meet.`
          : 'Even close up, the outgoing rays still **spread apart**. Keep testing the near-lens limit to see whether that ever changes.',
    },
    {
      id: 'half-size-image',
      prompt: 'Drag the candle until its virtual image is exactly half size.',
      controls: [objectControl],
      fixed: { focalLength: FOCAL_LENGTH },
      initial: { objectDistance: 55 },
      // For f = -20, the image is half-height (m = 0.5) when the object is one
      // focal length away (dₒ = 20).
      success: (_state, image) => Math.abs(image.magnification - 0.5) < 0.05,
      correctFeedback:
        'At one focal length away, a concave lens shrinks the image to **half size** — still upright and virtual.',
      hint: (_state, image) => {
        if (image.magnification > 0.55) {
          return 'Your virtual image is **too large**. For a concave lens, moving the candle farther away makes the image shrink.'
        }
        return 'Your virtual image is **too small**. Move the candle closer and watch m climb toward one-half.'
      },
    },
  ],
}
