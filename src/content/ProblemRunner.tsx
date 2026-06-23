import { useState } from 'react'
import { formImage } from '../engine'
import { LensScene } from '../interactive'
import type { Control, LessonDefinition, StepState } from './types'
import './ProblemRunner.css'

interface ProblemRunnerProps {
  lesson: LessonDefinition
  onComplete?: () => void
}

type Status = 'idle' | 'correct' | 'incorrect'

const fmt = (n: number) => (Number.isFinite(n) ? n.toFixed(1) : '\u221e')

function describe(image: ReturnType<typeof formImage>): string {
  if (image.atInfinity) return 'image at infinity'
  const kind = image.isReal ? 'real' : 'virtual'
  const size = !Number.isFinite(image.magnification)
    ? ''
    : Math.abs(image.magnification) > 1.001
      ? ', enlarged'
      : Math.abs(image.magnification) < 0.999
        ? ', reduced'
        : ', same size'
  return `${kind}, ${image.orientation}${size}`
}

export function ProblemRunner({ lesson, onComplete }: ProblemRunnerProps) {
  const [stepIndex, setStepIndex] = useState(0)
  const [values, setValues] = useState<StepState>(lesson.steps[0].initial)
  const [status, setStatus] = useState<Status>('idle')
  const [done, setDone] = useState(false)

  const step = lesson.steps[stepIndex]
  const merged: StepState = { ...step.fixed, ...values }
  const image = formImage(merged.objectDistance, merged.focalLength)

  const dragControl = step.controls.find(
    (c) => c.key === 'objectDistance' && c.type === 'drag-axis',
  )

  function setValue(key: string, value: number) {
    setValues((prev) => ({ ...prev, [key]: value }))
    setStatus('idle') // changing the answer clears stale feedback
  }

  function check() {
    setStatus(step.success(merged, image) ? 'correct' : 'incorrect')
  }

  function next() {
    if (stepIndex + 1 >= lesson.steps.length) {
      setDone(true)
      onComplete?.()
      return
    }
    const ni = stepIndex + 1
    setStepIndex(ni)
    setValues(lesson.steps[ni].initial)
    setStatus('idle')
  }

  if (done) {
    return (
      <div className="runner runner--done" role="status">
        <h2>Lesson complete</h2>
        <p>You finished “{lesson.title}”. Nice work building real intuition.</p>
      </div>
    )
  }

  return (
    <div className="runner">
      <div className="runner__progress">
        Step {stepIndex + 1} of {lesson.steps.length}
      </div>

      <p className="runner__prompt">{step.prompt}</p>

      <LensScene
        objectDistance={merged.objectDistance}
        focalLength={merged.focalLength}
        minObjectDistance={dragControl?.min}
        maxObjectDistance={dragControl?.max}
        onObjectDistanceChange={
          dragControl ? (v) => setValue('objectDistance', v) : undefined
        }
      />

      <div className="runner__chips">
        <span className="chip">
          d<sub>o</sub> {fmt(merged.objectDistance)}
        </span>
        <span className="chip">
          d<sub>i</sub> {fmt(image.imageDistance)}
        </span>
        <span className="chip">m {fmt(image.magnification)}</span>
        <span className={`chip chip--${image.isReal ? 'real' : 'virtual'}`}>
          {describe(image)}
        </span>
      </div>

      <div className="runner__controls">
        {step.controls.map((c) => (
          <SliderControl
            key={c.key}
            control={c}
            value={merged[c.key]}
            onChange={(v) => setValue(c.key, v)}
          />
        ))}
      </div>

      {status === 'correct' && (
        <div className="feedback feedback--correct" role="status">
          <strong>Correct.</strong> {step.correctFeedback}
        </div>
      )}
      {status === 'incorrect' && (
        <div className="feedback feedback--incorrect" role="status">
          <strong>Not yet.</strong> {step.hint}
        </div>
      )}

      <div className="runner__actions">
        {status === 'correct' ? (
          <button type="button" className="btn btn--primary" onClick={next}>
            {stepIndex + 1 >= lesson.steps.length ? 'Finish' : 'Next'}
          </button>
        ) : (
          <button type="button" className="btn" onClick={check}>
            Check answer
          </button>
        )}
      </div>
    </div>
  )
}

function SliderControl({
  control,
  value,
  onChange,
}: {
  control: Control
  value: number
  onChange: (v: number) => void
}) {
  return (
    <label className="slider">
      <span>
        {control.label ?? control.key}: {fmt(value)}
      </span>
      <input
        type="range"
        min={control.min}
        max={control.max}
        step={control.step ?? 1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  )
}
