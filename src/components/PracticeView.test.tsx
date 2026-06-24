import { describe, expect, it, beforeEach, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { PracticeView } from './PracticeView'
import { opticsPracticeProblems } from '../content'
import { recordPracticeAttempt } from '../data/progress'
import type { ProgressState } from '../data/useProgress'

vi.mock('../data/progress', () => ({
  recordPracticeAttempt: vi.fn(async () => {}),
}))

const progress: ProgressState = {
  byLesson: {},
  byPractice: {},
  streak: null,
  practiceStats: {
    solvedCount: 0,
    totalAttempts: 0,
    totalCorrect: 0,
    questionStreak: { current: 0, longest: 0, lastAnsweredAt: null },
  },
  loading: false,
}

function renderPractice(overrides: Partial<ProgressState> = {}) {
  return render(
    <PracticeView
      uid="userA"
      progress={{ ...progress, ...overrides }}
      onBack={() => {}}
    />,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
})

describe('PracticeView', () => {
  it('shows the first problem and practice stats', () => {
    renderPractice()

    expect(screen.getByText(/ap physics ii optics practice/i)).toBeInTheDocument()
    expect(screen.getByText(opticsPracticeProblems[0].title)).toBeInTheDocument()
    expect(screen.getByText('0/10')).toBeInTheDocument()
    expect(screen.getAllByText(/question streak/i).length).toBeGreaterThan(0)
    expect(screen.getByRole('group', { name: /show on diagram/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/image distance/i)).toBeChecked()
  })

  it('shows a targeted hint and records an incorrect answer', async () => {
    renderPractice()

    fireEvent.change(screen.getByLabelText(/your answer/i), { target: { value: '12' } })
    fireEvent.click(screen.getByRole('button', { name: /check/i }))

    expect(await screen.findByText(/not quite/i)).toBeInTheDocument()
    expect(screen.getAllByText(/thin-lens equation/i).length).toBeGreaterThan(1)
    expect(recordPracticeAttempt).toHaveBeenCalledWith(
      'userA',
      opticsPracticeProblems[0].id,
      { correct: false, answer: 12 },
    )
  })

  it('accepts a correct answer, records it, and advances to the next problem', async () => {
    renderPractice()

    fireEvent.change(screen.getByLabelText(/your answer/i), { target: { value: '15 cm' } })
    fireEvent.click(screen.getByRole('button', { name: /check/i }))

    expect(await screen.findByText(/accepted answer/i)).toBeInTheDocument()
    expect(recordPracticeAttempt).toHaveBeenCalledWith(
      'userA',
      opticsPracticeProblems[0].id,
      { correct: true, answer: 15 },
    )

    fireEvent.click(screen.getByRole('button', { name: /next problem/i }))
    expect(screen.getByText(opticsPracticeProblems[1].title)).toBeInTheDocument()
  })
})
