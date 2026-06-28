import type { LessonDefinition } from '../types'

// "Convex Lenses": the first lesson. Learners move the candle to create the four
// core image possibilities: real, virtual, upright, and inverted.

const FOCAL_LENGTH = 20
const objectControl = {
  key: 'objectDistance',
  type: 'drag-axis' as const,
  // Allow the candle all the way to the lens (0); don't clamp at 5.
  min: 0,
  // 80 is the visible left edge of the scene; sliding/dragging to it means ∞.
  max: 80,
  step: 0.01,
  label: 'Object distance',
  allowInfinity: true,
  // Snap to 0, F, 2F, and 3F so key positions are easy to hit.
  snaps: [0, FOCAL_LENGTH, 2 * FOCAL_LENGTH, 3 * FOCAL_LENGTH],
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
      'Drag the candle across **F** and **2F**. Outside **F** gives **real**, **inverted** images; inside **F** gives **virtual**, **upright** images.',
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
          return 'A **real** image is where __solid outgoing rays__ actually meet on the **opposite side of the lens from the object**. Keep dragging until the dotted back-traces disappear and the image candle is opposite the object.'
        }
        if (image.atInfinity) {
          return 'Here the outgoing rays are **parallel**, so they never meet on a **screen**. Keep dragging until the __solid rays cross__ at a finite point.'
        }
        return 'Look for the **solid rays** to actually meet on the **opposite side of the lens from the object**. That crossing is a **real** image.'
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
        'Correct. Inside **F**, a convex lens makes a **virtual** image on the **same side of the lens as the object**, where **dotted back-traces** meet.',
      hint: (state, image) => {
        if (state.objectDistance > state.focalLength) {
          return 'A **virtual** image is not a solid-ray crossing. It appears where **dotted back-traces** meet on the **same side of the lens as the object**. Drag until the solid rays spread apart and the dotted lines point backward to an image.'
        }
        if (image.atInfinity) {
          return '**Parallel** outgoing rays do not make a nearby **virtual** image yet. Keep dragging until the outgoing rays **diverge** and dotted back-traces appear.'
        }
        return 'Look for **dotted back-traces** meeting on the **same side of the lens as the object**. That apparent meeting point is a **virtual** image.'
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
          ? 'An **upright** image points the __same way as the candle__. Drag until the image candle stands above the axis instead of hanging below it.'
          : 'Use the image candle that stands **above the axis**, the same way up as the object.',
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
          ? 'An **inverted** image is flipped __below the axis__. Drag until the image candle hangs upside-down on the **opposite side of the lens from the object**.'
          : 'Look for the image candle **below the axis**: that is **inverted**.',
    },
  ],
}
