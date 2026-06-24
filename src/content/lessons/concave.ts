import type { LessonDefinition } from '../types'

// "Concave Lenses": a diverging lens (f < 0). This mirrors the convex landmark
// positions but shows the always-virtual, upright, reduced image pattern.

const FOCAL_LENGTH = -20 // negative -> diverging
const objectControl = {
  key: 'objectDistance',
  type: 'drag-axis' as const,
  min: 5,
  max: 80,
  step: 0.01,
  label: 'Object distance',
  allowInfinity: true,
  snaps: [20, 40, 60],
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
      'Try the same image targets as with a convex lens. You’ll find a concave lens always keeps real-candle images **virtual** and upright.',
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
        'Watch the dotted back-traces on the candle side. Those mark a **virtual** image.',
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
        'Look at the image candle: it stays above the axis, the same way up as the object.',
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
          label: 'No real image: it stays **virtual**',
          correct: true,
          feedback:
            'Yes. Even at **2F**, a concave lens spreads the rays apart, so the image stays virtual.',
        },
        {
          id: 'real-2f',
          label: 'A real image appears at **2F**',
          feedback:
            'That is the convex same-size pattern. Concave lenses do not make a real far-side image for a real object.',
        },
        {
          id: 'real-far',
          label: 'A real image appears beyond **2F**',
          feedback:
            'A concave lens does not create a real projected image from a real candle.',
        },
      ],
      correctFeedback:
        'Right. With a real candle, a concave lens cannot make a **real** image.',
      hint: (_state, image) =>
        image.magnification > 0.4
          ? 'Move the candle out to **2F** so you test the same landmark used by convex lenses.'
          : 'Beyond **2F**, notice that the outgoing rays still diverge and only dotted back-traces meet.',
    },
    {
      id: 'concave-try-inverted-image',
      prompt: 'Try to make an **inverted** image with the concave lens. Move the candle inside **F**, then choose what you discover.',
      controls: [objectControl],
      fixed: { focalLength: FOCAL_LENGTH },
      initial: { objectDistance: 40 },
      success: (state, image) =>
        !image.isReal &&
        state.objectDistance < Math.abs(FOCAL_LENGTH) &&
        image.orientation === 'upright',
      choices: [
        {
          id: 'no-inverted',
          label: 'No inverted image: it stays upright',
          correct: true,
          feedback:
            'Correct. Even inside **F**, a concave lens keeps the image upright.',
        },
        {
          id: 'inverted-real',
          label: 'It becomes real and inverted',
          feedback:
            'That flip happens for a convex lens outside **F**, not for a concave lens.',
        },
        {
          id: 'inverted-virtual',
          label: 'It becomes virtual and inverted',
          feedback:
            'The image is virtual, but it stays upright for a real candle.',
        },
      ],
      correctFeedback:
        'Correct. With a real candle, a concave lens cannot make an **inverted** image.',
      hint: (state) =>
        state.objectDistance >= Math.abs(FOCAL_LENGTH)
          ? 'Move the candle inside **F** to test the strongest near-lens case.'
          : 'Inside **F**, the image is still above the axis. Choose the answer that says it stays upright.',
    },
  ],
}
