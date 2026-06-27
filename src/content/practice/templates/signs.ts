import type { Choice, PredictStep } from '../../types'
import { formImage } from '../../../engine'
import { FOCALS, type PracticeTemplate } from './types'

// Sign conventions: read the image type straight from the signs of d_i and m,
// before looking at the rays. d_i > 0 is a real image on the far side; d_i < 0
// is virtual on the object side; m > 0 is upright, m < 0 is inverted.

type Case = 'convex-inside' | 'convex-outside' | 'concave'

const CASES: Case[] = ['convex-inside', 'convex-outside', 'concave']

const fmt = (n: number) => (Number.isFinite(n) ? n.toFixed(1) : '∞')

const CHOICES: Record<string, Omit<Choice, 'correct'>> = {
  'opposite-inverted': {
    id: 'opposite-inverted',
    label: 'Far side, **real**, **inverted**',
    feedback: 'A positive d_i means the image is real on the far side; negative m means inverted.',
  },
  'same-upright-large': {
    id: 'same-upright-large',
    label: 'Same side, **upright**, **enlarged**',
    feedback: 'A negative d_i means a virtual image on the object side; m > 1 means upright and enlarged.',
  },
  'same-upright-small': {
    id: 'same-upright-small',
    label: 'Same side, **upright**, **reduced**',
    feedback: 'A negative d_i means virtual on the object side; 0 < m < 1 means upright and reduced.',
  },
}

export const signConventionTemplate: PracticeTemplate = {
  id: 'sign-conventions-read',
  topicId: 'sign-conventions',
  difficulty: 2,
  generate: (rng) => {
    const f = rng.pick(FOCALS)
    const kind = rng.pick(CASES)
    const sfx = rng.int(0, 1_000_000_000)

    let objectDistance: number
    let focalLength: number
    let correctId: string
    switch (kind) {
      case 'convex-inside':
        objectDistance = Math.round(f * 0.5)
        focalLength = f
        correctId = 'same-upright-large'
        break
      case 'convex-outside':
        objectDistance = Math.round(f * 3)
        focalLength = f
        correctId = 'opposite-inverted'
        break
      default:
        objectDistance = Math.round(f * 2)
        focalLength = -f
        correctId = 'same-upright-small'
    }

    const image = formImage(objectDistance, focalLength)
    const choices: Choice[] = ['opposite-inverted', 'same-upright-large', 'same-upright-small'].map(
      (id) => ({ ...CHOICES[id], correct: id === correctId }),
    )

    const step: PredictStep = {
      kind: 'predict',
      id: `signs-${kind}-${sfx}`,
      prompt: `The thin lens equation gives **d_i = ${fmt(image.imageDistance)}** and **m = ${fmt(
        image.magnification,
      )}**. Which image appears?`,
      scene: { objectDistance, focalLength },
      choices,
      reveal: 'The signs tell you the image type before you even draw the rays.',
    }
    return step
  },
}

export const signTemplates = [signConventionTemplate]
