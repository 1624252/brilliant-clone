import { describe, expect, it } from 'vitest'
import { checkPracticeAnswer, parseNumericAnswer } from './answerCheck'
import { opticsPracticeProblems } from './optics'

describe('parseNumericAnswer', () => {
  it('accepts signed numbers with optional unit text', () => {
    expect(parseNumericAnswer('-10 cm')).toBe(-10)
    expect(parseNumericAnswer('15.5cm')).toBe(15.5)
    expect(parseNumericAnswer('1.2e1')).toBe(12)
  })

  it('rejects empty or non-numeric answers', () => {
    expect(parseNumericAnswer('')).toBeNull()
    expect(parseNumericAnswer('about fifteen')).toBeNull()
  })
})

describe('checkPracticeAnswer', () => {
  const problem = {
    answer: 15,
    tolerance: 0.2,
  }

  it('accepts answers within absolute tolerance', () => {
    expect(checkPracticeAnswer(problem, '15.1 cm').correct).toBe(true)
    expect(checkPracticeAnswer(problem, '14.9').correct).toBe(true)
  })

  it('rejects answers outside tolerance', () => {
    expect(checkPracticeAnswer(problem, '14.7').correct).toBe(false)
  })
})

describe('opticsPracticeProblems', () => {
  it('has unique stable ids and positive tolerances', () => {
    const ids = opticsPracticeProblems.map((problem) => problem.id)
    const calculations = opticsPracticeProblems.filter((problem) => problem.kind !== 'choice')
    expect(new Set(ids).size).toBe(ids.length)
    expect(opticsPracticeProblems.length).toBeGreaterThanOrEqual(8)
    expect(calculations.every((problem) => problem.tolerance > 0)).toBe(true)
    expect(
      opticsPracticeProblems
        .filter((problem) => problem.kind === 'choice')
        .every((problem) => problem.choices.some((choice) => choice.correct)),
    ).toBe(true)
  })

  it('covers signed virtual and inverted-image answers', () => {
    const calculations = opticsPracticeProblems.filter((problem) => problem.kind !== 'choice')
    expect(
      calculations.some((problem) => problem.id.includes('virtual') && problem.answer < 0),
    ).toBe(true)
    expect(
      calculations.some((problem) => problem.id.includes('height') && problem.answer < 0),
    ).toBe(true)
  })
})
