import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { RenderResult } from '@testing-library/react'
import { ProblemRunner } from './ProblemRunner'
import { thinLensLesson } from './lessons/thinLens'
import { focusLesson } from './lessons/focus'
import { isPredictStep } from './types'
import type { LessonDefinition } from './types'
import { formImage } from '../engine'

/** Set the object-distance range input (avoids simulating SVG pointer drag). */
function setObjectDistance(container: HTMLElement, value: number) {
  const slider = container.querySelector('input[type="range"]') as HTMLInputElement
  fireEvent.change(slider, { target: { value: String(value) } })
}

/** Render a lesson and dismiss its intro screen so the steps are visible. */
function renderStarted(lesson: typeof thinLensLesson): RenderResult {
  const result = render(<ProblemRunner lesson={lesson} />)
  const start = screen.queryByRole('button', { name: /start lesson/i })
  if (start) fireEvent.click(start)
  return result
}

describe('ProblemRunner intro screen', () => {
  it('shows the intro first and starts the lesson on click', () => {
    render(<ProblemRunner lesson={thinLensLesson} />)
    expect(screen.getByText(/one equation ties it all together/i)).toBeInTheDocument()
    // Steps are hidden until the learner starts.
    expect(screen.queryByText(/step 1 of/i)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /start lesson/i }))
    expect(screen.getByText(/step 1 of 6/i)).toBeInTheDocument()
  })
})

describe('ProblemRunner (Thin Lens lesson)', () => {
  it('shows the first prompt and step counter', () => {
    renderStarted(thinLensLesson)
    expect(screen.getByText(/drag the candle/i)).toBeInTheDocument()
    expect(screen.getByText(/step 1 of 6/i)).toBeInTheDocument()
  })

  it('gives a specific hint on a wrong attempt', () => {
    const { container } = renderStarted(thinLensLesson)
    setObjectDistance(container, 60) // real but reduced, not same-size
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }))
    expect(screen.getByText(/not yet/i)).toBeInTheDocument()
    expect(screen.getByText(/twice the focal length/i)).toBeInTheDocument()
  })

  it('accepts the correct answer (object at 2f) and reveals Next', () => {
    const { container } = renderStarted(thinLensLesson)
    setObjectDistance(container, 40) // 2f for f = 20 -> m = -1
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }))
    expect(screen.getByText(/correct/i)).toBeInTheDocument()
    // "2F" is emphasized into its own element, so match the surrounding text node.
    expect(screen.getByText(/that is/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
  })

  it('advances to step 2, which accepts a virtual upright image', () => {
    const { container } = renderStarted(thinLensLesson)
    // Clear step 1.
    setObjectDistance(container, 40)
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }))
    fireEvent.click(screen.getByRole('button', { name: /next/i }))

    expect(screen.getByText(/step 2 of 6/i)).toBeInTheDocument()
    setObjectDistance(container, 10) // inside f -> virtual, upright
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }))
    expect(screen.getByText(/the lens magnifies/i)).toBeInTheDocument()
  })

  it('clears feedback when the learner changes the answer', () => {
    const { container } = renderStarted(thinLensLesson)
    setObjectDistance(container, 60)
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }))
    expect(screen.getByText(/not yet/i)).toBeInTheDocument()
    setObjectDistance(container, 55)
    expect(screen.queryByText(/not yet/i)).not.toBeInTheDocument()
  })

  it('sliding the object control to its far end snaps to infinity', () => {
    const { container } = renderStarted(thinLensLesson)
    const slider = container.querySelector('input[type="range"]') as HTMLInputElement
    // Slide all the way to the end (the visible scene edge = infinitely far).
    setObjectDistance(container, Number(slider.max))
    expect(screen.getByText(/object distance:\s*∞/i)).toBeInTheDocument()
    // The diagram switches to the "object at infinity" parallel-beam state.
    expect(screen.getByText(/object at ∞/i)).toBeInTheDocument()
  })

  it('the ∞ button sets the object infinitely far away', () => {
    renderStarted(thinLensLesson)
    fireEvent.click(screen.getByRole('button', { name: '∞' }))
    expect(screen.getByText(/object distance:\s*∞/i)).toBeInTheDocument()
    expect(screen.getByText(/object at ∞/i)).toBeInTheDocument()
  })
})

