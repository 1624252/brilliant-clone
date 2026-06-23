import { useState, type ReactNode } from 'react'
import { formImage } from '../engine'
import { LensScene } from '../interactive'
import type { MeasureFlags } from '../render'
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
  const [measures, setMeasures] = useState<MeasureFlags>({})

  function toggleMeasure(key: keyof MeasureFlags) {
    setMeasures((prev) => ({ ...prev, [key]: !prev[key] }))
  }

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
        measures={measures}
        onObjectDistanceChange={
          dragControl ? (v) => setValue('objectDistance', v) : undefined
        }
      />

      <fieldset className="measures">
        <legend>Show on diagram</legend>
        <label className="measures__opt measures__opt--f">
          <input type="checkbox" checked={!!measures.f} onChange={() => toggleMeasure('f')} />
          <span className="swatch swatch--f" />
          <b>f</b> <span className="measures__desc">focal length · lens → F</span>
        </label>
        <label className="measures__opt measures__opt--do">
          <input type="checkbox" checked={!!measures.do} onChange={() => toggleMeasure('do')} />
          <span className="swatch swatch--do" />
          <b>
            d<sub>o</sub>
          </b>{' '}
          <span className="measures__desc">object distance · candle → lens</span>
        </label>
        <label className="measures__opt measures__opt--di">
          <input type="checkbox" checked={!!measures.di} onChange={() => toggleMeasure('di')} />
          <span className="swatch swatch--di" />
          <b>
            d<sub>i</sub>
          </b>{' '}
          <span className="measures__desc">image distance · lens → image</span>
        </label>
        <label className="measures__opt measures__opt--m">
          <input type="checkbox" checked={!!measures.m} onChange={() => toggleMeasure('m')} />
          <span className="swatch swatch--m" />
          <b>m</b>{' '}
          <span className="measures__desc">heights · h₀ vs hᵢ</span>
        </label>
      </fieldset>

      <EquationPanel
        f={merged.focalLength}
        dObj={merged.objectDistance}
        dImg={image.imageDistance}
        m={image.magnification}
      />

      <div className="runner__chips">
        <span
          className="chip chip--do"
          title="Object distance: how far the candle is from the lens"
        >
          d<sub>o</sub> {fmt(merged.objectDistance)}
        </span>
        <span
          className="chip chip--di"
          title="Image distance: how far the image is from the lens (negative = same side as the candle)"
        >
          d<sub>i</sub> {fmt(image.imageDistance)}
        </span>
        <span
          className="chip chip--m"
          title="Magnification: image height ÷ object height (negative = flipped)"
        >
          m {fmt(image.magnification)}
        </span>
        <span
          className="chip chip--f"
          title="Focal length: how strongly the lens bends light"
        >
          f {fmt(merged.focalLength)}
        </span>
        <span
          className={`chip chip--${image.isReal ? 'real' : 'virtual'}`}
          title="real = light truly meets and can land on a screen; virtual = light only appears to come from there"
        >
          {describe(image)}
        </span>
      </div>

      <details className="glossary">
        <summary>What do these mean?</summary>

        <div className="glossary__group">
          <h4>Symbols</h4>
          <dl>
            <dt>
              <span className="swatch swatch--f" />f <span className="term">focal length</span>
            </dt>
            <dd>How strongly the lens bends light — the distance to the focal mark F.</dd>
            <dt>
              <span className="swatch swatch--do" />d<sub>o</sub>{' '}
              <span className="term">object distance</span>
            </dt>
            <dd>Distance from the candle to the lens.</dd>
            <dt>
              <span className="swatch swatch--di" />d<sub>i</sub>{' '}
              <span className="term">image distance</span>
            </dt>
            <dd>Distance from the image to the lens. Negative = forms on the candle’s side.</dd>
            <dt>
              <span className="swatch swatch--m" />m <span className="term">magnification</span>
            </dt>
            <dd>Image height ÷ object height (h<sub>i</sub> / h₀).</dd>
          </dl>
        </div>

        <div className="glossary__group">
          <h4>Image type</h4>
          <dl>
            <dt>real</dt>
            <dd>Light actually meets, so it can land on a screen (forms on the far side).</dd>
            <dt>virtual</dt>
            <dd>Light only appears to come from there; it can’t be projected (near side).</dd>
          </dl>
        </div>

        <div className="glossary__group">
          <h4>Orientation</h4>
          <dl>
            <dt>upright</dt>
            <dd>Same way up as the candle.</dd>
            <dt>inverted</dt>
            <dd>Flipped upside-down (m is negative).</dd>
          </dl>
        </div>

        <div className="glossary__group">
          <h4>Size</h4>
          <dl>
            <dt>enlarged</dt>
            <dd>Bigger than the candle (|m| &gt; 1).</dd>
            <dt>reduced</dt>
            <dd>Smaller than the candle (|m| &lt; 1).</dd>
            <dt>same size</dt>
            <dd>Equal to the candle (|m| = 1).</dd>
          </dl>
        </div>
      </details>

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

/** A stacked fraction: numerator over a rule over denominator. */
function Frac({ top, bottom }: { top: ReactNode; bottom: ReactNode }) {
  return (
    <span className="frac">
      <span className="frac__num">{top}</span>
      <span className="frac__den">{bottom}</span>
    </span>
  )
}

/**
 * The thin lens equation shown two ways at once: symbolic (color-coded) and with
 * the learner's current numbers plugged in, so the symbols stay tied to values.
 */
function EquationPanel({
  f,
  dObj,
  dImg,
  m,
}: {
  f: number
  dObj: number
  dImg: number
  m: number
}) {
  const one = <span className="one">1</span>
  return (
    <div className="equation" aria-hidden="true">
      <div className="equation__row">
        <Frac top={one} bottom={<span className="sym sym--f">f</span>} />
        <span className="op">=</span>
        <Frac
          top={one}
          bottom={
            <span className="sym sym--do">
              d<sub>o</sub>
            </span>
          }
        />
        <span className="op">+</span>
        <Frac
          top={one}
          bottom={
            <span className="sym sym--di">
              d<sub>i</sub>
            </span>
          }
        />
        <span className="equation__sep" />
        <span className="sym sym--m">m</span>
        <span className="op">=</span>
        <Frac
          top={
            <span className="sym sym--di">
              −d<sub>i</sub>
            </span>
          }
          bottom={
            <span className="sym sym--do">
              d<sub>o</sub>
            </span>
          }
        />
      </div>
      <div className="equation__row equation__row--values">
        <Frac top={one} bottom={<span className="sym--f">{fmt(f)}</span>} />
        <span className="op">=</span>
        <Frac top={one} bottom={<span className="sym--do">{fmt(dObj)}</span>} />
        <span className="op">+</span>
        <Frac top={one} bottom={<span className="sym--di">{fmt(dImg)}</span>} />
        <span className="equation__sep" />
        <span className="sym--m">m</span>
        <span className="op">=</span>
        <span className="sym--m">{fmt(m)}</span>
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
