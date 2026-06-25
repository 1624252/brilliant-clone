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

const nearLensObjectControl = {
  ...objectControl,
}

export const concaveLesson: LessonDefinition = {
  id: 'concave-lenses',
  title: 'Concave Lenses',
  order: 2,
  estMinutes: 4,
  summary: 'Try to make real, virtual, upright, and inverted images with a concave lens.',
  intro: {
    heading: 'A lens that spreads light out',
    animation: 'concave',
    paragraphs: [
      'A **concave lens** (one that caves inward) does the opposite of a convex lens: it makes parallel rays **diverge**, as if they fanned out from a point.',
      'That point is the **virtual focus**, and the lens has a **negative focal length, f**.',
      'Try the same image targets as with a convex lens. You’ll find a concave lens always keeps real-candle images **virtual**, **upright**, and **reduced**.',
    ],
  },
  steps: [
    {
      id: 'concave-make-virtual-image',
      prompt: 'Move the candle until the concave lens makes a **virtual** image.',
      controls: [objectControl],
      fixed: { focalLength: FOCAL_LENGTH },
      initial: { objectDistance: 30 },
      success: (_state, image) => !image.isReal,
      correctFeedback:
        'Yes. A concave lens makes a **virtual** image for every real candle position.',
      hint: () =>
        'A **virtual** image appears where **dotted back-traces** meet on the **same side of the lens as the object**. Watch those dotted lines point back to the image.',
    },
    {
      id: 'concave-make-upright-image',
      prompt: 'Move the candle until the concave lens makes an **upright** image.',
      controls: [objectControl],
      fixed: { focalLength: FOCAL_LENGTH },
      initial: { objectDistance: 50 },
      success: (_state, image) => image.orientation === 'upright',
      correctFeedback:
        'Correct. A concave lens keeps the image **upright** for every real candle position.',
      hint: () =>
        'An **upright** image points the __same way as the object__. Look for the image candle standing above the axis instead of hanging below it.',
    },
    {
      id: 'concave-try-real-image',
      prompt: 'Try to make a **real** image with the concave lens. Move the candle beyond **2F**, then choose what you discover.',
      controls: [objectControl],
      fixed: { focalLength: FOCAL_LENGTH },
      initial: { objectDistance: 30 },
      success: (state, image) =>
        !image.isReal &&
        state.objectDistance > 2 * Math.abs(FOCAL_LENGTH) &&
        image.orientation === 'upright',
      choices: [
        {
          id: 'no-real',
          label: 'No **real** image: it stays **virtual** near **F**',
          correct: true,
          feedback:
            'Yes. Even beyond **2F**, a concave lens spreads the rays apart, so the image stays **virtual** near **F** on the **same side of the lens as the object**.',
        },
        {
          id: 'real-2f',
          label: 'A **real** image appears at **2F**',
          feedback:
            'That is the convex same-size pattern. Concave lenses do not make a **real** image on the **opposite side of the lens from a real object**.',
        },
        {
          id: 'real-far',
          label: 'A **real** image appears beyond **2F**',
          feedback:
            'A concave lens does not create a **real projected image** from a real candle.',
        },
      ],
      correctFeedback:
        'Right. With a real candle, a concave lens cannot make a **real** image; the **virtual** image stays near **F** on the **same side of the lens as the object**.',
      hint: (_state, image) =>
        image.magnification > 0.4
          ? 'To test for a **real** image, look for __solid outgoing rays__ meeting on the **opposite side of the lens from the object**. Keep dragging until you have tried a far-away candle setup.'
          : 'A **real** image would be solid outgoing rays crossing on the **opposite side of the lens from the object**. Here the outgoing rays still **diverge** and only **dotted back-traces** meet.',
    },
    {
      id: 'concave-try-inverted-image',
      prompt: 'Try to make an **inverted** image with the concave lens. Move the candle inside **F**, then choose what you discover.',
      controls: [nearLensObjectControl],
      fixed: { focalLength: FOCAL_LENGTH },
      initial: { objectDistance: 40 },
      success: (state, image) =>
        !image.isReal &&
        state.objectDistance < Math.abs(FOCAL_LENGTH) &&
        image.orientation === 'upright',
      choices: [
        {
          id: 'no-inverted',
          label: 'No **inverted** image: it stays **upright**',
          correct: true,
          feedback:
            'Correct. Even inside **F**, a concave lens keeps the image **upright**.',
        },
        {
          id: 'inverted-real',
          label: 'It becomes **real** and **inverted**',
          feedback:
            'That flip happens for a **convex** lens outside **F**, not for a **concave** lens.',
        },
        {
          id: 'inverted-virtual',
          label: 'It becomes **virtual** and **inverted**',
          feedback:
            'The image is **virtual**, but it stays **upright** for a real candle.',
        },
      ],
      correctFeedback:
        'Correct. With a real candle, a concave lens cannot make an **inverted** image.',
      hint: (state) =>
        state.objectDistance >= Math.abs(FOCAL_LENGTH)
          ? 'To test for an **inverted** image, watch whether the image candle ever flips __below the axis__ while you drag the object close to the lens.'
          : 'An **inverted** image would hang below the axis. This image still stands **upright**, so choose the discovery that says it stays upright.',
    },
  ],
}
