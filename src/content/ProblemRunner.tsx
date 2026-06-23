import { useState, type ReactNode } from 'react'
import { formImage } from '../engine'
import { LensScene, snapValue } from '../interactive'
import {
  RayFocusExplainer,
  RaySourceExplainer,
  ConvexLensExplainer,
  type MeasureFlags,
} from '../render'
import { isPredictStep } from './types'
import { renderRich } from './richText'
import type { Choice, Control, LessonDefinition, StepDefinition, StepState } from './types'
import './ProblemRunner.css'

interface ProblemRunnerProps {
  lesson: LessonDefinition
  /** Step to resume at (from saved progress). */
  initialStepIndex?: number
  /** Called when the learner advances to a new step (for saving resume state). */
  onStepChange?: (stepIndex: number) => void
  onComplete?: () => void
}

type Status = 'idle' | 'correct' | 'incorrect'

const fmt = (n: number) => (Number.isFinite(n) ? n.toFixed(1) : '\u221e')

/** Starting control values for a step (predict steps have none to manipulate). */
const initialValues = (step: StepDefinition): StepState =>
  isPredictStep(step) ? {} : step.initial

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

export function ProblemRunner({
  lesson,
  initialStepIndex = 0,
  onStepChange,
  onComplete,
}: ProblemRunnerProps) {
  const resumeIndex = Math.min(Math.max(initialStepIndex, 0), lesson.steps.length - 1)
  // Skip the intro when resuming partway through a lesson.
  const [started, setStarted] = useState(!lesson.intro || resumeIndex > 0)
  const [stepIndex, setStepIndex] = useState(resumeIndex)
  const [values, setValues] = useState<StepState>(initialValues(lesson.steps[resumeIndex]))
  const [status, setStatus] = useState<Status>('idle')
  const [done, setDone] = useState(false)
  const [measures, setMeasures] = useState<MeasureFlags>({})
  // Predict-then-reveal state: the committed choice (null until submitted).
  const [chosenId, setChosenId] = useState<string | null>(null)

  function toggleMeasure(key: keyof MeasureFlags) {
    setMeasures((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const step = lesson.steps[stepIndex]
  const predict = isPredictStep(step)
  const committed = chosenId !== null

  // The scene to draw: from the learner's controls (interactive) or the fixed
  // predict scene. In a predict step the outcome stays hidden until they commit.
  const merged: StepState = predict ? {} : { ...step.fixed, ...values }
  const objectDistance = predict ? step.scene.objectDistance : merged.objectDistance
  const focalLength = predict ? step.scene.focalLength : merged.focalLength
  const image = formImage(objectDistance, focalLength)

  const dragControl = predict
    ? undefined
    : step.controls.find((c) => c.key === 'objectDistance' && c.type === 'drag-axis')

  // A step is "solved" (Next becomes available) when an interactive answer is
  // correct, or when a prediction has been committed (the truth is now revealed).
  const solved = predict ? committed : status === 'correct'

  function setValue(key: string, value: number) {
    setValues((prev) => ({ ...prev, [key]: value }))
    setStatus('idle') // changing the answer clears stale feedback
  }

  function check() {
    if (isPredictStep(step)) return
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
    setValues(initialValues(lesson.steps[ni]))
    setStatus('idle')
    setChosenId(null)
    onStepChange?.(ni)
  }

  if (lesson.intro && !started) {
    return (
      <div className="runner runner--intro">
        <h3 className="intro__heading">{lesson.intro.heading}</h3>
        {lesson.intro.animation === 'focus' && <RayFocusExplainer />}
        {lesson.intro.animation === 'source' && <RaySourceExplainer />}
        {lesson.intro.animation === 'convex' && <ConvexLensExplainer />}
        {lesson.intro.paragraphs.map((p, i) => (
          <p key={i} className="intro__para">
            {renderRich(p)}
          </p>
        ))}
        <div className="runner__actions">
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => setStarted(true)}
          >
            Start lesson
          </button>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="runner runner--done" role="status">
        <div className="runner__celebrate" aria-hidden="true">
          🎉
        </div>
        <h2>Lesson complete!</h2>
        <p>You finished “{lesson.title}”. Awesome work — you're really getting this! ✨</p>
      </div>
    )
  }

  return (
    <div className="runner">
      {(() => {
        const total = lesson.steps.length
        const filled = stepIndex + (solved ? 1 : 0)
        const pct = Math.round((filled / total) * 100)
        return (
          <div className="runner__progress">
            <div className="runner__progress-head">
              <span>
                Step {stepIndex + 1} of {total}
              </span>
              <span className="runner__progress-pct">{pct}%</span>
            </div>
            <div
              className="progressbar"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={pct}
              aria-label="Lesson progress"
            >
              <div className="progressbar__fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      })()}

      <p className="runner__prompt">{renderRich(step.prompt)}</p>

      <LensScene
        objectDistance={objectDistance}
        focalLength={focalLength}
        minObjectDistance={dragControl?.min}
        maxObjectDistance={dragControl?.max}
        infinityAtEdge={!!dragControl?.allowInfinity}
        snaps={dragControl?.snaps}
        measures={measures}
        showRays={predict ? committed : true}
        showImage={predict ? committed : true}
        onObjectDistanceChange={
          dragControl ? (v) => setValue('objectDistance', v) : undefined
        }
      />

      {predict ? (
        <PredictPanel
          step={step}
          chosenId={chosenId}
          onChoose={setChosenId}
          onNext={next}
          isLast={stepIndex + 1 >= lesson.steps.length}
        />
      ) : (
        <>
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
              <strong>Correct.</strong> {renderRich(step.correctFeedback)}
            </div>
          )}
          {status === 'incorrect' && (
            <div className="feedback feedback--incorrect" role="status">
              <strong>Not yet.</strong> {renderRich(step.hint)}
            </div>
          )}

          <div className="runner__actions">
            {status === 'correct' ? (
              <button type="button" className="btn btn--primary" onClick={next}>
                {stepIndex + 1 >= lesson.steps.length ? 'Finish' : 'Next'}
              </button>
            ) : (
              <button type="button" className="btn btn--primary" onClick={check}>
                Check answer
              </button>
            )}
          </div>
        </>
      )}

      {(!predict || committed) && (
      <details className="runner__more">
        <summary>Numbers &amp; tools</summary>

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
        f={focalLength}
        dObj={objectDistance}
        dImg={image.imageDistance}
        m={image.magnification}
      />

      <div className="runner__chips">
        <span
          className="chip chip--do"
          title="Object distance: how far the candle is from the lens"
        >
          d<sub>o</sub> {fmt(objectDistance)}
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
          f {fmt(focalLength)}
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
            <dd>{renderRich('Image height divided by object height: \\frac{hᵢ}{h₀}.')}</dd>
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
      </details>
      )}
    </div>
  )
}

/**
 * The predict-then-reveal control: a set of choices the learner commits to. Once
 * committed, every option shows whether it was right or wrong with a specific
 * explanation, and a Next button appears. The diagram (above) reveals the rays
 * and image at the same moment, so the prediction is checked against the truth.
 */
function PredictPanel({
  step,
  chosenId,
  onChoose,
  onNext,
  isLast,
}: {
  step: { prompt: string; choices: Choice[]; reveal: string }
  chosenId: string | null
  onChoose: (id: string) => void
  onNext: () => void
  isLast: boolean
}) {
  const committed = chosenId !== null
  const chosen = step.choices.find((c) => c.id === chosenId)
  const wasRight = !!chosen?.correct

  return (
    <div className="predict">
      <ul className="predict__choices" role="radiogroup" aria-label="Your prediction">
        {step.choices.map((c) => {
          const isChosen = c.id === chosenId
          const verdict = committed ? (c.correct ? 'correct' : isChosen ? 'wrong' : 'muted') : ''
          return (
            <li key={c.id}>
              <button
                type="button"
                role="radio"
                aria-checked={isChosen}
                disabled={committed}
                className={`predict__choice ${verdict ? `predict__choice--${verdict}` : ''} ${
                  isChosen ? 'is-chosen' : ''
                }`}
                onClick={() => onChoose(c.id)}
              >
                <span className="predict__label">{c.label}</span>
                {committed && (c.correct || isChosen) && (
                  <span className="predict__mark" aria-hidden="true">
                    {c.correct ? '✓' : '✗'}
                  </span>
                )}
              </button>
              {committed && isChosen && (
                <p className="predict__why">{renderRich(c.feedback)}</p>
              )}
            </li>
          )
        })}
      </ul>

      {committed && (
        <div
          className={`feedback feedback--${wasRight ? 'correct' : 'incorrect'}`}
          role="status"
        >
          <strong>{wasRight ? 'Correct.' : 'Not quite.'}</strong> {renderRich(step.reveal)}
        </div>
      )}

      <div className="runner__actions">
        {committed && (
          <button type="button" className="btn btn--primary" onClick={onNext}>
            {isLast ? 'Finish' : 'Next'}
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
  const isInfinite = !Number.isFinite(value)
  // A native range input can't hold Infinity, so park it at the max when infinite.
  const sliderValue = isInfinite ? control.max : value
  return (
    <label className="slider">
      <span>
        {control.label ?? control.key}: {fmt(value)}
      </span>
      <div className="slider__row">
        <input
          type="range"
          min={control.min}
          max={control.max}
          step={control.step ?? 1}
          value={sliderValue}
          list={control.snaps ? `${control.key}-snaps` : undefined}
          onChange={(e) => {
            const raw = Number(e.target.value)
            // Sliding to the far end means "infinitely far away".
            if (control.allowInfinity && raw >= control.max) {
              onChange(Infinity)
            } else {
              onChange(snapValue(raw, control.snaps))
            }
          }}
        />
        {control.snaps && (
          <datalist id={`${control.key}-snaps`}>
            {control.snaps.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        )}
        {control.allowInfinity && (
          <button
            type="button"
            className={`slider__inf ${isInfinite ? 'is-on' : ''}`}
            aria-pressed={isInfinite}
            title="Move the object infinitely far away"
            onClick={() => onChange(isInfinite ? control.max : Infinity)}
          >
            ∞
          </button>
        )}
      </div>
    </label>
  )
}
