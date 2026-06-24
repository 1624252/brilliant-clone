import type { ImageFormation } from '../engine'

// Data-driven lesson content. A lesson is a list of steps; each step is a small
// interactive problem described as data so new lessons need config, not code.

// 'curvature' is a continuous slider whose position maps logarithmically to a
// focal length (see sliderToFocalLength): the runner derives focalLength from it
// so the learner reshapes the lens (convex / flat / concave) instead of typing f.
export type ControlType = 'drag-axis' | 'slider' | 'curvature'

export interface Control {
  /** State key this control writes, e.g., "objectDistance" or "curvature". */
  key: string
  type: ControlType
  min: number
  max: number
  step?: number
  label?: string
  /** Show an "∞" button that snaps the value to Infinity (e.g., a far object). */
  allowInfinity?: boolean
  /** Values the control gently snaps to (e.g., 0, f, 2f) for easy targeting. */
  snaps?: number[]
}

/** Numeric values the learner is manipulating, keyed by control key. */
export type StepState = Record<string, number>
export type InteractiveHint = string | ((state: StepState, image: ImageFormation) => string)

interface StepBase {
  id: string
  prompt: string
}

/**
 * A hands-on step: the learner manipulates controls (drag/slider) until a
 * success rule reads true off the engine's image classification.
 */
export interface InteractiveStep extends StepBase {
  /** Discriminant; omit for interactive steps. */
  kind?: 'interactive'
  /** Optional specialized visual renderer for a concept-specific interaction. */
  visual?: 'chromatic'
  /** Values the learner can change. */
  controls: Control[]
  /** Starting values for the controls. */
  initial: StepState
  /** Values the learner cannot change (e.g., a fixed focal length). */
  fixed?: StepState
  /** True when the learner's attempt is correct. */
  success: (state: StepState, image: ImageFormation) => boolean
  /** Shown on a correct attempt. */
  correctFeedback: string
  /** Shown on an incorrect attempt. */
  hint: InteractiveHint
  /** Optional answer choices layered on top of the hands-on manipulation. */
  choices?: Choice[]
}

export interface ChoiceVisual {
  /** A small rendered diagram that makes the option visually inspectable. */
  scene: { objectDistance: number; focalLength: number; objectHeight?: number }
  showRays?: boolean
  showImage?: boolean
  caption?: string
}

/** One option in a predict-then-reveal question. */
export interface Choice {
  id: string
  label: string
  /** Optional visual option, rendered as a selectable mini ray diagram. */
  visual?: ChoiceVisual
  /** Exactly one choice should be marked correct. */
  correct?: boolean
  /** Why this option is right/wrong — shown after the learner commits. */
  feedback: string
}

/**
 * A "predict-then-reveal" step — Brilliant's signature move. The learner studies
 * a fixed scene (rays and image hidden), commits to a prediction, and only then
 * sees the rays converge and the image appear. Forcing a commitment first turns
 * passive watching into active recall and surfaces misconceptions.
 */
export interface PredictStep extends StepBase {
  kind: 'predict'
  /** The read-only scene the learner reasons about before committing. */
  scene: { objectDistance: number; focalLength: number }
  /** Options to choose from; order is preserved as shown. */
  choices: Choice[]
  /** Explanation shown once the truth is revealed (regardless of choice). */
  reveal: string
  /**
   * Optional drag control (along the axis) that becomes active after the learner
   * commits, so a predict step stays hands-on: they can move the object and watch
   * the revealed rays/image respond.
   */
  explore?: Control
}

/**
 * A "plot the rays" step: instead of choosing an answer, the learner draws the
 * three principal rays by selecting each ray and dragging its two handles until
 * the ray obeys its rule. More active than multiple choice — they construct the
 * ray diagram themselves.
 */
export interface PlotRaysStep extends StepBase {
  kind: 'plot-rays'
  /** Fixed scene the learner plots within (object distance + focal length). */
  scene: { objectDistance: number; focalLength: number; objectHeight?: number }
  /** Shown once the rays converge correctly. */
  reveal: string
  /** Optional nudge shown while the learner is still solving. */
  hint?: string
}

export type StepDefinition = InteractiveStep | PredictStep | PlotRaysStep

/** Narrowing helper: true for predict-then-reveal steps. */
export function isPredictStep(step: StepDefinition): step is PredictStep {
  return step.kind === 'predict'
}

/** Narrowing helper: true for plot-the-rays steps. */
export function isPlotStep(step: StepDefinition): step is PlotRaysStep {
  return step.kind === 'plot-rays'
}

/** Short teaching screen shown before a lesson's interactive steps. */
export interface LessonIntro {
  heading: string
  /** A few short paragraphs (kept brief; mostly-visual lessons). */
  paragraphs: string[]
  /** Optional animated explainer to show alongside the text. */
  animation?: 'focus' | 'source' | 'convex' | 'concave' | 'curvature'
}

export interface LessonDefinition {
  id: string
  title: string
  order: number
  estMinutes: number
  /** One-line description shown on the lesson card. */
  summary?: string
  /** True for not-yet-built lessons: shown on the home screen but locked. */
  placeholder?: boolean
  intro?: LessonIntro
  steps: StepDefinition[]
}
