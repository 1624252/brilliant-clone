import { describe, expect, it } from 'vitest'
import { checkPracticeAnswer, parseNumericAnswer } from './answerCheck'
import { opticsPracticeProblems, opticsPracticeTemplateIds } from './optics'

describe('parseNumericAnswer', () => {
  it('accepts signed numbers with optional unit text', () => {
    expect(parseNumericAnswer('-10 cm')).toBe(-10)
    expect(parseNumericAnswer('15.5cm')).toBe(15.5)
    expect(parseNumericAnswer('1.2e1')).toBe(12)
  })

  it('accepts slash and latex-style fractions', () => {
    expect(parseNumericAnswer('1/2')).toBe(0.5)
    expect(parseNumericAnswer('-3/4 cm')).toBe(-0.75)
    expect(parseNumericAnswer('\\frac{3}{4}')).toBe(0.75)
    expect(parseNumericAnswer('-\\frac{3}{4}')).toBe(-0.75)
    expect(parseNumericAnswer('\\frac{-3}{4}')).toBe(-0.75)
  })

  it('rejects empty or non-numeric answers', () => {
    expect(parseNumericAnswer('')).toBeNull()
    expect(parseNumericAnswer('about fifteen')).toBeNull()
    expect(parseNumericAnswer('1/0')).toBeNull()
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
    expect(checkPracticeAnswer({ answer: 0.5, tolerance: 0.001 }, '1/2').correct).toBe(true)
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
    expect(opticsPracticeProblems.length).toBeGreaterThanOrEqual(80)
    expect(opticsPracticeProblems.every((problem) => problem.hint.trim().length > 0)).toBe(true)
    expect(opticsPracticeProblems.every((problem) => problem.solution.trim().length > 0)).toBe(true)
    expect(
      opticsPracticeProblems.every((problem) => (problem.solutionSteps?.length ?? 0) >= 2),
    ).toBe(true)
    expect(calculations.every((problem) => problem.tolerance > 0)).toBe(true)
    expect(opticsPracticeProblems.every((problem) => problem.templateId)).toBe(true)
    expect(opticsPracticeProblems.every((problem) => problem.noCalculator)).toBe(true)
    expect(
      opticsPracticeProblems
        .filter((problem) => problem.kind === 'choice')
        .every((problem) => problem.choices.some((choice) => choice.correct)),
    ).toBe(true)
  })

  it('covers the short practice template families', () => {
    expect(opticsPracticeTemplateIds).toEqual(
      expect.arrayContaining([
        'convex-di',
        'convex-real-di',
        'convex-virtual-di',
        'concave-di',
        'inverted-magnification',
        'upright-magnification',
        'inverted-height',
        'upright-height',
        'find-f',
        'find-do',
        'convex-landmark',
        'concave-invariant',
      ]),
    )
    expect(new Set(opticsPracticeProblems.map((problem) => problem.category))).toEqual(
      new Set(['calculate', 'predict', 'signs']),
    )
  })

  it('keeps generated calculation answers no-calculator friendly', () => {
    const calculations = opticsPracticeProblems.filter((problem) => problem.kind !== 'choice')
    expect(
      calculations.every(
        (problem) =>
          Number.isFinite(problem.answer) &&
          Array.from({ length: 12 }, (_, i) => i + 1).some((denominator) =>
            Math.abs(problem.answer * denominator - Math.round(problem.answer * denominator)) <=
            problem.tolerance * denominator,
          ),
      ),
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
