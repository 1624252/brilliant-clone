import type { Choice } from '../types'

export interface PracticeScene {
  objectDistance: number
  focalLength: number
  objectHeight?: number
  draggable?: boolean
}

export interface PracticeGiven {
  symbol: string
  label: string
  value: string
}

export interface EquationPart {
  id: string
  label: string
  prompt: string
  answer: number
  tolerance: number
  unit?: string
  feedback: string
}

export interface CalculationProblem {
  kind?: 'calculation'
  id: string
  title: string
  prompt: string
  givens: PracticeGiven[]
  equationParts?: EquationPart[]
  scene: PracticeScene
  answer: number
  unit: string
  tolerance: number
  solution: string
  hint: string
  measures?: {
    f?: boolean
    do?: boolean
    di?: boolean
    m?: boolean
  }
}

export interface ChoicePracticeProblem {
  kind: 'choice'
  id: string
  title: string
  prompt: string
  givens: PracticeGiven[]
  scene: PracticeScene
  choices: Choice[]
  hint: string
  solution: string
  measures?: {
    f?: boolean
    do?: boolean
    di?: boolean
    m?: boolean
  }
  draggable?: boolean
}

export type PracticeProblem = CalculationProblem | ChoicePracticeProblem

export interface AnswerCheck {
  correct: boolean
  parsed: number | null
  delta: number | null
}

export interface ChoiceAnswerCheck {
  correct: boolean
  choiceId: string | null
}
