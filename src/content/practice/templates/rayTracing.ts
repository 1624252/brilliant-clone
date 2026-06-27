import type { PlotRaysStep } from '../../types'
import { imageDistance } from '../../../engine'
import { FOCALS, type PracticeTemplate } from './types'

// Ray tracing: draw the three principal rays (Lesson 4). We size plotHalfWidth
// from the actual image distance so the crossing always fits on screen.

type Case = 'convex-far' | 'convex-mid' | 'concave-near' | 'concave-far'

const CASES: Case[] = ['convex-far', 'convex-mid', 'concave-near', 'concave-far']

/** Optical half-width that comfortably contains the image crossing. */
function fitHalfWidth(objectDistance: number, focalLength: number): number {
  const di = Math.abs(imageDistance(objectDistance, focalLength))
  return Math.max(46, Math.min(120, Math.ceil((Number.isFinite(di) ? di : 0) + objectDistance / 2 + 12)))
}

export const rayTracingTemplate: PracticeTemplate = {
  id: 'ray-tracing-principal',
  topicId: 'ray-tracing',
  difficulty: 2,
  generate: (rng) => {
    const f = rng.pick(FOCALS)
    const kind = rng.pick(CASES)
    const sfx = rng.int(0, 1_000_000_000)

    let objectDistance: number
    let focalLength: number
    let prompt: string
    let hint: string
    let reveal: string

    switch (kind) {
      case 'convex-far':
        objectDistance = Math.round(f * (2.4 + rng.next() * 0.8))
        focalLength = f
        prompt = 'Convex lens: the candle is beyond **2F**. Draw the three rays to the image.'
        hint =
          'The **parallel** ray bends through far **F**, the **chief** ray goes straight through the center, the **focal** ray leaves **parallel**.'
        reveal = 'The rays cross between **F** and **2F**: a **real**, **inverted**, **reduced** image.'
        break
      case 'convex-mid':
        objectDistance = Math.round(f * (1.6 + rng.next() * 0.3))
        focalLength = f
        prompt = 'Convex lens: the candle is between **F** and **2F**. Trace the projector case.'
        hint = 'The rays should cross beyond **2F**. Keep the outgoing rays **solid**.'
        reveal = 'Between **F** and **2F**: a **real**, **inverted**, **enlarged** image beyond **2F**.'
        break
      case 'concave-near':
        objectDistance = Math.round(f * (0.4 + rng.next() * 0.4))
        focalLength = -f
        prompt = 'Concave lens: the candle is inside virtual **F**. Trace the virtual image.'
        hint =
          'The **parallel** ray leaves as if from **F** on the **same side as the object** — follow the dotted back-traces there.'
        reveal =
          'The rays **spread out**; their dotted back-traces meet on the object side: a **virtual**, **upright**, **reduced** image.'
        break
      default:
        objectDistance = Math.round(f * (2.4 + rng.next() * 0.8))
        focalLength = -f
        prompt = 'Concave lens: the candle is beyond **2F**. Trace the tiny virtual image near **F**.'
        hint = 'The outgoing rays **diverge**; the dotted back-traces point back toward virtual **F**.'
        reveal = 'Farther objects make the concave image **smaller**, but it stays **virtual** and **upright**.'
    }

    const step: PlotRaysStep = {
      kind: 'plot-rays',
      id: `ray-${kind}-${sfx}`,
      prompt,
      scene: { objectDistance, focalLength },
      plotHalfWidth: fitHalfWidth(objectDistance, focalLength),
      hint,
      reveal,
    }
    return step
  },
}

export const rayTracingTemplates = [rayTracingTemplate]
