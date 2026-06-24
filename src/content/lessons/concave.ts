import type { LessonDefinition } from '../types'

// "Concave Lenses": a diverging lens (f < 0). This mirrors the convex landmark
// positions but shows the always-virtual, upright, reduced image pattern.

const FOCAL_LENGTH = -20 // negative -> diverging
const objectControl = {
  key: 'objectDistance',
  type: 'drag-axis' as const,
  min: 0,
  max: 80,
  step: 0.01,
  label: 'Object distance',
  allowInfinity: true,
  snaps: [0, 20, 40, 60],
}

export const concaveLesson: LessonDefinition = {
  id: 'concave-lenses',
  title: 'Concave Lenses',
  order: 2,
  estMinutes: 4,
  summary: 'Explore the key concave-lens positions and its virtual focus pattern.',
  intro: {
    heading: 'A lens that spreads light out',
    animation: 'concave',
    paragraphs: [
      'A **concave lens** (one that caves inward) does the opposite of a convex lens: it makes parallel rays **diverge**, as if they fanned out from a point.',
      'That point is the **virtual focus**, and the lens has a **negative focal length, f**.',
      'Because the rays only ever spread apart, a concave lens makes an image you **can’t project**: a __virtual__, **upright**, **reduced** image.',
    ],
  },
  steps: [
    {
      id: 'concave-object-at-lens',
      prompt: 'Start at 0: slide the candle all the way onto the concave lens.',
      controls: [objectControl],
      fixed: { focalLength: FOCAL_LENGTH },
      initial: { objectDistance: 50 },
      success: (state) => state.objectDistance <= 0.5,
      correctFeedback:
        'At **0**, the object and virtual image collapse at the lens. Move away from 0 and the image becomes **virtual**, **upright**, and **reduced**.',
      hint: (state) =>
        state.objectDistance > Math.abs(state.focalLength)
          ? 'You are still beyond the virtual focus distance. Keep sliding the candle toward the lens.'
          : 'Keep going until the object distance readout is nearly **0**.',
    },
    {
      id: 'concave-object-at-focus',
      prompt:
        'Slide the candle to the virtual focus distance. What kind of image does a concave lens make there?',
      controls: [objectControl],
      fixed: { focalLength: FOCAL_LENGTH },
      initial: { objectDistance: 50 },
      success: (state, image) =>
        !image.isReal &&
        Math.abs(state.objectDistance - Math.abs(state.focalLength)) < 0.75 &&
        image.orientation === 'upright',
      choices: [
        {
          id: 'half-size',
          label: '**Virtual**, **upright**, and **reduced**',
          correct: true,
          feedback:
            'Yes. At the virtual **focus** distance, the concave image is still virtual and upright, about half size.',
        },
        {
          id: 'real',
          label: '**Real** and inverted',
          feedback:
            'That is the convex-lens pattern. A concave lens keeps spreading rays apart, so the image stays **virtual**.',
        },
        {
          id: 'magnified',
          label: '**Virtual** and enlarged',
          feedback:
            'Concave lenses reduce real objects. The image stays **upright** and **reduced**.',
        },
      ],
      correctFeedback:
        'At the virtual **focus** distance, the image is **virtual**, **upright**, and **reduced**.',
      hint: (state, image) => {
        if (state.objectDistance > Math.abs(state.focalLength)) {
          return 'Move closer to the virtual **focus** distance and watch the reduced image grow slightly.'
        }
        if (image.magnification > 0.55) {
          return 'Move farther from the lens until the image is about half size.'
        }
        return 'Use the focus mark on the candle side as your target distance from the lens.'
      },
    },
    {
      id: 'concave-object-at-2focus',
      prompt: 'Move the candle to 2 focus for the concave lens. What happens?',
      controls: [objectControl],
      fixed: { focalLength: FOCAL_LENGTH },
      initial: { objectDistance: 30 },
      success: (state, image) =>
        !image.isReal &&
        Math.abs(state.objectDistance - 2 * Math.abs(FOCAL_LENGTH)) < 0.75 &&
        image.orientation === 'upright',
      choices: [
        {
          id: 'between-lens-focus',
          label: 'It stays between the lens and the **focus**',
          correct: true,
          feedback:
            'Yes. Even at **2 focus**, the concave image stays on the candle side between the lens and the **focus**.',
        },
        {
          id: 'at-2focus',
          label: 'It lands at **2 focus** on the far side',
          feedback:
            'That is the convex same-size pattern. Concave lenses do not make a real far-side image for a real object.',
        },
        {
          id: 'infinity',
          label: 'It moves to **infinity**',
          feedback:
            'A concave lens never sends real-object rays out parallel in this way. The image remains **virtual**.',
        },
      ],
      correctFeedback:
        'At **2 focus**, a concave lens still makes a **virtual**, **upright**, **reduced** image between the lens and the **focus**.',
      hint: (_state, image) =>
        image.magnification > 0.4
          ? 'The candle is too close. Move it out toward **2 focus**.'
          : 'Watch for the object distance to read 40 cm while the image remains virtual.',
    },
    {
      id: 'concave-object-at-infinity',
      prompt: 'Now pull the candle to infinity. Where does a concave lens place the image?',
      controls: [objectControl],
      fixed: { focalLength: FOCAL_LENGTH },
      initial: { objectDistance: 40 },
      success: (state, image) =>
        state.objectDistance === Infinity &&
        !image.isReal &&
        Math.abs(Math.abs(image.imageDistance) - Math.abs(FOCAL_LENGTH)) < 0.75,
      choices: [
        {
          id: 'virtual-focus',
          label: 'Near the **virtual focus** on the candle side',
          correct: true,
          feedback:
            'Yes. Incoming parallel rays spread out as if they came from the near-side **virtual focus**.',
        },
        {
          id: 'real-focus',
          label: 'At a **real focus** on the far side',
          feedback:
            'That is the convex-lens behavior. A concave lens spreads the rays apart.',
        },
        {
          id: 'none',
          label: 'No image forms',
          feedback:
            'An image forms by back-tracing the diverging rays. It is **virtual** and near the **focus**.',
        },
      ],
      correctFeedback:
        'At **infinity**, a concave lens forms a tiny **virtual** image near the **virtual focus**.',
      hint: (state) =>
        state.objectDistance !== Infinity
          ? 'Use the infinity end of the slider or drag the candle to the far edge.'
          : 'Look at the candle side of the lens: the back-traced rays point to the virtual focus.',
    },
  ],
}
