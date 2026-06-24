import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import type { RenderResult } from '@testing-library/react'
import { ProblemRunner } from './ProblemRunner'
import { thinLensLesson } from './lessons/thinLens'
import { focusLesson } from './lessons/focus'
import { concaveLesson } from './lessons/concave'
import { curvatureLesson } from './lessons/curvature'
import { rayTracingLesson } from './lessons/rayTracing'
import { isPredictStep, isPlotStep } from './types'
import type { LessonDefinition } from './types'
import { distanceToSlider } from './logDistance'
import { formImage } from '../engine'

const shippedLessons = [focusLesson, concaveLesson, curvatureLesson, rayTracingLesson, thinLensLesson]

/** Set the object-distance range input (avoids simulating SVG pointer drag). */
function setObjectDistance(container: HTMLElement, value: number) {
  const slider = container.querySelector('input[type="range"]') as HTMLInputElement
  const hasInfinityControl = Boolean(container.querySelector('.slider__inf'))
  const control = thinLensLesson.steps
    .flatMap((step) => ('controls' in step ? step.controls : []))
    .find((c) => c.key === 'objectDistance')
  fireEvent.change(slider, {
    target: {
      value: String(hasInfinityControl && control ? distanceToSlider(value, control) : value),
    },
  })
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
    expect(screen.getByText(/step 1 of 7/i)).toBeInTheDocument()
  })
})

describe('lesson content quality', () => {
  it('does not repeat exact prompts across shipped lessons', () => {
    const prompts = shippedLessons.flatMap((lesson) => lesson.steps.map((step) => step.prompt))
    expect(new Set(prompts).size).toBe(prompts.length)
  })

  it('keeps every predict step visual or hands-on and has one correct answer', () => {
    for (const lesson of shippedLessons) {
      for (const step of lesson.steps) {
        if (!isPredictStep(step)) continue
        expect(step.choices.filter((choice) => choice.correct)).toHaveLength(1)
        expect(step.explore || step.choices.every((choice) => choice.visual)).toBeTruthy()
      }
    }
  })
})

describe('ProblemRunner (Thin Lens lesson)', () => {
  it('shows the first prompt and step counter', () => {
    renderStarted(thinLensLesson)
    expect(screen.getByText(/drag the candle/i)).toBeInTheDocument()
    expect(screen.getByText(/step 1 of 7/i)).toBeInTheDocument()
  })

  it('gives a specific hint on a wrong attempt', () => {
    const { container } = renderStarted(thinLensLesson)
    setObjectDistance(container, 60) // real but reduced, not same-size
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }))
    expect(screen.getByText(/not yet/i)).toBeInTheDocument()
    expect(screen.getByText(/too small/i)).toBeInTheDocument()
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

  it('accepts a virtual upright image on the magnifier step', () => {
    const { container } = render(<ProblemRunner lesson={thinLensLesson} initialStepIndex={2} />)

    expect(screen.getByText(/step 3 of 7/i)).toBeInTheDocument()
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
    fireEvent.change(slider, { target: { value: slider.max } })
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

  it('step 6 plots the virtual image by tracing rays backward', () => {
    render(<ProblemRunner lesson={thinLensLesson} initialStepIndex={6} />)
    expect(screen.getByText(/step 7 of 7/i)).toBeInTheDocument()
    expect(screen.getByText(/draw the rays and their back-traces/i)).toBeInTheDocument()

    for (let i = 0; i < 7; i++) {
      fireEvent.keyDown(screen.getByRole('slider', { name: /parallel ray end point/i }), {
        key: 'ArrowDown',
      })
      fireEvent.keyDown(screen.getByRole('slider', { name: /chief ray end point/i }), {
        key: 'ArrowDown',
      })
      fireEvent.keyDown(screen.getByRole('slider', { name: /focal ray end point/i }), {
        key: 'ArrowDown',
      })
    }

    expect(screen.queryByText(/you found it/i)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))

    expect(screen.getByText(/you found it/i)).toBeInTheDocument()
    expect(screen.getByText(/magnifying glass/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /finish/i })).toBeInTheDocument()
  })
})

