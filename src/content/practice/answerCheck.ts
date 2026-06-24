import type { AnswerCheck, CalculationProblem, ChoiceAnswerCheck, ChoicePracticeProblem } from './types'

const SIGNED_NUMBER = String.raw`[-+]?(?:\d+\.?\d*|\.\d+)`

function finiteRatio(numerator: number, denominator: number): number | null {
  if (!Number.isFinite(numerator) || !Number.isFinite(denominator) || denominator === 0) {
    return null
  }
  const parsed = numerator / denominator
  return Number.isFinite(parsed) ? parsed : null
}

/** Parse the leading numeric or fractional value from a typed practice answer. */
export function parseNumericAnswer(raw: string): number | null {
  const cleaned = raw.trim().replace(',', '')
  if (!cleaned) return null

  const latexFraction = cleaned.match(
    new RegExp(String.raw`^([-+]?)\\frac\{\s*(${SIGNED_NUMBER})\s*\}\{\s*(${SIGNED_NUMBER})\s*\}`),
  )
  if (latexFraction) {
    const sign = latexFraction[1] === '-' ? -1 : 1
    return finiteRatio(sign * Number(latexFraction[2]), Number(latexFraction[3]))
  }

  const slashFraction = cleaned.match(new RegExp(String.raw`^(${SIGNED_NUMBER})\s*/\s*(${SIGNED_NUMBER})`))
  if (slashFraction) {
    return finiteRatio(Number(slashFraction[1]), Number(slashFraction[2]))
  }

  const decimal = cleaned.match(/^[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?/i)
  if (!decimal) return null
  const parsed = Number(decimal[0])
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
