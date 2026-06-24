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
    expect(screen.getByRole('status').textContent).toMatch(/inside.*F/i)

    setObjectDistance(container, focusLesson, 30)
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }))
    expect(screen.getByRole('status').textContent).toMatch(/outside.*F/i)
  })

  it('creates convex virtual, upright, and inverted images in the right ranges', () => {
    const { container } = renderStarted(focusLesson, 1)
    setObjectDistance(container, focusLesson, 10)
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }))
    expect(screen.getByRole('status').textContent).toMatch(/inside.*F/i)

    cleanup()
    const upright = renderStarted(focusLesson, 2)
    setObjectDistance(upright.container, focusLesson, 10)
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }))
    expect(screen.getByRole('status').textContent).toMatch(/upright.*image happens/i)

    cleanup()
    const inverted = renderStarted(focusLesson, 3)
    setObjectDistance(inverted.container, focusLesson, 30)
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }))
    expect(screen.getByRole('status').textContent).toMatch(/outside.*F/i)
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
    setObjectDistance(container, concaveLesson, 60)
    fireEvent.click(screen.getByRole('radio', { name: /no real image/i }))
    expect(screen.getByRole('status').textContent).toMatch(/cannot make a.*real/i)

    cleanup()
    const inverted = renderStarted(concaveLesson, 3)
    setObjectDistance(inverted.container, concaveLesson, 10)
    fireEvent.click(screen.getByRole('radio', { name: /no inverted image/i }))
    expect(screen.getByRole('status').textContent).toMatch(/cannot make an.*inverted/i)
  })
})

describe('ProblemRunner ray tracing', () => {
  it('opens with four plot-ray steps and exposes reset rays', () => {
    renderStarted(rayTracingLesson)
    expect(screen.getByText(/step 1 of 4/i)).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: /parallel ray/i })).toBeInTheDocument()
    expect(screen.getByRole('slider', { name: /parallel ray end point/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /reset rays/i })).toBeInTheDocument()
  })

  it('snaps ray endpoints into place and requires submit', () => {
    renderStarted(rayTracingLesson)
    for (let i = 0; i < 4; i++) {
      for (const name of [/parallel ray end point/i, /chief ray end point/i, /focal ray end point/i]) {
        fireEvent.keyDown(screen.getByRole('slider', { name }), { key: 'ArrowDown' })
      }
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
    expect(screen.getAllByText(/Needed/i).length).toBeGreaterThan(0)
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
