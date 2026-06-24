import type { LessonDefinition } from '../types'

// "Convex Lenses": the first lesson. It introduces the focal point with an
// animated explainer (a slab morphing into a convex lens, rays bending to meet
// at F), then quick hands-on steps connecting dragging the candle to what F means.

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

export const focusLesson: LessonDefinition = {
  // Id kept as 'focusing-light' so saved progress and existing links stay valid.
  id: 'focusing-light',
  title: 'Convex Lenses',
  order: 1,
  estMinutes: 3,
  summary: 'See how a convex lens bends parallel rays to a focus — the focal point F.',
  intro: {
    heading: 'Where light comes to a focus',
    animation: 'convex',
    paragraphs: [
      'A **convex lens** (one that bulges outward) converges **parallel rays** so they all cross at one spot on the axis: the **focal point, F**.',
      'The distance from the lens to F is the **focal length, f** — a fixed property of the lens. The stronger the lens, the shorter the f.',
      'When you start, you can drag the candle and watch how its rays meet. F is the key to where (and how big) the **image** forms.',
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
        'At **F** the outgoing rays are **parallel**, so the image races off to infinity.',
      hint: (state, image) => {
        if (state.objectDistance > state.focalLength) {
          return 'The rays still cross after the lens, so the candle is **outside F**. Move it closer until the crossing point runs off toward infinity.'
        }
        if (!image.isReal) {
          return 'The rays are already spreading apart after the lens, so the candle is **inside F**. Move it slightly farther out until the outgoing rays become parallel.'
        }
        return 'Watch the outgoing rays: the goal is the exact spot where they stop converging or diverging and leave **parallel**.'
      },
    },
    {
      id: 'far-object-focuses-at-f',
      prompt: 'Now pull the candle far away. Where does the image settle?',
      controls: [objectControl],
      fixed: { focalLength: FOCAL_LENGTH },
      initial: { objectDistance: 30 },
      success: (state, image) => image.isReal && state.objectDistance >= 60,
      choices: [
        {
          id: 'at-f',
          label: 'It settles near F',
          correct: true,
          feedback:
            'Yes. As the candle moves far away, its rays arrive almost parallel, so the image approaches the focal point.',
        },
        {
          id: 'at-2f',
          label: 'It settles near 2F',
          feedback:
            '2F is the same-size case when the object is also at 2F. Faraway objects send nearly parallel rays, which focus closer, at F.',
        },
        {
          id: 'keeps-moving-away',
          label: 'It keeps moving farther from the lens',
          feedback:
            'The image moves toward the lens, not away from it. Parallel incoming rays meet at the focal point.',
        },
      ],
      correctFeedback: 'A faraway object focuses close to **F** — that is why F is "the focus."',
      hint: (_state, image) =>
        image.imageDistance > FOCAL_LENGTH + 3
          ? 'The image is still noticeably **past F**. As the candle moves farther away, incoming rays become more parallel and the image slides closer to F.'
          : 'You are close: keep making the incoming rays more nearly **parallel** so the image settles right near F.',
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
          visual: {
            scene: { objectDistance: Infinity, focalLength: FOCAL_LENGTH },
            showRays: false,
            showImage: false,
            caption: 'No crossing',
          },
          feedback:
            'A converging lens bends parallel rays inward, so they must cross somewhere.',
        },
        {
          id: 'focal',
          label: 'They cross right at the focal point, F',
          visual: {
            scene: { objectDistance: Infinity, focalLength: FOCAL_LENGTH },
            caption: 'Image at F',
          },
          correct: true,
          feedback: 'Yes — F is defined as where parallel rays converge.',
        },
        {
          id: 'twice',
          label: 'They cross farther out, at 2F',
          visual: {
            scene: { objectDistance: 2 * FOCAL_LENGTH, focalLength: FOCAL_LENGTH },
            caption: 'Image at 2F',
          },
          feedback:
            'Rays from an object at 2F meet at 2F. Truly parallel rays come from infinitely far away, so they focus closer — right at F.',
        },
      ],
      reveal:
        'Parallel rays converge exactly at **F** — that is what **"focal point"** means. The farther the object, the closer its image creeps toward F.',
      // After committing, let the learner drag the object in and watch the image.
      explore: objectControl,
    },
  ],
}
