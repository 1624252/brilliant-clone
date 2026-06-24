import type { Control, StepDefinition } from '../../types'
import type { Rng } from '../rng'
import type { PracticeTopicId } from '../topics'

// A template produces a concrete lesson-style step from a seed, so one template
// yields effectively endless variants while reusing the exact interactions the
// lessons use (drag, curvature, predict, draw-rays).
export interface PracticeTemplate {
  id: string
  topicId: PracticeTopicId
  generate: (rng: Rng) => StepDefinition
}

export interface GeneratedProblem {
  topicId: PracticeTopicId
  templateId: string
  step: StepDefinition
}

/** Friendly focal lengths that keep the arithmetic clean and the diagram in view
 * (small enough that the object/image stay on-screen across the drag range). */
export const FOCALS = [12, 15, 18, 20] as const

/** A draggable object-distance control mirroring the one used by the lessons. */
export function objectControl(focalLength: number, min = 5): Control {
  const f = Math.abs(focalLength)
  return {
    key: 'objectDistance',
    type: 'drag-axis',
    min,
    max: 80,
    step: 0.01,
    label: 'Object distance',
    allowInfinity: true,
    snaps: [f, 2 * f, 3 * f],
  }
}