describe('Thin Lens extreme steps', () => {
  const f = 20
  // Return an interactive step by id (these extreme steps are interactive, not predict).
  const stepById = (id: string) => {
    const s = thinLensLesson.steps.find((step) => step.id === id)
    if (!s) throw new Error(`no step ${id}`)
    if (isPredictStep(s)) throw new Error(`step ${id} is not interactive`)
    return s
  }

  it('infinity step passes only when the object is infinitely far (image lands on F)', () => {
    const step = stepById('extreme-object-at-infinity')
    expect(step.success({ objectDistance: 120, focalLength: f }, formImage(120, f))).toBe(false)
    expect(
      step.success({ objectDistance: Infinity, focalLength: f }, formImage(Infinity, f)),
    ).toBe(true)
  })

  it('zero step passes when the object reaches the lens', () => {
    const step = stepById('extreme-object-at-lens')
    expect(step.success({ objectDistance: 0, focalLength: f }, formImage(0, f))).toBe(true)
    expect(step.success({ objectDistance: 30, focalLength: f }, formImage(30, f))).toBe(false)
  })
})

describe('ProblemRunner (Focusing Light lesson)', () => {
  it('accepts placing the object at the focal point', () => {
    const { container } = renderStarted(focusLesson)
    expect(screen.getByText(/step 1 of 3/i)).toBeInTheDocument()
    setObjectDistance(container, 20) // object at f -> rays leave parallel
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }))
    expect(screen.getByText(/races off to infinity/i)).toBeInTheDocument()
  })
})

describe('ProblemRunner predict-then-reveal step', () => {
  const predictLesson: LessonDefinition = {
    id: 'predict-demo',
    title: 'Predict demo',
    order: 99,
    estMinutes: 1,
    steps: [
      {
        kind: 'predict',
        id: 'p1',
        prompt: 'Where do parallel rays cross?',
        scene: { objectDistance: 12, focalLength: 20 },
        choices: [
          { id: 'wrong', label: 'They never cross', feedback: 'They do cross.' },
          { id: 'right', label: 'At the focal point', correct: true, feedback: 'Yes, at F.' },
        ],
        reveal: 'Parallel rays meet at F.',
      },
    ],
  }

  it('hides the image and Next until the learner commits, then reveals both', () => {
    render(<ProblemRunner lesson={predictLesson} />)

    // Before committing: outcome is hidden and there is no Next button.
    expect(screen.getByRole('img')).toHaveAttribute(
      'aria-label',
      expect.stringMatching(/predict where the image forms/i),
    )
    expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('radio', { name: /at the focal point/i }))

    // After committing: correct verdict, the choice-specific why, the reveal, Next.
    expect(screen.getByText(/^correct\.?$/i)).toBeInTheDocument()
    expect(screen.getByText(/yes, at f/i)).toBeInTheDocument()
    expect(screen.getByText(/parallel rays meet at f/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /finish/i })).toBeInTheDocument()
    // The diagram no longer shows the "predict" placeholder label.
    expect(screen.getByRole('img').getAttribute('aria-label')).not.toMatch(
      /predict where the image forms/i,
    )
  })

  it('marks a wrong prediction but still reveals the answer and lets you continue', () => {
    render(<ProblemRunner lesson={predictLesson} />)
    fireEvent.click(screen.getByRole('radio', { name: /never cross/i }))

    expect(screen.getByText(/not quite/i)).toBeInTheDocument()
    expect(screen.getByText(/they do cross/i)).toBeInTheDocument()
    expect(screen.getByText(/parallel rays meet at f/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /finish/i })).toBeInTheDocument()
  })
})
