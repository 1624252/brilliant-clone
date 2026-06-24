import { useEffect, useState, type ReactNode } from 'react'
import { formImage, sliderToFocalLength } from '../engine'
import { DrawRaysScene, LensScene, snapValue } from '../interactive'
import { LensDiagram, type MeasureFlags, type SceneParams } from '../render'
import { isPredictStep, isPlotStep } from './types'
import { renderRich } from './richText'
import type { Choice, Control, StepDefinition, StepState } from './types'
import { distanceToSlider, sliderToDistance, usesLogDistance } from './logDistance'

// A single interactive step, rendered identically for lessons (via ProblemRunner)
// and for practice (via PracticeView). It owns all per-step state; mount it with
// a `key` that changes per step/question so state resets cleanly between steps.

const fmt = (n: number) => (Number.isFinite(n) ? n.toFixed(1) : '\u221e')

function hintText(step: StepDefinition, state: StepState, image: ReturnType<typeof formImage>) {
  if (isPredictStep(step) || isPlotStep(step)) return ''
  return typeof step.hint === 'function' ? step.hint(state, image) : step.hint
}

/** Readout for a curvature control: the resulting lens type and focal length. */
function curvatureReadout(control: Control, value: number): string | null {
  if (control.type !== 'curvature') return null
  const f = sliderToFocalLength(value)
  if (!Number.isFinite(f)) return 'Flat'
  return f > 0 ? `Convex \u00b7 f = ${fmt(f)}` : `Concave \u00b7 f = ${fmt(Math.abs(f))}`
}

/** Starting control values for a step (predict/plot steps have none to set). */
const initialValues = (step: StepDefinition): StepState =>
  isPredictStep(step) || isPlotStep(step) ? {} : step.initial

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

type Status = 'idle' | 'correct' | 'incorrect'

export interface StepViewProps {
  step: StepDefinition
  /** True when this step was already completed before this mount (resume/replay). */
  stepAlreadyCompleted?: boolean
  /** Label for the advance button shown once the step is solved. */
  nextLabel: string
  onNext: () => void
  /** Notifies the parent whenever the solved state changes. */
  onSolvedChange?: (solved: boolean) => void
  /** Fires on each check/submit/choice with whether the attempt was correct. */
  onAttempt?: (correct: boolean) => void
  /** Render the equation tools featured (thin-lens style). */
  featureNumbersTools?: boolean
  /** Show the prompt next to the action area (thin-lens layout). */
  promptNearAction?: boolean
  /** Initial diagram measurement flags. */
  initialMeasures?: MeasureFlags
  /** Optional fitted scene so far objects/images stay on-screen (practice). */
  scene?: SceneParams
}

