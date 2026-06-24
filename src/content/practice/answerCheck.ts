import type { AnswerCheck, CalculationProblem, ChoiceAnswerCheck, ChoicePracticeProblem } from './types'

/** Parse the leading numeric value from a typed practice answer. */
export function parseNumericAnswer(raw: string): number | null {
  const cleaned = raw.trim().replace(',', '')
  if (!cleaned) return null
  const match = cleaned.match(/^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/i)
  if (!match) return null
  const parsed = Number(match[0])
  return Number.isFinite(parsed) ? parsed : null
}

/** Check a typed numeric answer against the problem's absolute tolerance. */
export function checkPracticeAnswer(
  problem: Pick<CalculationProblem, 'answer' | 'tolerance'>,
  raw: string,
): AnswerCheck {
  const parsed = parseNumericAnswer(raw)
  if (parsed === null) return { correct: false, parsed: null, delta: null }
  const delta = Math.abs(parsed - problem.answer)
  return { correct: delta <= problem.tolerance, parsed, delta }
}

/** Check a selected multiple-choice practice answer. */
export function checkPracticeChoice(
  problem: Pick<ChoicePracticeProblem, 'choices'>,
  choiceId: string | null,
): ChoiceAnswerCheck {
  const choice = problem.choices.find((c) => c.id === choiceId)
  return { correct: choice?.correct === true, choiceId }
}
