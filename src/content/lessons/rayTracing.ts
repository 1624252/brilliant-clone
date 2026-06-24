import type { LessonDefinition } from '../types'

// "Ray Tracing": locating images by constructing principal rays for both
// convex and concave lenses.

const FOCAL_LENGTH = 20

export const rayTracingLesson: LessonDefinition = {
  id: 'ray-tracing',
  title: 'Ray Tracing',
  order: 4,
  estMinutes: 5,
  summary: 'Trace principal rays for convex and concave lenses.',
  intro: {
    heading: 'Three rays find any image',
    animation: 'focus',
    paragraphs: [
      'You only need **three special rays** from the top of the object to locate its image.',
      'For a **convex lens**, real rays may cross on the far side; for a **concave lens**, dotted back-traces meet on the candle side.',
      'Drag each ray close to its correct path and it will snap into place. The requirement turns done only when that ray rule is actually satisfied.',
    ],
  },
  steps: [
    {
      kind: 'plot-rays',
      id: 'trace-convex-beyond-2focus',
      prompt:
        'Convex lens: the candle is beyond **2F**. Draw the three rays until they cross at the image.',
      scene: { objectDistance: 60, focalLength: FOCAL_LENGTH },
      hint:
        'Use the **F** marks: the **parallel** ray bends through far **F**, the **chief** ray stays straight through the center, and the **focal** ray leaves **parallel**.',
      reveal:
        'The convex rays cross between **F** and **2F**, making a **real**, inverted, **reduced** image.',
    },
    {
      kind: 'plot-rays',
      id: 'trace-convex-between-focus-2focus',
      prompt:
        'Convex lens: the candle is between **F** and **2F**. Trace the projector case.',
      scene: { objectDistance: 30, focalLength: FOCAL_LENGTH },
      hint:
        'The rays should cross beyond **2F**. Keep the outgoing ray solid, then use dotted back-traces only if the rays diverge.',
      reveal:
        'Between **F** and **2F**, a convex lens makes a **real**, inverted, **enlarged** image beyond **2F**.',
    },
    {
      kind: 'plot-rays',
      id: 'trace-concave-near',
      prompt:
        'Concave lens: the candle is between the lens and virtual **F**. Trace the virtual image.',
      scene: { objectDistance: 12, focalLength: -FOCAL_LENGTH, objectHeight: 12 },
      hint:
        'The **parallel** ray leaves as if it came from the near-side **focus**. Follow the colored dotted back-traces on the candle side.',
      reveal:
        'The concave rays spread out. Their dotted back-traces meet on the candle side, making a **virtual**, **upright**, **reduced** image.',
    },
    {
      kind: 'plot-rays',
      id: 'trace-concave-far',
      prompt:
        'Concave lens: the candle is beyond **2F**. Trace the tiny virtual image near **F**.',
      scene: { objectDistance: 60, focalLength: -FOCAL_LENGTH },
      hint:
        'For a concave lens, the outgoing rays diverge. The colored dotted back-traces should point back toward the candle-side **focus**.',
      reveal:
        'Farther objects make the concave image smaller and closer to the **virtual focus**, but it remains **virtual**, **upright**, and **reduced**.',
    },
  ],
}
