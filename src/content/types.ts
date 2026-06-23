import type { ImageFormation } from '../engine'

// Data-driven lesson content. A lesson is a list of steps; each step is a small
// interactive problem described as data so new lessons need config, not code.

export type ControlType = 'drag-axis' | 'slider'

export interface Control {
  /** State key this control writes, e.g. "objectDistance". */
  key: string
  type: ControlType
  min: number
  max: number
  step?: number
  label?: string
}

/** Numeric values the learner is manipulating, keyed by control key. */
export type StepState = Record<string, number>

export interface StepDefinition {
  id: string
  prompt: string
  /** Values the learner can change. */
  controls: Control[]
  /** Starting values for the controls. */
  initial: StepState
  /** Values the learner cannot change (e.g. a fixed focal length). */
  fixed?: StepState
  /** True when the learner's attempt is correct. */
  success: (state: StepState, image: ImageFormation) => boolean
  /** Shown on a correct attempt. */
  correctFeedback: string
  /** Shown on an incorrect attempt. */
  hint: string
}

export interface LessonDefinition {
  id: string
  title: string
  order: number
  estMinutes: number
  steps: StepDefinition[]
}
