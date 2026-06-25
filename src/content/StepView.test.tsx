import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { StepView } from './StepView'
import type { InteractiveStep, PredictStep } from './types'

beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
})

const predictStep: PredictStep = {
  kind: 'predict',
  id: 'p1',
  prompt: 'What image forms?',
  scene: { objectDistance: 10, focalLength: 20 },
  choices: [
    { id: 'real', label: 'Real image', feedback: 'no' },
    { id: 'virtual', label: 'Virtual image', correct: true, feedback: 'yes' },
  ],
  reveal: 'Inside F it is virtual.',
}

const interactiveStep: InteractiveStep = {
  id: 'i1',
  prompt: 'Make it real',
  controls: [
    {
      key: 'objectDistance',
      type: 'drag-axis',
      min: 5,
      max: 80,
      step: 0.01,
      allowInfinity: true,
    },
  ],
  fixed: { focalLength: 20 },
  initial: { objectDistance: 10 },
  success: (_state, image) => image.isReal,
  correctFeedback: 'Real image made.',
  hint: 'Move outside F.',
}

describe('StepView practice API', () => {
  it('reports attempts and reveals the custom advance button on a predict step', () => {
    const onAttempt = vi.fn()
    const onNext = vi.fn()
    render(
      <StepView step={predictStep} nextLabel="Next question" onNext={onNext} onAttempt={onAttempt} />,
    )

    // A wrong pick records an incorrect attempt and does not advance yet.
    fireEvent.click(screen.getByRole('radio', { name: /real image/i }))
    expect(onAttempt).toHaveBeenLastCalledWith(false)
    expect(screen.queryByRole('button', { name: /next question/i })).not.toBeInTheDocument()

    // The correct pick records a correct attempt and shows the advance button.
    fireEvent.click(screen.getByRole('radio', { name: /virtual image/i }))
    expect(onAttempt).toHaveBeenLastCalledWith(true)
    const next = screen.getByRole('button', { name: /next question/i })
    fireEvent.click(next)
    expect(onNext).toHaveBeenCalledTimes(1)
  })

  it('records the check result on an interactive step', () => {
    const onAttempt = vi.fn()
    render(<StepView step={interactiveStep} nextLabel="Next question" onNext={() => {}} onAttempt={onAttempt} />)

    // Starts inside F (virtual); checking now is incorrect.
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }))
    expect(onAttempt).toHaveBeenLastCalledWith(false)
    expect(screen.queryByRole('button', { name: /next question/i })).not.toBeInTheDocument()
  })

  it('updates interactive hints only when checking an answer', () => {
    const dynamicHintStep: InteractiveStep = {
      ...interactiveStep,
      success: () => false,
      hint: (state) => (state.objectDistance < 20 ? 'Move farther away.' : 'Move closer.'),
    }
    render(<StepView step={dynamicHintStep} nextLabel="Next question" onNext={() => {}} />)

    fireEvent.click(screen.getByRole('button', { name: /check answer/i }))
    expect(screen.getByText(/move farther away/i)).toBeInTheDocument()

    const range = screen
      .getAllByRole('slider')
      .find((el): el is HTMLInputElement => el instanceof HTMLInputElement)
    expect(range).toBeDefined()
    fireEvent.change(range!, { target: { value: '30' } })

    expect(screen.getByText(/move farther away/i)).toBeInTheDocument()
    expect(screen.queryByText(/move closer/i)).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /check answer/i }))
    expect(screen.getByText(/move closer/i)).toBeInTheDocument()
  })
})
