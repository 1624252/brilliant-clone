import { describe, it, expect, vi, beforeEach } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import type { RenderResult } from '@testing-library/react'
import { ProblemRunner } from './ProblemRunner'
import { focusLesson } from './lessons/focus'
import { concaveLesson } from './lessons/concave'
import { curvatureLesson } from './lessons/curvature'
import { rayTracingLesson } from './lessons/rayTracing'
import { thinLensLesson } from './lessons/thinLens'
import { distanceToSlider } from './logDistance'
import { isPlotStep } from './types'
import type { LessonDefinition } from './types'
import { imageDistance } from '../engine'

const shippedLessons = [focusLesson, concaveLesson, curvatureLesson, rayTracingLesson, thinLensLesson]

function objectControl(lesson: LessonDefinition) {
  return lesson.steps
    .flatMap((step) => ('controls' in step ? step.controls : []))
    .find((control) => control.key === 'objectDistance')
}

function renderStarted(lesson: LessonDefinition, initialStepIndex?: number): RenderResult {
  const result = render(<ProblemRunner lesson={lesson} initialStepIndex={initialStepIndex} />)
  const start = screen.queryByRole('button', { name: /start lesson/i })
  if (start) fireEvent.click(start)
  return result
}

function setObjectDistance(container: HTMLElement, lesson: LessonDefinition, value: number) {
  const slider = container.querySelector('input[type="range"]') as HTMLInputElement
  const control = objectControl(lesson)
  fireEvent.change(slider, {
    target: { value: String(control ? distanceToSlider(value, control) : value) },
  })
}

beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
})

describe('lesson content quality', () => {
  it('keeps lesson 3 unchanged and reworks the requested lesson counts', () => {
    expect(curvatureLesson.steps.map((step) => step.id)).toEqual([
      'make-converging',
      'make-diverging',
      'make-flat',
    ])
    expect(focusLesson.steps).toHaveLength(4)
    expect(concaveLesson.steps).toHaveLength(4)
    expect(rayTracingLesson.steps).toHaveLength(4)
    expect(rayTracingLesson.steps.every(isPlotStep)).toBe(true)
    expect(thinLensLesson.steps).toHaveLength(4)
  })

  it('does not repeat exact prompts across shipped lessons', () => {
    const prompts = shippedLessons.flatMap((lesson) => lesson.steps.map((step) => step.prompt))
    expect(new Set(prompts).size).toBe(prompts.length)
  })
})

describe('ProblemRunner landmark lessons', () => {
  it('starts the convex lesson intro and creates a real image outside F', () => {
    const { container } = render(<ProblemRunner lesson={focusLesson} />)
    expect(screen.getByText(/where light comes to a focus/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /start lesson/i }))
    expect(screen.getByText(/step 1 of 4/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /check answer/i }))
    expect(screen.getByRole('status').textContent).toMatch(/solid outgoing rays.*opposite side/i)

    setObjectDistance(container, focusLesson, 30)
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }))
    expect(screen.getByRole('status').textContent).toMatch(/outside.*F/i)
  })

  it('creates convex virtual, upright, and inverted images in the right ranges', () => {
    const { container } = renderStarted(focusLesson, 1)
    setObjectDistance(container, focusLesson, 10)
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }))
    expect(screen.getByRole('status').textContent).toMatch(/same side of the lens as the object/i)

    cleanup()
    renderStarted(focusLesson, 2)
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }))
    expect(screen.getByRole('status').textContent).toMatch(/same way as the candle/i)

    cleanup()
    renderStarted(focusLesson, 3)
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }))
    expect(screen.getByRole('status').textContent).toMatch(/flipped below the axis/i)
  })

  it('lets learners go back one step without leaving the lesson', () => {
    renderStarted(focusLesson, 1)
    expect(screen.getByText(/step 2 of 4/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /previous step/i }))

    expect(screen.getByText(/step 1 of 4/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /previous step/i })).toBeDisabled()
  })

  it('keeps a solved step complete when the learner experiments afterward', () => {
    const { container } = renderStarted(focusLesson)
    setObjectDistance(container, focusLesson, 30)
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }))
    expect(screen.getByRole('button', { name: /^next$/i })).toBeInTheDocument()

    setObjectDistance(container, focusLesson, 10)

    expect(screen.getByRole('button', { name: /check answer/i })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }))
    expect(screen.getByRole('status').textContent).toMatch(/solid outgoing rays/i)
    expect(screen.getByRole('button', { name: /^next$/i })).toBeInTheDocument()
  })

  it('creates concave virtual and upright images immediately', () => {
    renderStarted(concaveLesson)
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }))
    expect(screen.getByRole('status').textContent).toMatch(/virtual.*image for every real candle/i)

    cleanup()
    renderStarted(concaveLesson, 1)
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }))
    expect(screen.getByRole('status').textContent).toMatch(/keeps the image.*upright/i)
  })

  it('uses choices to show concave real and inverted images cannot be made', () => {
    const { container } = renderStarted(concaveLesson, 2)
    fireEvent.click(screen.getByRole('radio', { name: /no real image/i }))
    expect(screen.getByRole('status').textContent).toMatch(/solid outgoing rays.*opposite side/i)

    setObjectDistance(container, concaveLesson, 60)
    fireEvent.click(screen.getByRole('radio', { name: /no real image/i }))
    expect(screen.getByRole('status').textContent).toMatch(/cannot make a.*real/i)

    cleanup()
    const inverted = renderStarted(concaveLesson, 3)
    fireEvent.click(screen.getByRole('radio', { name: /no inverted image/i }))
    expect(screen.getByRole('status').textContent).toMatch(/flips below the axis/i)

    expect(screen.getAllByRole('slider', { name: /object distance/i })[0]).toHaveAttribute(
      'aria-valuemin',
      '0',
    )
    setObjectDistance(inverted.container, concaveLesson, 0)
    fireEvent.click(screen.getByRole('radio', { name: /no inverted image/i }))
    expect(screen.getByRole('status').textContent).toMatch(/cannot make an.*inverted/i)
  })
})

