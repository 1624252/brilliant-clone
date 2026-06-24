import type { LessonDefinition } from '../types'

const dispersionControl = {
  key: 'dispersion',
  type: 'slider' as const,
  min: 0,
  max: 1,
  step: 0.01,
  label: 'Color spread',
  snaps: [0, 0.5, 1],
}

const screenControl = {
  key: 'screenDistance',
  type: 'slider' as const,
  min: 12,
  max: 28,
  step: 0.1,
  label: 'Screen position',
  snaps: [12, 20, 28],
}

const correctionControl = {
  key: 'correction',
  type: 'slider' as const,
  min: 0,
  max: 1,
  step: 0.01,
  label: 'Correction',
  snaps: [0, 0.5, 1],
}

export const chromaticAberrationLesson: LessonDefinition = {
  id: 'chromatic-aberration-basics',
  title: 'Chromatic Aberration',
  order: 1,
  estMinutes: 4,
  summary: 'See why different colors focus at different distances.',
  intro: {
    heading: 'Colors do not focus together',
    animation: 'focus',
    paragraphs: [
      'Glass bends **blue light** a little more than **red light**.',
      'That means one white beam can have several focal points: blue closer to the lens, red farther away.',
      'This color spread is **chromatic aberration**. It creates colored fringes and soft focus unless lenses are paired to reduce it.',
    ],
  },
  steps: [
    {
      id: 'split-white-light',
      prompt: 'Increase the **color spread** until red, green, and blue focus at clearly different places.',
      visual: 'chromatic',
      controls: [dispersionControl],
      fixed: { objectDistance: 60 },
      initial: { dispersion: 0 },
      success: (state) => state.dispersion >= 0.75,
      correctFeedback:
        'That split is **chromatic aberration**: **blue** focuses closest, **red** focuses farthest.',
      hint: (state) =>
        state.dispersion < 0.75
          ? 'Increase the spread until the **blue**, **green**, and **red** focal dots separate clearly.'
          : 'Look for three distinct color focal points.',
    },
    {
      id: 'find-fringe-screen',
      prompt: 'Move the **screen** to the green focus and notice why red/blue fringes remain.',
      visual: 'chromatic',
      controls: [screenControl],
      fixed: { objectDistance: 60, dispersion: 1 },
      initial: { screenDistance: 12 },
      success: (state) => Math.abs(state.screenDistance - 20) <= 1,
      correctFeedback:
        'At the **green focus**, green is sharp, but **blue** has already crossed and **red** has not arrived yet, creating colored blur.',
      hint: (state) =>
        state.screenDistance < 20
          ? 'Move the screen toward the middle **green** focal point.'
          : 'Move the screen back toward the middle **green** focal point.',
    },
    {
      id: 'reduce-color-spread',
      prompt:
        'Use **correction** to bring the red, green, and blue focal points closer together.',
      visual: 'chromatic',
      controls: [correctionControl],
      fixed: { objectDistance: 60, dispersion: 1 },
      initial: { correction: 0 },
      success: (state) => state.correction >= 0.8,
      correctFeedback:
        'Good. An **achromatic** lens pair reduces color blur by bringing separated focal points closer together.',
      hint: (state) =>
        state.correction < 0.8
          ? 'Increase correction until the **red**, **green**, and **blue** dots nearly overlap.'
          : 'The colors are almost together; finish bringing the focal points into one cluster.',
    },
  ],
}
