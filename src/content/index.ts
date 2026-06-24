export { ProblemRunner } from './ProblemRunner'
export { opticsPracticeProblems, checkPracticeAnswer, parseNumericAnswer } from './practice'
export { thinLensLesson } from './lessons/thinLens'
export { focusLesson } from './lessons/focus'
export { lessons, chapter } from './lessons'
export { topics, type Topic } from './topics'
export { isPredictStep, isPlotStep } from './types'
export type {
  LessonDefinition,
  LessonIntro,
  StepDefinition,
  InteractiveStep,
  PredictStep,
  PlotRaysStep,
  Choice,
  Control,
  ControlType,
  StepState,
} from './types'
export type {
  AnswerCheck,
  CalculationProblem,
  PracticeGiven,
  PracticeScene,
} from './practice'