describe('ProblemRunner ray tracing', () => {
  it('keeps the projector-case ray crossing visible in the plot scene', () => {
    const projectorStep = rayTracingLesson.steps.find(
      (step) => step.id === 'trace-convex-between-focus-2focus',
    )
    expect(projectorStep && 'scene' in projectorStep ? projectorStep.scene.objectDistance : 0).toBeGreaterThan(20)
    expect(projectorStep && 'scene' in projectorStep ? projectorStep.scene.objectDistance : 0).toBeLessThan(40)
    expect(
      imageDistance(
        projectorStep && 'scene' in projectorStep ? projectorStep.scene.objectDistance : 0,
        projectorStep && 'scene' in projectorStep ? projectorStep.scene.focalLength : 1,
      ),
    ).toBeLessThanOrEqual(50)
  })

  it('opens with four plot-ray steps and exposes reset rays', () => {
    renderStarted(rayTracingLesson)
    expect(screen.getByText(/step 1 of 4/i)).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /parallel ray/i })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: /parallel ray end point/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reset rays/i })).toBeInTheDocument()
    expect(screen.getAllByText(/Needed/i)).toHaveLength(3)
    expect(screen.queryByText(/Done/i)).not.toBeInTheDocument()
  })

  it('shows hints for the currently selected unmet ray rule', () => {
    renderStarted(rayTracingLesson)

    expect(
      screen.getByText(/parallel ray.*opposite side.*object/i, {
        selector: '.plot-panel__hint',
      }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('radio', { name: /chief ray/i }))
    expect(
      screen.getByText(/chief ray.*center of the lens/i, { selector: '.plot-panel__hint' }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('radio', { name: /focal ray/i }))
    expect(
      screen.getByText(/focal ray.*parallel to the optical axis/i, {
        selector: '.plot-panel__hint',
      }),
    ).toBeInTheDocument()
  })

  it('snaps ray endpoints into place and requires submit', () => {
    renderStarted(rayTracingLesson)
    for (let i = 0; i < 20; i++) {
      fireEvent.keyDown(screen.getByRole('slider', { name: /parallel ray end point/i }), {
        key: 'ArrowDown',
      })
      fireEvent.keyDown(screen.getByRole('slider', { name: /chief ray end point/i }), {
        key: 'ArrowUp',
      })
      fireEvent.keyDown(screen.getByRole('slider', { name: /focal ray end point/i }), {
        key: 'ArrowDown',
      })
    }
    expect(screen.queryByText(/you found it/i)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(screen.getByText(/you found it/i)).toBeInTheDocument()
  })

  it('does not snap from outside the requirement tolerance', () => {
    renderStarted(rayTracingLesson)
    for (let i = 0; i < 3; i++) {
      for (const name of [/parallel ray end point/i, /chief ray end point/i, /focal ray end point/i]) {
        fireEvent.keyDown(screen.getByRole('slider', { name }), { key: 'ArrowDown' })
      }
    }

    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(screen.queryByText(/you found it/i)).not.toBeInTheDocument()
    expect(screen.getByRole('status').textContent).toMatch(/not yet/i)
    expect(
      screen.getByText(/parallel ray.*opposite side.*object/i, {
        selector: '.plot-panel__hint',
      }),
    ).toBeInTheDocument()
    expect(screen.getAllByText(/Needed/i).length).toBeGreaterThan(0)
  })
})

describe('ProblemRunner step navigation', () => {
  it('can go forward only to a step the learner already reached', () => {
    const { container } = renderStarted(focusLesson, 1)
    fireEvent.click(screen.getByRole('button', { name: /previous step/i }))
    expect(screen.getByRole('button', { name: /next reached step/i })).toBeEnabled()

    fireEvent.click(screen.getByRole('button', { name: /next reached step/i }))
    expect(screen.getByText(/step 2 of 4/i)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /previous step/i }))
    setObjectDistance(container, focusLesson, 30)
    fireEvent.click(screen.getByRole('button', { name: /next reached step/i }))
    expect(screen.getByText(/step 2 of 4/i)).toBeInTheDocument()

    expect(screen.getByRole('button', { name: /next reached step/i })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: /previous step/i }))
    expect(screen.getByText(/step 1 of 4/i)).toBeInTheDocument()
  })

  it('reopens a completed lesson without resetting local step progress', () => {
    render(<ProblemRunner lesson={focusLesson} initialCompleted />)

    expect(screen.getByText(/step 1 of 4/i)).toBeInTheDocument()
    expect(screen.getByRole('progressbar', { name: /lesson progress/i })).toHaveAttribute(
      'aria-valuenow',
      '100',
    )
    expect(screen.getByRole('button', { name: /^next$/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /next reached step/i })).toBeEnabled()
  })

  it('reviewing a completed lesson keeps all steps reached', () => {
    render(<ProblemRunner lesson={focusLesson} initialStepIndex={3} />)
    setObjectDistance(document.body, focusLesson, 30)
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }))
    fireEvent.click(screen.getByRole('button', { name: /finish/i }))
    fireEvent.click(screen.getByRole('button', { name: /review lesson/i }))

    expect(screen.getByText(/step 1 of 4/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /next reached step/i })).toBeEnabled()
    expect(screen.getByRole('button', { name: /^next$/i })).toBeInTheDocument()
  })
})