describe('Thin Lens extreme steps', () => {
  const f = 20
  // Return an interactive step by id (Extreme 2 remains interactive).
  const stepById = (id: string) => {
    const s = thinLensLesson.steps.find((step) => step.id === id)
    if (!s) throw new Error(`no step ${id}`)
    if (isPredictStep(s) || isPlotStep(s)) throw new Error(`step ${id} is not interactive`)
    return s
  }

  it('infinity step uses multiple choice and reveals that the image lands on F', () => {
    const s = thinLensLesson.steps.find((step) => step.id === 'extreme-object-at-infinity')
    if (!s || !isPredictStep(s)) throw new Error('extreme 1 should be a predict step')
    expect(s.scene.objectDistance).toBe(Infinity)
    expect(s.choices.map((choice) => choice.label)).toEqual([
      'The image collapses onto F',
      'The image stays at 2F',
      'No image appears',
    ])
    expect(s.choices.find((choice) => choice.correct)?.id).toBe('at-f')
    expect(s.choices.every((choice) => choice.visual)).toBe(true)
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

describe('ProblemRunner (Concave Lenses lesson)', () => {
  it('reveals the virtual, upright, smaller answer after a prediction', () => {
    renderStarted(concaveLesson)
    expect(screen.getByText(/virtual reduced image/i)).toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('radio', { name: /virtual, upright, and smaller/i }),
    )
    expect(
      screen.getByText(/a concave lens always makes a virtual, upright, reduced/i),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
  })

  it('passes the "try to make a real image" step when the candle is near the lens', () => {
    const { container } = render(<ProblemRunner lesson={concaveLesson} initialStepIndex={2} />)

    expect(screen.getByText(/step 3 of 4/i)).toBeInTheDocument()
    setObjectDistance(container, 4) // up close — still no real image
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }))
    expect(screen.getByText(/can.t focus light to a real point/i)).toBeInTheDocument()
  })

  it('keeps the predict step interactive: a drag handle appears after committing', () => {
    renderStarted(concaveLesson)
    // No draggable object handle before committing the prediction.
    expect(
      screen.queryByRole('slider', { name: /object distance/i }),
    ).not.toBeInTheDocument()
    fireEvent.click(
      screen.getByRole('radio', { name: /virtual, upright, and smaller/i }),
    )
    // The explore handle (a draggable SVG slider) is now available.
    expect(
      screen.getByRole('slider', { name: /object distance/i }),
    ).toBeInTheDocument()
  })

  it('passes the half-size step when the candle sits one focal length away', () => {
    const { container } = render(<ProblemRunner lesson={concaveLesson} initialStepIndex={3} />)

    expect(screen.getByText(/step 4 of 4/i)).toBeInTheDocument()
    setObjectDistance(container, 20) // one focal length -> m = 0.5
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }))
    expect(screen.getByText(/at one focal length away/i)).toBeInTheDocument()
  })
})

describe('ProblemRunner (Convex & Concave curvature lesson)', () => {
  /** Move the curvature slider (the lesson's only range control). */
  function setCurvature(container: HTMLElement, value: number) {
    const slider = container.querySelector('input[type="range"]') as HTMLInputElement
    fireEvent.change(slider, { target: { value: String(value) } })
  }

  it('accepts a positive curvature as a converging lens', () => {
    const { container } = renderStarted(curvatureLesson)
    expect(screen.getByText(/step 1 of 3/i)).toBeInTheDocument()
    setCurvature(container, 1) // far right of the continuous slider -> convex
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }))
    expect(screen.getByText(/positive focal length/i)).toBeInTheDocument()
  })

  it('reads out the resulting lens as the curvature slider moves', () => {
    const { container } = renderStarted(curvatureLesson)
    setCurvature(container, 1)
    expect(screen.getByText(/convex · f =/i)).toBeInTheDocument()
    setCurvature(container, -1)
    expect(screen.getByText(/concave · f =/i)).toBeInTheDocument()
    setCurvature(container, 0)
    expect(screen.getByText(/flat — no focusing/i)).toBeInTheDocument()
  })

  it('shows the diagram as flat when curvature is centered', () => {
    const { container } = renderStarted(curvatureLesson)
    setCurvature(container, 0)
    expect(screen.getByText(/flat \(no focusing\)/i)).toBeInTheDocument()
  })
})