export function StepView({
  step,
  stepAlreadyCompleted = false,
  nextLabel,
  onNext,
  onSolvedChange,
  onAttempt,
  featureNumbersTools = false,
  promptNearAction = false,
  initialMeasures = {},
  scene,
}: StepViewProps) {
  const [values, setValues] = useState<StepState>(() => initialValues(step))
  const [status, setStatus] = useState<Status>('idle')
  const [measures, setMeasures] = useState<MeasureFlags>(initialMeasures)
  const [chosenId, setChosenId] = useState<string | null>(null)
  const [plotReady, setPlotReady] = useState(false)
  const [plotHint, setPlotHint] = useState('')
  const [plotResetKey, setPlotResetKey] = useState(0)

  function toggleMeasure(key: keyof MeasureFlags) {
    setMeasures((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const predict = isPredictStep(step)
  const plot = isPlotStep(step)
  const chosenChoice = isPredictStep(step) ? step.choices.find((c) => c.id === chosenId) : undefined
  const interactiveChoice =
    !predict && !plot && step.choices ? step.choices.find((c) => c.id === chosenId) : undefined
  const committed = !!chosenChoice?.correct || (predict && stepAlreadyCompleted)

  const merged: StepState = predict || plot ? {} : { ...step.fixed, ...values }
  const objectDistance = predict
    ? values.objectDistance ?? step.scene.objectDistance
    : plot
      ? step.scene.objectDistance
      : merged.objectDistance
  const focalLength = predict
    ? step.scene.focalLength
    : plot
      ? step.scene.focalLength
      : 'curvature' in merged
        ? sliderToFocalLength(merged.curvature)
        : merged.focalLength ?? 20
  const image = formImage(objectDistance, focalLength)

  const dragControl = predict
    ? committed
      ? step.explore
      : undefined
    : plot
      ? undefined
      : step.controls.find((c) => c.key === 'objectDistance' && c.type === 'drag-axis')

  const instantInteractiveChoice = !!interactiveChoice
  const interactiveAtTarget =
    !predict && !plot && instantInteractiveChoice && step.success(merged, image)
  const currentSolved = predict
    ? committed
    : instantInteractiveChoice
      ? interactiveChoice.correct === true && interactiveAtTarget
      : status === 'correct'
  const solved = stepAlreadyCompleted || currentSolved
  const showNumbersTools = (!predict && !plot) || committed || (plot && solved)
  const promptBlock = (
    <p className={`runner__prompt ${promptNearAction ? 'runner__prompt--near-action' : ''}`}>
      {renderRich(step.prompt)}
    </p>
  )

  useEffect(() => {
    onSolvedChange?.(solved)
  }, [solved, onSolvedChange])

  function setValue(key: string, value: number) {
    setValues((prev) => ({ ...prev, [key]: value }))
    setStatus((prev) => (prev === 'correct' ? 'idle' : prev))
  }

  function check() {
    if (isPredictStep(step) || isPlotStep(step)) return
    const ok = step.success(merged, image)
    setStatus(ok ? 'correct' : 'incorrect')
    onAttempt?.(ok)
  }

  function chooseInteractive(id: string) {
    if (isPredictStep(step) || isPlotStep(step) || !step.choices) return
    const choice = step.choices.find((c) => c.id === id)
    const ok = !!(choice?.correct && step.success(merged, image))
    setChosenId(id)
    setStatus(ok ? 'correct' : 'incorrect')
    onAttempt?.(ok)
  }

  function choosePredict(id: string) {
    if (!isPredictStep(step)) return
    const choice = step.choices.find((c) => c.id === id)
    setChosenId(id)
    onAttempt?.(!!choice?.correct)
  }

  function submitPlot() {
    if (!isPlotStep(step)) return
    setStatus(plotReady ? 'correct' : 'incorrect')
    onAttempt?.(plotReady)
  }

  function resetPlot() {
    setStatus('idle')
    setPlotReady(false)
    setPlotHint('')
    setPlotResetKey((key) => key + 1)
  }

  return (
    <>
      {!promptNearAction && promptBlock}

      {plot ? (
        <DrawRaysScene
          scene={step.scene}
          solved={currentSolved && !stepAlreadyCompleted}
          onReadyChange={(ready) => setPlotReady(ready)}
          onHintChange={setPlotHint}
          measures={measures}
          resetKey={plotResetKey}
          plotHalfWidth={step.plotHalfWidth}
        />
      ) : (
        <LensScene
          objectDistance={objectDistance}
          focalLength={focalLength}
          scene={scene}
          minObjectDistance={dragControl?.min}
          maxObjectDistance={dragControl?.max}
          infinityAtEdge={!!dragControl?.allowInfinity}
          snaps={dragControl?.snaps}
          measures={measures}
          equation={
            featureNumbersTools
              ? {
                  f: focalLength,
                  dObj: objectDistance,
                  dImg: image.imageDistance,
                  m: image.magnification,
                }
              : undefined
          }
          showRays={predict ? committed : true}
          showImage={predict ? committed : true}
          onObjectDistanceChange={dragControl ? (v) => setValue('objectDistance', v) : undefined}
        />
      )}

      {plot ? (
        <div className="plot-panel">
          {promptNearAction && promptBlock}
          {status === 'incorrect' ? (
            <div className="feedback feedback--incorrect feedback--pop" role="status">
              <strong>Not yet.</strong>{' '}
              {renderRich(
                plotHint ||
                  'A ray still breaks its rule. Adjust the endpoints until every requirement below is marked **Done**.',
              )}
            </div>
          ) : currentSolved ? (
            <div className="feedback feedback--correct" role="status">
              <strong>You found it.</strong> {renderRich(step.reveal)}
            </div>
          ) : (
            <p className="plot-panel__hint">
              {renderRich(
                plotHint ||
                  (step.hint ??
                    'Drag each **ray endpoint** so every ray follows its rule and the requirements are marked **Done**.'),
              )}
            </p>
          )}
          <div className="runner__actions">
            {!currentSolved && (
              <>
                <button type="button" className="btn btn--primary" onClick={submitPlot}>
                  Submit
                </button>
                <button type="button" className="btn" onClick={resetPlot}>
                  Reset rays
                </button>
              </>
            )}
            {solved && (
              <button type="button" className="btn btn--next" onClick={onNext}>
                {nextLabel}
              </button>
            )}
          </div>
        </div>
      ) : predict ? (
        <PredictPanel
          step={step}
          prompt={promptNearAction ? promptBlock : undefined}
          chosenId={chosenId}
          solved={committed}
          canExplore={committed && !!step.explore}
          onChoose={choosePredict}
          onNext={onNext}
          nextLabel={nextLabel}
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

          {step.choices && (
            <InteractiveChoices
              choices={step.choices}
              chosenId={chosenId}
              solved={currentSolved && !stepAlreadyCompleted}
              onChoose={chooseInteractive}
            />
          )}

          {currentSolved && status !== 'incorrect' && (
            <div className="feedback feedback--correct" role="status">
              <strong>Correct.</strong> {renderRich(step.correctFeedback)}
            </div>
          )}
          {status === 'incorrect' && (
            <div className="feedback feedback--incorrect" role="status">
              <strong>Not yet.</strong>{' '}
              {interactiveChoice && !interactiveChoice.correct
                ? renderRich(interactiveChoice.feedback)
                : renderRich(hintText(step, merged, image))}
            </div>
          )}

          {promptNearAction && promptBlock}

          <div className="runner__actions">
            {!currentSolved && !step.choices && (
              <button type="button" className="btn btn--primary" onClick={check}>
                Check answer
              </button>
            )}
            {solved && (
              <button type="button" className="btn btn--next" onClick={onNext}>
                {nextLabel}
              </button>
            )}
          </div>

          {featureNumbersTools && showNumbersTools && (
            <NumbersTools
              featured
              measures={measures}
              onToggleMeasure={toggleMeasure}
              focalLength={focalLength}
              objectDistance={objectDistance}
              image={image}
            />
          )}
        </>
      )}

      {showNumbersTools && !featureNumbersTools && (
        <NumbersTools
          measures={measures}
          onToggleMeasure={toggleMeasure}
          focalLength={focalLength}
          objectDistance={objectDistance}
          image={image}
        />
      )}
    </>
  )
}

function NumbersTools({
  featured = false,
  measures,
  onToggleMeasure,
  focalLength,
  objectDistance,
  image,
}: {
  featured?: boolean
  measures: MeasureFlags
  onToggleMeasure: (key: keyof MeasureFlags) => void
  focalLength: number
  objectDistance: number
  image: ReturnType<typeof formImage>
}) {
  const content = (
    <>
      <fieldset className="measures">
        <legend>Show on diagram</legend>
        <label className="measures__opt measures__opt--f">
          <input type="checkbox" checked={!!measures.f} onChange={() => onToggleMeasure('f')} />
          <span className="swatch swatch--f" />
          <b>f</b> <span className="measures__desc">focal length · lens → F</span>
        </label>
        <label className="measures__opt measures__opt--do">
          <input type="checkbox" checked={!!measures.do} onChange={() => onToggleMeasure('do')} />
          <span className="swatch swatch--do" />
          <b>
            d<sub>o</sub>
          </b>{' '}
          <span className="measures__desc">object distance · candle → lens</span>
        </label>
        <label className="measures__opt measures__opt--di">
          <input type="checkbox" checked={!!measures.di} onChange={() => onToggleMeasure('di')} />
          <span className="swatch swatch--di" />
          <b>
            d<sub>i</sub>
          </b>{' '}
          <span className="measures__desc">image distance · lens → image</span>
        </label>
        <label className="measures__opt measures__opt--m">
          <input type="checkbox" checked={!!measures.m} onChange={() => onToggleMeasure('m')} />
          <span className="swatch swatch--m" />
          <b>m</b> <span className="measures__desc">heights · h₀ vs hᵢ</span>
        </label>
      </fieldset>

      <EquationPanel
        f={focalLength}
        dObj={objectDistance}
        dImg={image.imageDistance}
        m={image.magnification}
      />

      <div className="runner__chips">
        <span className="chip chip--do" title="Object distance: how far the candle is from the lens">
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
        <span className="chip chip--f" title="Focal length: how strongly the lens bends light">
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
            <dd>
              {renderRich(
                'How strongly the lens **bends light** — the distance to the **focal mark F**.',
              )}
            </dd>
            <dt>
              <span className="swatch swatch--do" />d<sub>o</sub>{' '}
              <span className="term">object distance</span>
            </dt>
            <dd>{renderRich('Distance from the **candle** to the **lens**.')}</dd>
            <dt>
              <span className="swatch swatch--di" />d<sub>i</sub>{' '}
              <span className="term">image distance</span>
            </dt>
            <dd>
              {renderRich(
                'Distance from the **image** to the lens. **Negative** = forms on the candle’s side.',
              )}
            </dd>
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
            <dd>
              {renderRich(
                'Light **actually meets**, so it can land on a **screen** on the opposite side of the lens from the object.',
              )}
            </dd>
            <dt>virtual</dt>
            <dd>
              {renderRich(
                'Light only **appears** to come from there; it **can’t be projected** and appears on the same side of the lens as the object.',
              )}
            </dd>
          </dl>
        </div>

        <div className="glossary__group">
          <h4>Orientation</h4>
          <dl>
            <dt>upright</dt>
            <dd>{renderRich('Same way **up** as the candle.')}</dd>
            <dt>inverted</dt>
            <dd>{renderRich('**Flipped** upside-down (m is negative).')}</dd>
          </dl>
        </div>

        <div className="glossary__group">
          <h4>Size</h4>
          <dl>
            <dt>enlarged</dt>
            <dd>{renderRich('**Bigger** than the candle (|m| > 1).')}</dd>
            <dt>reduced</dt>
            <dd>{renderRich('**Smaller** than the candle (|m| < 1).')}</dd>
            <dt>same size</dt>
            <dd>{renderRich('**Equal** to the candle (|m| = 1).')}</dd>
          </dl>
        </div>
      </details>
    </>
  )

  if (featured) {
    return (
      <section className="runner__more runner__more--featured" aria-labelledby="formula-tools-heading">
        <h4 id="formula-tools-heading" className="runner__more-title">
          Thin lens formula
        </h4>
        <p className="runner__more-subtitle">
          Watch the equation update first, then use the diagram to test what the numbers predict.
        </p>
        {content}
      </section>
    )
  }

  return (
    <details className="runner__more">
      <summary id="numbers-tools-heading" className="runner__more-title">
        Numbers &amp; tools
      </summary>
      {content}
    </details>
  )
}

function InteractiveChoices({
  choices,
  chosenId,
  solved,
  onChoose,
}: {
  choices: Choice[]
  chosenId: string | null
  solved: boolean
  onChoose: (id: string) => void
}) {
  return (
    <div className="interactive-choices" role="radiogroup" aria-label="Your answer">
      {choices.map((choice) => {
        const selected = choice.id === chosenId
        const verdict = solved
          ? choice.correct
            ? 'correct'
            : 'muted'
          : selected
            ? 'selected'
            : ''
        return (
          <button
            key={choice.id}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={solved}
            className={`interactive-choice ${verdict ? `interactive-choice--${verdict}` : ''}`}
            onClick={() => onChoose(choice.id)}
          >
            {renderRich(choice.label)}
          </button>
        )
      })}
    </div>
  )
}

/**
 * The predict-then-reveal control: a set of choices the learner picks from. A
 * wrong pick explains *why* it's wrong and lets them try again (multiple
 * chances); the rays/image stay hidden. The correct pick reveals the diagram,
 * explains *why* it's right, shows the takeaway, and unlocks the advance button.
 */
function PredictPanel({
  step,
  prompt,
  chosenId,
  solved,
  canExplore,
  onChoose,
  onNext,
  nextLabel,
}: {
  step: { prompt: string; choices: Choice[]; reveal: string }
  prompt?: ReactNode
  chosenId: string | null
  solved: boolean
  canExplore: boolean
  onChoose: (id: string) => void
  onNext: () => void
  nextLabel: string
}) {
  const chosen = step.choices.find((c) => c.id === chosenId)
  function chooseByKeyboard(index: number, key: string) {
    const last = step.choices.length - 1
    const nextIndex =
      key === 'ArrowDown' || key === 'ArrowRight'
        ? Math.min(last, index + 1)
        : key === 'ArrowUp' || key === 'ArrowLeft'
          ? Math.max(0, index - 1)
          : key === 'Home'
            ? 0
            : key === 'End'
              ? last
              : index
    return step.choices[nextIndex]?.id
  }

  return (
    <div className="predict">
      {prompt}
      <ul className="predict__choices" role="radiogroup" aria-label="Your prediction">
        {step.choices.map((c, index) => {
          const isChosen = c.id === chosenId
          const verdict = solved
            ? c.correct
              ? 'correct'
              : 'muted'
            : isChosen
              ? c.correct
                ? 'correct'
                : 'wrong'
              : ''
          const showMark = (solved && c.correct) || (isChosen && !solved)
          return (
            <li key={c.id}>
              <button
                type="button"
                role="radio"
                aria-checked={isChosen}
                disabled={solved}
                className={`predict__choice ${verdict ? `predict__choice--${verdict}` : ''} ${
                  isChosen ? 'is-chosen' : ''
                }`}
                onClick={() => onChoose(c.id)}
                onKeyDown={(e) => {
                  const nextId = chooseByKeyboard(index, e.key)
                  if (nextId === c.id) return
                  e.preventDefault()
                  onChoose(nextId)
                }}
              >
                {c.visual && (
                  <span className="predict__visual" aria-hidden="true">
                    <LensDiagram
                      objectDistance={c.visual.scene.objectDistance}
                      focalLength={c.visual.scene.focalLength}
                      objectHeight={c.visual.scene.objectHeight}
                      showRays={c.visual.showRays ?? true}
                      showImage={c.visual.showImage ?? true}
                    />
                    {c.visual.caption && <span className="predict__caption">{c.visual.caption}</span>}
                  </span>
                )}
                <span className="predict__label">{renderRich(c.label)}</span>
                {showMark && (
                  <span className="predict__mark" aria-hidden="true">
                    {c.correct ? '✓' : '✗'}
                  </span>
                )}
              </button>
              {isChosen && <p className="predict__why">{renderRich(c.feedback)}</p>}
            </li>
          )
        })}
      </ul>

      {chosen && (
        <div className={`feedback feedback--${chosen.correct ? 'correct' : 'incorrect'}`} role="status">
          {chosen.correct ? (
            <>
              <strong>Correct.</strong> {renderRich(step.reveal)}
            </>
          ) : (
            <>
              <strong>Not quite — try again.</strong> Read the note above and pick another answer.
            </>
          )}
        </div>
      )}

      {canExplore && (
        <p className="predict__explore" role="status">
          Now <strong>drag the candle</strong> to see how the image responds.
        </p>
      )}

      <div className="runner__actions">
        {solved && (
          <button type="button" className="btn btn--next" onClick={onNext}>
            {nextLabel}
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
    <div
      className="equation"
      aria-label={`Thin lens equation: one over f equals one over object distance plus one over image distance. Current values: f ${fmt(
        f,
      )}, object distance ${fmt(dObj)}, image distance ${fmt(dImg)}, magnification ${fmt(m)}.`}
    >
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
        <span className="equation__group equation__group--m">
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
        </span>
      </div>
      <div className="equation__row equation__row--values">
        <Frac top={one} bottom={<span className="sym--f">{fmt(f)}</span>} />
        <span className="op">=</span>
        <Frac top={one} bottom={<span className="sym--do">{fmt(dObj)}</span>} />
        <span className="op">+</span>
        <Frac top={one} bottom={<span className="sym--di">{fmt(dImg)}</span>} />
        <span className="equation__sep" />
        <span className="equation__group equation__group--m">
          <span className="sym--m">m</span>
          <span className="op">=</span>
          <span className="sym--m">{fmt(m)}</span>
        </span>
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
  const sliderValue = distanceToSlider(value, control)
  const datalistValues = control.snaps?.map((s) =>
    usesLogDistance(control) ? distanceToSlider(s, control) : s,
  )
  return (
    <label className="slider">
      <span>
        {control.label ?? control.key}: {curvatureReadout(control, value) ?? fmt(value)}
      </span>
      <div className="slider__row">
        <input
          type="range"
          min={control.min}
          max={control.max}
          step={usesLogDistance(control) ? 'any' : (control.step ?? 1)}
          value={sliderValue}
          list={control.snaps ? `${control.key}-snaps` : undefined}
          onChange={(e) => {
            const raw = Number(e.target.value)
            const next = sliderToDistance(raw, control)
            if (!Number.isFinite(next)) {
              onChange(Infinity)
            } else {
              onChange(snapValue(Number(next.toFixed(2)), control.snaps))
            }
          }}
        />
        {control.snaps && (
          <datalist id={`${control.key}-snaps`}>
            {datalistValues?.map((s, index) => (
              <option key={control.snaps?.[index] ?? s} value={s} />
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
