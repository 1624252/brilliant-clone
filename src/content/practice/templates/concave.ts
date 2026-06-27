import type { PredictStep, InteractiveStep } from '../../types'
import { FOCALS, objectControl, type PracticeTemplate } from './types'

// Concave (diverging) lens: misconception checks plus one hands-on minification
// task. A real object always gives a virtual, upright, reduced image.

const concaveRealImpossible: PracticeTemplate = {
  id: 'concave-real-impossible',
  topicId: 'concave-images',
  difficulty: 1,
  generate: (rng) => {
    const f = rng.pick(FOCALS)
    const sfx = rng.int(0, 1_000_000_000)
    const step: PredictStep = {
      kind: 'predict',
      id: `concave-real-${sfx}`,
      prompt:
        'A concave lens has a real candle placed beyond **2F**. Can it make a **real** image you could catch on a screen?',
      scene: { objectDistance: 2.5 * f, focalLength: -f },
      choices: [
        {
          id: 'no',
          label: 'No — it stays **virtual** near **F**',
          correct: true,
          feedback:
            'Right. A diverging lens spreads the rays, so the image stays **virtual** on the **same side as the object**.',
        },
        {
          id: 'real-2f',
          label: 'Yes — a **real** image at **2F**',
          feedback: 'That is the convex same-size pattern, not a concave lens.',
        },
        {
          id: 'real-far',
          label: 'Yes — a **real** image far away',
          feedback: 'A concave lens never projects a real image from a real object.',
        },
      ],
      reveal:
        'With f < 0 and a real object, the outgoing rays always **diverge**; only their dotted back-traces meet, so the image is **virtual**.',
    }
    return step
  },
}

const concaveMagnify: PracticeTemplate = {
  id: 'concave-magnify',
  topicId: 'concave-images',
  difficulty: 2,
  generate: (rng) => {
    const f = rng.pick(FOCALS)
    const sfx = rng.int(0, 1_000_000_000)
    const step: PredictStep = {
      kind: 'predict',
      id: `concave-magnify-${sfx}`,
      prompt:
        'You slide a real candle closer and closer to a concave lens. Does the image ever become **larger** than the candle?',
      scene: { objectDistance: 0.6 * f, focalLength: -f },
      choices: [
        {
          id: 'never',
          label: 'No — it gets less reduced but never larger',
          correct: true,
          feedback: 'Correct. For a real object a concave lens keeps 0 < m < 1.',
        },
        {
          id: 'inside-f',
          label: 'Yes — once it is inside **F**',
          feedback: 'Magnifying inside F is a convex-lens rule, not concave.',
        },
        {
          id: 'far',
          label: 'Yes — when it is very far away',
          feedback: 'Far away makes the image tiny near F, not larger.',
        },
      ],
      reveal:
        'A diverging lens always shrinks a real object: the image is **virtual**, **upright**, and **reduced** (0 < m < 1).',
    }
    return step
  },
}

const concaveMinify: PracticeTemplate = {
  id: 'concave-minify-far',
  topicId: 'concave-images',
  difficulty: 3,
  generate: (rng) => {
    const f = rng.pick(FOCALS)
    const sfx = rng.int(0, 1_000_000_000)
    const step: InteractiveStep = {
      id: `concave-minify-${sfx}`,
      prompt: 'Use the concave lens to make a **tiny** upright image near the virtual focus.',
      controls: [objectControl(-f)],
      fixed: { focalLength: -f },
      initial: { objectDistance: f * 0.6 },
      success: (state, image) =>
        state.objectDistance >= 2.5 * f &&
        !image.isReal &&
        image.orientation === 'upright' &&
        Math.abs(image.magnification) < 0.3,
      correctFeedback:
        'Far from a concave lens the image becomes **tiny**, **virtual**, and close to the **virtual focus**.',
      hint: (_state, image) =>
        Math.abs(image.magnification) >= 0.3
          ? 'The image is not **tiny** yet. Move the candle farther away, toward **infinity**.'
          : 'You have a tiny virtual image — keep the candle far from the lens.',
    }
    return step
  },
}

export const concaveTemplates = [concaveRealImpossible, concaveMagnify, concaveMinify]
