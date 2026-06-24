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

export interface AnswerCheck {
  correct: boolean
  parsed: number | null
  delta: number | null
}
