import type { LessonDefinition } from '../types'

// "Ray Tracing": locating an image with the three principal rays. A fixed
// converging lens (f = 20); the learner predicts where the rays cross, drags the
// object to push the crossing past 2F, and identifies the undeviated chief ray.

const FOCAL_LENGTH = 20
const objectControl = {
  key: 'objectDistance',
  type: 'drag-axis' as const,
  min: 0,
  max: 80,
  step: 0.01,
  label: 'Object distance',
  allowInfinity: true,
  snaps: [0, FOCAL_LENGTH, 2 * FOCAL_LENGTH, 3 * FOCAL_LENGTH],
}

export const rayTracingLesson: LessonDefinition = {
  id: 'ray-tracing',
  title: 'Ray Tracing',
  order: 4,
  estMinutes: 4,
  summary: 'Trace the three principal rays to locate any image.',
  intro: {
    heading: 'Three rays find any image',
    animation: 'focus',
    paragraphs: [
      'You only need **three special rays** from the top of the object to find its image — wherever they cross is where the image forms.',
      'The **parallel ray** travels in flat, then bends through the **focal point F**. The **chief ray** goes **straight through the lens center**, undeviated. The **focal ray** passes through F first, then leaves **parallel**.',
      'Drag the candle and watch the three rays always meet at the same spot — that is the image.',
    ],
  },
  steps: [
    {
      kind: 'plot-rays',
      id: 'plot-beyond-2f',
      prompt:
        'The candle sits beyond 2F. Draw each principal ray so they cross at the image.',
      scene: { objectDistance: 60, focalLength: FOCAL_LENGTH },
      hint: 'Use the focal points: the **parallel** ray bends through **F**, the **chief** ray stays straight through the center, and the **focal** ray leaves **parallel** to the axis.',
      reveal:
        'The three rays cross between **F and 2F**, making a **real, inverted, reduced** image — exactly where an object beyond 2F focuses.',
    },
    {
      id: 'cross-beyond-2f',
      prompt: 'Drag the candle so the rays cross beyond 2F (a real image farther than 2F).',
      controls: [objectControl],
      fixed: { focalLength: FOCAL_LENGTH },
      initial: { objectDistance: 60 },
      success: (_state, image) =>
        image.isReal && image.imageDistance > 2 * FOCAL_LENGTH,
      correctFeedback:
        'When the candle is **between F and 2F**, the rays cross **beyond 2F** — a real, enlarged image (a projector).',
      hint: (_state, image) => {
        if (!image.isReal) {
          return 'The rays are diverging after the lens, so the candle is too close for a real crossing. A real image needs the object outside F.'
        }
        return image.imageDistance <= 2 * FOCAL_LENGTH
          ? 'The crossing is not far enough out yet. To push a real image beyond 2F, make the object closer to F while keeping it outside F.'
          : 'The crossing is beyond 2F, but check the ray diagram carefully and submit again.'
      },
    },
    {
      id: 'inside-f-diverge',
      prompt: 'Now drag the candle inside F and watch the rays diverge into a magnified image.',
      controls: [objectControl],
      fixed: { focalLength: FOCAL_LENGTH },
      initial: { objectDistance: 60 },
      success: (_state, image) =>
        !image.isReal && image.orientation === 'upright' && image.isMagnified,
      correctFeedback:
        'Inside F the three rays **spread apart** — trace them back and they meet at a **virtual, upright, enlarged** image (a magnifier).',
      hint: (_state, image) =>
        image.isReal
          ? 'The rays are still crossing on the far side, so the candle is outside F. Move toward the point where the outgoing rays stop meeting and start diverging.'
          : 'You are in virtual-image territory. Watch for the traced-back image to stay **upright** and grow larger than the candle.',
    },
  ],
}
