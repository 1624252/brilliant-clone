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
  it('starts the convex lesson intro and accepts the object-at-0 step', () => {
    const { container } = render(<ProblemRunner lesson={focusLesson} />)
    expect(screen.getByText(/where light comes to a focus/i)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /start lesson/i }))
    expect(screen.getByText(/step 1 of 4/i)).toBeInTheDocument()

    setObjectDistance(container, focusLesson, 0)
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }))
    expect(screen.getByText(/object and image collapse onto the lens/i)).toBeInTheDocument()
  })

  it('accepts the convex focus and infinity choice steps', () => {
    const { container } = renderStarted(focusLesson, 1)
    setObjectDistance(container, focusLesson, 20)
    fireEvent.click(screen.getByRole('radio', { name: /parallel.*infinity/i }))
    expect(screen.getByText(/image is at/i)).toBeInTheDocument()

    cleanup()
    renderStarted(focusLesson, 3)
    fireEvent.click(screen.getByRole('button', { name: '∞' }))
    fireEvent.click(screen.getByRole('radio', { name: /near the.*focus/i }))
    expect(screen.getByRole('button', { name: /finish/i })).toBeInTheDocument()
  })

  it('enables infinity for the concave lesson and accepts the virtual-focus answer', () => {
    renderStarted(concaveLesson, 3)
    fireEvent.click(screen.getByRole('button', { name: '∞' }))
    fireEvent.click(screen.getByRole('radio', { name: /virtual focus/i }))
    expect(screen.getByText(/tiny/i)).toBeInTheDocument()
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
    for (const name of [/parallel ray end point/i, /chief ray end point/i, /focal ray end point/i]) {
      fireEvent.keyDown(screen.getByRole('slider', { name }), { key: 'ArrowDown' })
    }
    expect(screen.queryByText(/you found it/i)).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(screen.getByText(/you found it/i)).toBeInTheDocument()
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

  it('finishes with a direct practice option', () => {
    const onPractice = vi.fn()
    const { container } = render(
      <ProblemRunner lesson={thinLensLesson} initialStepIndex={3} onPractice={onPractice} />,
    )
    setObjectDistance(container, thinLensLesson, 60)
    fireEvent.click(screen.getByRole('button', { name: /check answer/i }))
    fireEvent.click(screen.getByRole('button', { name: /finish/i }))
    fireEvent.click(screen.getByRole('button', { name: /go to practice problems/i }))
    expect(onPractice).toHaveBeenCalledTimes(1)
  })
})
