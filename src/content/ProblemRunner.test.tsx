import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ProblemRunner } from './ProblemRunner'
import { thinLensLesson } from './lessons/thinLens'

/** Set the object-distance range input (avoids simulating SVG pointer drag). */
function setObjectDistance(container: HTMLElement, value: number) {
  const slider = container.querySelector('input[type="range"]') as HTMLInputElement
  fireEvent.change(slider, { target: { value: String(value) } })
}

describe('ProblemRunner (Thin Lens lesson)', () => {
  it('shows the first prompt and step counter', () => {
    render(<ProblemRunner lesson={thinLensLesson} />)
    expect(screen.getByText(/drag the candle/i)).toBeInTheDocument()
    expect(screen.getByText(/step 1 of 3/i)).toBeInTheDocument()
  })

  it('gives a specific hint on a wrong attempt', () => {
    const { container } = render(<ProblemRunner lesson={thinLensLesson} />)
    setObjectDistance(container, 60) // real but reduced, not same-size
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }))
    expect(screen.getByText(/not yet/i)).toBeInTheDocument()
    expect(screen.getByText(/twice the focal length/i)).toBeInTheDocument()
  })

  it('accepts the correct answer (object at 2f) and reveals Next', () => {
    const { container } = render(<ProblemRunner lesson={thinLensLesson} />)
    setObjectDistance(container, 40) // 2f for f = 20 -> m = -1
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }))
    expect(screen.getByText(/correct/i)).toBeInTheDocument()
    expect(screen.getByText(/that is 2f/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
  })

  it('advances to step 2, which accepts a virtual upright image', () => {
    const { container } = render(<ProblemRunner lesson={thinLensLesson} />)
    // Clear step 1.
    setObjectDistance(container, 40)
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }))
    fireEvent.click(screen.getByRole('button', { name: /next/i }))

    expect(screen.getByText(/step 2 of 3/i)).toBeInTheDocument()
    setObjectDistance(container, 10) // inside f -> virtual, upright
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }))
    expect(screen.getByText(/inside f the lens/i)).toBeInTheDocument()
  })

  it('clears feedback when the learner changes the answer', () => {
    const { container } = render(<ProblemRunner lesson={thinLensLesson} />)
    setObjectDistance(container, 60)
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }))
    expect(screen.getByText(/not yet/i)).toBeInTheDocument()
    setObjectDistance(container, 55)
    expect(screen.queryByText(/not yet/i)).not.toBeInTheDocument()
  })
})
