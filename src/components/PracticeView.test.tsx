import { describe, expect, it, beforeEach, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
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

    expect(screen.getByText(/optics practice problems/i)).toBeInTheDocument()
    expect(screen.getByText(opticsPracticeProblems[0].title)).toBeInTheDocument()
    expect(screen.getByText(`0/${opticsPracticeProblems.length}`)).toBeInTheDocument()
    expect(screen.getAllByText(/question streak/i).length).toBeGreaterThan(0)
    const measures = screen.getByRole('group', { name: /show on diagram/i })
    expect(measures).toBeInTheDocument()
    expect(within(measures).getByLabelText(/image distance/i)).toBeChecked()
    const explorer = screen.getByRole('region', { name: /diagram explorer/i })
    expect(explorer).toBeInTheDocument()
    expect(within(explorer).getByRole('slider', { name: /object distance/i })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: /equation workspace/i })).toBeInTheDocument()
  })

  it('lets the learner fill equation parts before the final answer', () => {
    renderPractice()
    const workspace = screen.getByRole('region', { name: /equation workspace/i })

    fireEvent.change(within(workspace).getByLabelText(/focal length blank/i), {
      target: { value: '10' },
    })
    fireEvent.change(within(workspace).getByLabelText(/object distance blank/i), {
      target: { value: '30' },
    })
    fireEvent.change(within(workspace).getByLabelText(/image distance blank/i), {
      target: { value: '15' },
    })
    fireEvent.click(within(workspace).getByRole('button', { name: /check equation/i }))

    expect(within(workspace).getByText(/f = 10 cm/i)).toBeInTheDocument()
    expect(within(workspace).getByText(/distance from the candle/i)).toBeInTheDocument()
    expect(within(workspace).getByText('3/3')).toBeInTheDocument()
  })

  it('lets the learner explore the diagram without changing the checked answer', () => {
    renderPractice()
    const explorer = screen.getByRole('region', { name: /diagram explorer/i })
    const slider = within(explorer).getByRole('slider', {
      name: /object distance/i,
    }) as HTMLInputElement

    const initialValue = slider.value
    fireEvent.change(slider, { target: { value: '40' } })

    expect(slider.value).toBe('40')
    expect(screen.getByText(/m:/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /reset to givens/i }))
    expect(slider.value).toBe(initialValue)
  })

  it('shows a targeted hint and records an incorrect answer', async () => {
    renderPractice()

    fireEvent.change(screen.getByLabelText(/your answer/i), { target: { value: '12' } })
    fireEvent.click(screen.getByRole('button', { name: /^check$/i }))

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
    fireEvent.click(screen.getByRole('button', { name: /^check$/i }))

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
