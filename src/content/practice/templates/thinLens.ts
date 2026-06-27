import type { InteractiveStep } from '../../types'
import { FOCALS, objectControl, type PracticeTemplate } from './types'

// Thin lens equation applications (Lesson 5): magnifier, projector, the 2F
// same-size check, and a reduced real image beyond 2F.

const magnifier: PracticeTemplate = {
  id: 'thin-lens-magnifier',
  topicId: 'thin-lens',
  difficulty: 1,
  generate: (rng) => {
    const f = rng.pick(FOCALS)
    const sfx = rng.int(0, 1_000_000_000)
    const step: InteractiveStep = {
      id: `tl-magnifier-${sfx}`,
      prompt: 'Make an upright, magnified image (a magnifying glass).',
      controls: [objectControl(f)],
      fixed: { focalLength: f },
      initial: { objectDistance: 2 * f + 10 },
      success: (_state, image) =>
        !image.isReal && image.orientation === 'upright' && image.isMagnified,
      correctFeedback: 'Inside **F**: a convex lens makes a **virtual**, **upright**, **enlarged** image.',
      hint: (_state, image) =>
        image.isReal
          ? 'Still **real** and flipped — the rays meet on the far side. Move inside **F**.'
          : 'You found a **virtual** image. Move closer to **F** from the inside to enlarge it.',
    }
    return step
  },
}

const projector: PracticeTemplate = {
  id: 'thin-lens-projector',
  topicId: 'thin-lens',
  difficulty: 2,
  generate: (rng) => {
    const f = rng.pick(FOCALS)
    const sfx = rng.int(0, 1_000_000_000)
    const step: InteractiveStep = {
      id: `tl-projector-${sfx}`,
      prompt: 'Project a magnified, flipped image (a projector).',
      controls: [objectControl(f)],
      fixed: { focalLength: f },
      initial: { objectDistance: 3 * f },
      success: (_state, image) => image.isReal && image.isMagnified,
      correctFeedback: 'Between **F** and **2F**: **real**, **flipped**, and **enlarged**.',
      hint: (_state, image) =>
        !image.isReal
          ? 'Your image is **virtual** — move outside **F** so it can be projected.'
          : 'Move closer to **F** (but stay outside it) until the image grows past same-size.',
    }
    return step
  },
}

const sameSize: PracticeTemplate = {
  id: 'thin-lens-2f-same-size',
  topicId: 'thin-lens',
  difficulty: 3,
  generate: (rng) => {
    const f = rng.pick(FOCALS)
    const sfx = rng.int(0, 1_000_000_000)
    const step: InteractiveStep = {
      id: `tl-samesize-${sfx}`,
      prompt: 'Make a real, flipped image that is exactly the **same size** as the candle.',
      controls: [objectControl(f)],
      fixed: { focalLength: f },
      initial: { objectDistance: 3 * f },
      success: (_state, image) =>
        image.isReal &&
        image.orientation === 'inverted' &&
        Math.abs(image.magnification) >= 0.9 &&
        Math.abs(image.magnification) <= 1.1,
      correctFeedback: 'At **2F** the object and image trade places: **real**, **inverted**, **same size**.',
      hint: (_state, image) =>
        Math.abs(image.magnification) < 0.9
          ? 'The image is too **small** — move the candle closer, toward **2F**.'
          : Math.abs(image.magnification) > 1.1
            ? 'The image is too **large** — move the candle farther out, toward **2F**.'
            : 'Almost — fine-tune the candle to exactly **2F**.',
    }
    return step
  },
}

const realReduced: PracticeTemplate = {
  id: 'thin-lens-real-reduced',
  topicId: 'thin-lens',
  difficulty: 3,
  generate: (rng) => {
    const f = rng.pick(FOCALS)
    const sfx = rng.int(0, 1_000_000_000)
    const step: InteractiveStep = {
      id: `tl-reduced-${sfx}`,
      prompt: 'Make a real, flipped image that is **smaller** than the candle.',
      controls: [objectControl(f)],
      fixed: { focalLength: f },
      initial: { objectDistance: Math.round(f * 0.5) },
      success: (_state, image) =>
        image.isReal &&
        image.orientation === 'inverted' &&
        Math.abs(image.magnification) < 0.9,
      correctFeedback: 'Beyond **2F**: a convex lens makes a **real**, **inverted**, **reduced** image.',
      hint: (_state, image) =>
        !image.isReal
          ? 'Your image is **virtual** — move outside **F** first.'
          : 'Move the candle well beyond **2F** so the image shrinks below the object size.',
    }
    return step
  },
}

export const thinLensTemplates = [magnifier, projector, sameSize, realReduced]
