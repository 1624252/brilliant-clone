import type { InteractiveStep } from '../../types'
import { FOCALS, objectControl, type PracticeTemplate } from './types'

// Convex (converging) lens: recreate the four core image targets from Lesson 1,
// with a randomized focal length and a starting position that is deliberately
// off-target so nothing is pre-solved.

type Target = 'real' | 'virtual' | 'upright' | 'inverted'

const TARGETS: Target[] = ['real', 'virtual', 'upright', 'inverted']

export const convexImageTemplate: PracticeTemplate = {
  id: 'convex-image-type',
  topicId: 'convex-images',
  difficulty: 2,
  generate: (rng) => {
    const f = rng.pick(FOCALS)
    const target = rng.pick(TARGETS)
    const sfx = rng.int(0, 1_000_000_000)
    // Outside-F targets start inside F (and vice versa) so the learner must move.
    const startsInside = target === 'real' || target === 'inverted'
    const initial = startsInside ? Math.round(f * 0.4) : 2 * f + 12

    const base = {
      controls: [objectControl(f)],
      fixed: { focalLength: f },
      initial: { objectDistance: initial },
    }

    const byTarget: Record<Target, Omit<InteractiveStep, keyof typeof base | 'id'>> = {
      real: {
        prompt: 'Move the candle until the convex lens makes a **real** image.',
        success: (state, image) =>
          state.objectDistance > state.focalLength &&
          image.isReal &&
          Number.isFinite(image.imageDistance),
        correctFeedback:
          'A convex lens makes a **real** image when the candle is outside **F** — solid rays cross on the far side.',
        hint: (state) =>
          state.objectDistance <= state.focalLength
            ? 'A **real** image forms where __solid outgoing rays__ meet on the **opposite side of the lens from the object**. Move outside **F**.'
            : 'Watch for the **solid rays** to actually cross on the far side — that crossing is a **real** image.',
      },
      virtual: {
        prompt: 'Move the candle until the convex lens makes a **virtual** image.',
        success: (state, image) => state.objectDistance < state.focalLength && !image.isReal,
        correctFeedback:
          'Inside **F**, a convex lens makes a **virtual** image on the **same side as the object**.',
        hint: (state) =>
          state.objectDistance >= state.focalLength
            ? 'A **virtual** image appears where **dotted back-traces** meet on the **same side as the object**. Move inside **F**.'
            : 'You are inside **F** — look for the dotted back-traces pointing to the virtual image.',
      },
      upright: {
        prompt: 'Move the candle until the convex lens makes an **upright** image.',
        success: (state, image) =>
          state.objectDistance < state.focalLength &&
          image.orientation === 'upright' &&
          !image.isReal,
        correctFeedback:
          'A convex lens makes an **upright** image only when the candle is inside **F**.',
        hint: (state, image) =>
          state.objectDistance >= state.focalLength || image.orientation !== 'upright'
            ? 'An **upright** image points the __same way as the candle__. Move inside **F**.'
            : 'The image now stands above the axis — that is **upright**.',
      },
      inverted: {
        prompt: 'Move the candle until the convex lens makes an **inverted** image.',
        success: (state, image) =>
          image.isReal &&
          image.orientation === 'inverted' &&
          state.objectDistance > state.focalLength,
        correctFeedback: 'Outside **F**, a convex lens makes a **real**, **inverted** image.',
        hint: (state, image) =>
          state.objectDistance <= state.focalLength || image.orientation !== 'inverted'
            ? 'An **inverted** image hangs __below the axis__ on the far side. Move outside **F**.'
            : 'The image candle is flipped below the axis — that is **inverted**.',
      },
    }

    return { id: `convex-${target}-${sfx}`, ...base, ...byTarget[target] }
  },
}

export const convexTemplates = [convexImageTemplate]