describe('ProblemRunner thin lens applications', () => {
  it('shows f, d_o, and d_i by default on the first slide', () => {
    renderStarted(thinLensLesson)
    const measures = screen.getByRole('group', { name: /show on diagram/i })
    expect(measures).toBeInTheDocument()
    expect(within(measures).getByLabelText(/focal length/i)).toBeChecked()
    expect(within(measures).getByLabelText(/object distance/i)).toBeChecked()
    expect(within(measures).getByLabelText(/image distance/i)).toBeChecked()
    expect(within(measures).getByLabelText(/heights/i)).not.toBeChecked()
  })

  it('accepts d_o = 0 on the third thin-lens step', () => {
    const { container } = renderStarted(thinLensLesson, 2)
    setObjectDistance(container, thinLensLesson, 0)

    fireEvent.click(screen.getByRole('button', { name: /check answer/i }))

    expect(screen.getByRole('status').textContent).toMatch(/object and image collapse onto the lens/i)
  })

  it('finishes without a practice-problems option', () => {
    const { container } = render(
      <ProblemRunner lesson={thinLensLesson} initialStepIndex={3} />,
    )
    setObjectDistance(container, thinLensLesson, 60)
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }))
    fireEvent.click(screen.getByRole('button', { name: /finish/i }))
    expect(screen.queryByRole('button', { name: /go to practice problems/i })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /review lesson/i })).toBeInTheDocument()
  })
})