describe('ProblemRunner (Ray Tracing lesson)', () => {
  it('opens with the interactive draw-the-rays step and its rule checklist', () => {
    renderStarted(rayTracingLesson)
    expect(screen.getByText(/draw each principal ray/i)).toBeInTheDocument()
    // The three ray-rule badges and draggable endpoint handles are present.
    expect(screen.getByRole('radio', { name: /parallel ray/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /chief ray/i })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /focal ray/i })).toBeInTheDocument()
    expect(
      screen.getByRole('slider', { name: /parallel ray end point/i }),
    ).toBeInTheDocument()
    // No Next yet — the rays must be plotted first.
    expect(screen.queryByRole('button', { name: /next|finish/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument()
  })

  it('requires submit after drawing all three rays onto their rules', () => {
    renderStarted(rayTracingLesson)
    for (let i = 0; i < 7; i++) {
      fireEvent.keyDown(screen.getByRole('slider', { name: /parallel ray end point/i }), {
        key: 'ArrowDown',
      })
      fireEvent.keyDown(screen.getByRole('slider', { name: /chief ray end point/i }), {
        key: 'ArrowDown',
      })
      fireEvent.keyDown(screen.getByRole('slider', { name: /focal ray end point/i }), {
        key: 'ArrowDown',
      })
    }

    expect(screen.queryByText(/you found it/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /next/i })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))

    expect(screen.getByText(/you found it/i)).toBeInTheDocument()
    expect(
      screen.getByText(/exactly where an object beyond 2f focuses/i),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
  })

  it('passes the crossing step when the image lands beyond 2F', () => {
    // Jump straight to step 2 (the first drag step) via saved-progress resume.
    const { container } = render(
      <ProblemRunner lesson={rayTracingLesson} initialStepIndex={1} />,
    )
    expect(screen.getByText(/step 2 of 3/i)).toBeInTheDocument()
    setObjectDistance(container, 30) // between F and 2F -> image beyond 2F
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }))
    expect(screen.getByText(/a projector/i)).toBeInTheDocument()
  })

  it('passes the inside-F step with a virtual, enlarged image', () => {
    const { container } = render(
      <ProblemRunner lesson={rayTracingLesson} initialStepIndex={2} />,
    )
    expect(screen.getByText(/step 3 of 3/i)).toBeInTheDocument()
    setObjectDistance(container, 12) // inside F -> virtual, upright, enlarged
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }))
    expect(screen.getByText(/spread apart/i)).toBeInTheDocument()
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

  it('explains a wrong prediction and lets you try again, then reveals on the right answer', () => {
    render(<ProblemRunner lesson={predictLesson} />)
    fireEvent.click(screen.getByRole('radio', { name: /never cross/i }))

    // Wrong: explain why and invite another try — no reveal or Finish yet.
    expect(screen.getByText(/not quite — try again/i)).toBeInTheDocument()
    expect(screen.getByText(/they do cross/i)).toBeInTheDocument()
    expect(screen.queryByText(/parallel rays meet at f/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /finish/i })).not.toBeInTheDocument()

    // Choices stay selectable; the correct one then reveals the answer.
    fireEvent.click(screen.getByRole('radio', { name: /at the focal point/i }))
    expect(screen.getByText(/^correct\.?$/i)).toBeInTheDocument()
    expect(screen.getByText(/parallel rays meet at f/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /finish/i })).toBeInTheDocument()
  })

  it('offers next-lesson, review, and exit actions on the finish screen', () => {
    const onExit = vi.fn()
    const onNextLesson = vi.fn()
    render(
      <ProblemRunner
        lesson={predictLesson}
        onExit={onExit}
        onNextLesson={onNextLesson}
        nextLessonTitle="Concave Lenses"
      />,
    )
    fireEvent.click(screen.getByRole('radio', { name: /at the focal point/i }))
    fireEvent.click(screen.getByRole('button', { name: /finish/i }))

    expect(screen.getByText(/lesson complete/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /next lesson/i }))
    expect(onNextLesson).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: /back to roadmap/i }))
    expect(onExit).toHaveBeenCalledTimes(1)

    // Review restarts the lesson from the first step.
    fireEvent.click(screen.getByRole('button', { name: /review lesson/i }))
    expect(screen.getByText(/where do parallel rays cross/i)).toBeInTheDocument()
  })
})
