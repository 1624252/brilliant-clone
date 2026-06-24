import type { LessonDefinition } from '../types'

// "Convex Lenses": the first lesson. It explores the key object positions for a
// converging lens: on the lens, at the focus, at 2 focus, and at infinity.

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
  estMinutes: 4,
  summary: 'Explore the key convex-lens positions: 0, focus, 2 focus, and infinity.',
  intro: {
    heading: 'Where light comes to a focus',
    animation: 'convex',
    paragraphs: [
      'A **convex lens** (one that bulges outward) converges **parallel rays** so they cross at the **focus**.',
      'The distance from the lens to the focus is the **focal length, f**. The same distance on the object side is also marked as a focus point.',
      'Drag the candle to the landmark positions: on the lens, at the **focus**, at **2 focus**, and at **infinity**.',
    ],
  },
  steps: [
    {
      id: 'object-at-lens',
      prompt: 'Start at 0: slide the candle all the way onto the lens.',
      controls: [objectControl],
      fixed: { focalLength: FOCAL_LENGTH },
      initial: { objectDistance: 50 },
      success: (state) => state.objectDistance <= 0.5,
      correctFeedback:
        'At **0**, the object and image collapse onto the lens. This is a boundary case, not a useful projection setup.',
      hint: (state) =>
        state.objectDistance > FOCAL_LENGTH
          ? 'You are still outside the focus. Keep sliding the candle toward the lens.'
          : 'Keep going until the object distance readout is nearly **0**.',
    },
    {
      id: 'object-at-focus',
      prompt: 'Now slide the candle onto the focus. What happens to the outgoing rays?',
      controls: [objectControl],
      fixed: { focalLength: FOCAL_LENGTH },
      initial: { objectDistance: 50 },
      success: (state, image) =>
        Math.abs(state.objectDistance - state.focalLength) < 0.75 && image.atInfinity,
      choices: [
        {
          id: 'parallel',
          label: 'They leave **parallel** and the image goes to **infinity**',
          correct: true,
          feedback:
            'Yes. At the **focus**, the convex lens sends the outgoing rays out parallel.',
        },
        {
          id: 'real-2focus',
          label: 'They meet at **2 focus**',
          feedback:
            '**2 focus** is the same-size case, but that happens when the object also starts at 2 focus.',
        },
        {
          id: 'virtual',
          label: 'They form an **upright virtual** image',
          feedback:
            'That happens inside the **focus**. Exactly at the focus, the rays leave parallel.',
        },
      ],
      correctFeedback:
        'At the **focus**, the outgoing rays are **parallel**, so the image is at **infinity**.',
      hint: (state, image) => {
        if (state.objectDistance > state.focalLength) {
          return 'The outgoing rays still meet after the lens, so the candle is **outside the focus**. Move it closer.'
        }
        if (!image.isReal) {
          return 'The outgoing rays are spreading apart, so the candle is **inside the focus**. Move it slightly farther out.'
        }
        return 'Look for the exact spot where the outgoing rays stop converging or diverging and become **parallel**.'
      },
    },
    {
      id: 'object-at-2focus',
      prompt: 'Move the candle to 2 focus. What kind of image do you get?',
      controls: [objectControl],
      fixed: { focalLength: FOCAL_LENGTH },
      initial: { objectDistance: 30 },
      success: (state, image) =>
        image.isReal &&
        Math.abs(state.objectDistance - 2 * FOCAL_LENGTH) < 0.75 &&
        Math.abs(image.imageDistance - 2 * FOCAL_LENGTH) < 1,
      choices: [
        {
          id: 'same-size',
          label: '**Real**, inverted, and the **same size** at 2 focus',
          correct: true,
          feedback:
            'Yes. When the object is at **2 focus**, the image is also at **2 focus** and has the same size.',
        },
        {
          id: 'magnified',
          label: '**Real** and enlarged beyond 2 focus',
          feedback:
            'That is the projector pattern, which happens when the object is between **focus** and **2 focus**.',
        },
        {
          id: 'virtual',
          label: '**Virtual** and upright',
          feedback:
            'A convex lens makes a virtual upright image when the object is inside the **focus**, not at 2 focus.',
        },
      ],
      correctFeedback:
        'At **2 focus**, a convex lens makes a **real**, inverted, **same-size** image at 2 focus on the other side.',
      hint: (_state, image) =>
        image.isReal
          ? 'Watch for the image distance and object distance to match at **2 focus**.'
          : 'You are inside the **focus**. Move the candle farther away until the image becomes real.',
    },
    {
      id: 'far-object-focuses-at-focus',
      prompt: 'Finally, pull the candle to infinity. Where does the image form?',
      controls: [objectControl],
      fixed: { focalLength: FOCAL_LENGTH },
      initial: { objectDistance: 40 },
      success: (state, image) =>
        state.objectDistance === Infinity &&
        image.isReal &&
        Math.abs(image.imageDistance - FOCAL_LENGTH) < 0.75,
      choices: [
        {
          id: 'at-focus',
          label: 'Near the **focus**',
          correct: true,
          feedback:
            'Yes. Light from infinity reaches the lens nearly parallel, so a convex lens forms the image at the **focus**.',
        },
        {
          id: 'at-2focus',
          label: 'Near **2 focus**',
          feedback:
            '**2 focus** is the same-size case. Infinity sends in parallel rays, which meet at the **focus**.',
        },
        {
          id: 'no-image',
          label: 'No image forms',
          feedback:
            'An image still forms. Parallel rays from far away converge at the **focus**.',
        },
      ],
      correctFeedback:
        'At **infinity**, incoming rays are essentially parallel, so the image lands at the **focus**.',
      hint: (state, image) =>
        state.objectDistance !== Infinity
          ? 'Use the infinity end of the slider or drag the candle to the far edge.'
          : `You are at infinity. Pick the answer that matches d_i = ${image.imageDistance.toFixed(1)} cm.`,
    },
  ],
}
