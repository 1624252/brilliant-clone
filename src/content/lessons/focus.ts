import type { LessonDefinition } from '../types'

// "Convex Lenses": the first lesson. Learners move the candle to create the four
// core image possibilities: real, virtual, upright, and inverted.

const FOCAL_LENGTH = 20
const objectControl = {
  key: 'objectDistance',
  type: 'drag-axis' as const,
  min: 5,
  // 80 is the visible left edge of the scene; sliding/dragging to it means ∞.
  max: 80,
  step: 0.01,
  label: 'Object distance',
  allowInfinity: true,
  // Snap to F, 2F, and 3F so key positions are easy to hit.
  snaps: [FOCAL_LENGTH, 2 * FOCAL_LENGTH, 3 * FOCAL_LENGTH],
}

export const focusLesson: LessonDefinition = {
  // Id kept as 'focusing-light' so saved progress and existing links stay valid.
  id: 'focusing-light',
  title: 'Convex Lenses',
  order: 1,
  estMinutes: 4,
  summary: 'Move the candle to create real, virtual, upright, and inverted images.',
  intro: {
    heading: 'Where light comes to a focus',
    animation: 'convex',
    paragraphs: [
      'A **convex lens** (one that bulges outward) converges **parallel rays** so they cross at the **focus**.',
      'The distance from the lens to **F** is the **focal length, f**. The same distance on the object side is also marked as **F**.',
      'Drag the candle across **F** and **2F**. Outside **F** gives real, inverted images; inside **F** gives virtual, upright images.',
    ],
  },
  steps: [
    {
      id: 'make-real-image',
      prompt: 'Move the candle until the convex lens makes a **real** image.',
      controls: [objectControl],
      fixed: { focalLength: FOCAL_LENGTH },
      initial: { objectDistance: 10 },
      success: (state, image) =>
        state.objectDistance > state.focalLength &&
        image.isReal &&
        Number.isFinite(image.imageDistance),
      correctFeedback:
        'Yes. A convex lens makes a **real** image when the candle is outside **F**.',
      hint: (state, image) => {
        if (state.objectDistance < state.focalLength) {
          return 'The image is still **virtual** because the candle is inside **F**. Move it outside **F**.'
        }
        if (image.atInfinity) {
          return 'You are right on **F**, where the image goes to infinity. Move a little farther out.'
        }
        return 'Look for the rays to actually meet on the far side of the lens.'
      },
    },
    {
      id: 'make-virtual-image',
      prompt: 'Now move the candle until the convex lens makes a **virtual** image.',
      controls: [objectControl],
      fixed: { focalLength: FOCAL_LENGTH },
      initial: { objectDistance: 50 },
      success: (state, image) =>
        state.objectDistance < state.focalLength && !image.isReal,
      correctFeedback:
        'Correct. Inside **F**, a convex lens makes a **virtual** image on the candle side.',
      hint: (state, image) => {
        if (state.objectDistance > state.focalLength) {
          return 'The rays are still meeting on the far side, so the image is **real**. Move the candle inside **F**.'
        }
        if (image.atInfinity) {
          return 'At **F**, rays leave parallel. Move just inside **F** to make the image virtual.'
        }
        return 'Look for dotted back-traces: those mark a virtual image.'
      },
    },
    {
      id: 'make-upright-image',
      prompt: 'Move the candle until the convex lens makes an **upright** image.',
      controls: [objectControl],
      fixed: { focalLength: FOCAL_LENGTH },
      initial: { objectDistance: 40 },
      success: (state, image) =>
        state.objectDistance < state.focalLength &&
        image.orientation === 'upright' &&
        !image.isReal,
      correctFeedback:
        'Yes. For a convex lens, an **upright** image happens only when the candle is inside **F**.',
      hint: (state, image) =>
        state.objectDistance >= state.focalLength || image.orientation !== 'upright'
          ? 'The image is still inverted outside **F**. Move the candle inside **F**.'
          : 'Use the upright virtual image on the candle side.',
    },
    {
      id: 'make-inverted-image',
      prompt: 'Finally, move the candle until the convex lens makes an **inverted** image.',
      controls: [objectControl],
      fixed: { focalLength: FOCAL_LENGTH },
      initial: { objectDistance: 10 },
      success: (state, image) =>
        image.isReal &&
        image.orientation === 'inverted' &&
        state.objectDistance > state.focalLength,
      correctFeedback:
        'Correct. Outside **F**, a convex lens makes a **real**, **inverted** image.',
      hint: (state, image) =>
        state.objectDistance <= state.focalLength || image.orientation !== 'inverted'
          ? 'The image is upright inside **F**. Move the candle outside **F** to flip it.'
          : 'Look for the image candle below the axis: that is inverted.',
    },
  ],
}
