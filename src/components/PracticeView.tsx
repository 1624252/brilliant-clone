import { useEffect, useMemo, useState } from 'react'
import { LensScene } from '../interactive'
import {
  checkPracticeChoice,
  checkPracticeAnswer,
  getSiblingPracticeProblem,
  opticsPracticeProblems,
  type AnswerCheck,
  type CalculationProblem,
  type ChoiceAnswerCheck,
  type ChoicePracticeProblem,
  type EquationPart,
  type PracticeCategory,
  type PracticeProblem,
} from '../content'
import { formImage } from '../engine'
import { recordPracticeAttempt } from '../data/progress'
import type { ProgressState } from '../data/useProgress'
import { distanceToSlider, sliderToDistance } from '../content/logDistance'
import { renderRich } from '../content/richText'
import type { Control } from '../content'
import type { MeasureFlags } from '../render'
import './PracticeView.css'

interface PracticeViewProps {
  uid: string
  progress: ProgressState
  onBack: () => void
}

type PracticeStatus = 'idle' | 'correct' | 'incorrect'
type PracticeMode = PracticeCategory

const fmt = (n: number) => (Number.isFinite(n) ? n.toFixed(1) : '∞')
const isChoiceProblem = (problem: PracticeProblem): problem is ChoicePracticeProblem =>
  problem.kind === 'choice'
const isCalculationProblem = (problem: PracticeProblem): problem is CalculationProblem =>
  problem.kind !== 'choice'

const practiceModes: { id: PracticeMode; label: string }[] = [
  { id: 'mixed', label: 'Mixed' },
  { id: 'predict', label: 'Predict' },
  { id: 'calculate', label: 'Calculate' },
  { id: 'signs', label: 'Signs' },
]

function problemsForMode(mode: PracticeMode) {
  if (mode === 'mixed') return opticsPracticeProblems
  return opticsPracticeProblems.filter((problem) => problem.category === mode)
}

function firstUnsolvedIndex(progress: ProgressState, problems: PracticeProblem[]) {
  const idx = problems.findIndex((p) => !progress.byPractice[p.id]?.solved)
  return idx >= 0 ? idx : 0
}

export function PracticeView({ uid, progress, onBack }: PracticeViewProps) {
  const [mode, setMode] = useState<PracticeMode>('mixed')
  const sessionProblems = useMemo(() => problemsForMode(mode), [mode])
  const [problemIndex, setProblemIndex] = useState(() =>
    firstUnsolvedIndex(progress, opticsPracticeProblems),
  )
  const [questionNumber, setQuestionNumber] = useState(1)
  const problem = sessionProblems[problemIndex] ?? sessionProblems[0]
  const [objectDistance, setObjectDistance] = useState(problem.scene.objectDistance)
  const [answer, setAnswer] = useState('')
  const [chosenId, setChosenId] = useState<string | null>(null)
  const [status, setStatus] = useState<PracticeStatus>('idle')
  const [lastCheck, setLastCheck] = useState<AnswerCheck | null>(null)
  const [lastChoiceCheck, setLastChoiceCheck] = useState<ChoiceAnswerCheck | null>(null)
  const [measures, setMeasures] = useState<MeasureFlags>(problem.measures ?? {})
  const [equationInputs, setEquationInputs] = useState<Record<string, string>>({})
  const [equationChecks, setEquationChecks] = useState<Record<string, AnswerCheck>>({})
  const [trackedProblemId, setTrackedProblemId] = useState(problem.id)

  if (problem.id !== trackedProblemId) {
    setTrackedProblemId(problem.id)
    setObjectDistance(problem.scene.objectDistance)
    setAnswer('')
    setChosenId(null)
    setStatus('idle')
    setLastCheck(null)
    setLastChoiceCheck(null)
    setMeasures(problem.measures ?? {})
    setEquationInputs({})
    setEquationChecks({})
  }

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [problem.id])

  const solvedCount = useMemo(
    () => opticsPracticeProblems.filter((p) => progress.byPractice[p.id]?.solved).length,
    [progress.byPractice],
  )
  const modeSolvedCount = useMemo(
    () => sessionProblems.filter((p) => progress.byPractice[p.id]?.solved).length,
    [progress.byPractice, sessionProblems],
  )
  const stats = progress.practiceStats
  const pct = Math.round((solvedCount / opticsPracticeProblems.length) * 100)
  const solved = status === 'correct'
  const diagramDraggable =
    problem.scene.draggable ??
    (isChoiceProblem(problem) ? !!problem.draggable : Number.isFinite(problem.scene.objectDistance))
  const image = formImage(objectDistance, problem.scene.focalLength)

  async function submit() {
    if (!isCalculationProblem(problem)) return
    const check = checkPracticeAnswer(problem, answer)
    setLastCheck(check)
    setStatus(check.correct ? 'correct' : 'incorrect')
    await recordPracticeAttempt(uid, problem.id, {
      correct: check.correct,
      answer: check.parsed,
    }).catch(() => {})
  }

  async function submitChoice() {
    if (!isChoiceProblem(problem)) return
    const check = checkPracticeChoice(problem, chosenId)
    setLastChoiceCheck(check)
    setStatus(check.correct ? 'correct' : 'incorrect')
    await recordPracticeAttempt(uid, problem.id, {
      correct: check.correct,
      answer: null,
    }).catch(() => {})
  }

  function nextProblem() {
    setProblemIndex((i) => (i + 1) % sessionProblems.length)
    setQuestionNumber((n) => n + 1)
  }

  function anotherLikeThis() {
    const sibling = getSiblingPracticeProblem(problem)
    const siblingIndex = sessionProblems.findIndex((candidate) => candidate.id === sibling.id)
    setProblemIndex(siblingIndex >= 0 ? siblingIndex : (problemIndex + 1) % sessionProblems.length)
    setQuestionNumber((n) => n + 1)
  }

  function chooseMode(nextMode: PracticeMode) {
    const nextProblems = problemsForMode(nextMode)
    setMode(nextMode)
    setProblemIndex(firstUnsolvedIndex(progress, nextProblems))
    setQuestionNumber(1)
  }

  function toggleMeasure(key: keyof MeasureFlags) {
    setMeasures((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  function resetDiagram() {
    setObjectDistance(problem.scene.objectDistance)
  }

  function setEquationInput(id: string, value: string) {
    setEquationInputs((prev) => ({ ...prev, [id]: value }))
    setEquationChecks((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  function checkEquationPart(part: EquationPart) {
    const check = checkPracticeAnswer(part, equationInputs[part.id] ?? '')
    setEquationChecks((prev) => ({ ...prev, [part.id]: check }))
  }

  return (
    <div className="practice">
      <header className="practice__bar">
        <button type="button" className="btn practice__back" onClick={onBack}>
          ← Roadmap
        </button>
        <span className="practice__title">Optics Practice Problems</span>
        <span className="practice__spacer" />
      </header>

      <main className="practice__main">
        <section className="practice__hero card">
          <p className="practice__eyebrow">Lens practice</p>
          <h1>Short no-calculator practice that keeps going.</h1>
          <p>
            Answer quick prediction, sign, and thin-lens questions from friendly numbers.
            Fractions are welcome when a decimal would need a calculator.
          </p>
          <div className="practice__stats" aria-label="Practice progress">
            <Stat label="Solved in bank" value={`${solvedCount}/${opticsPracticeProblems.length}`} />
            <Stat label={`${modeLabel(mode)} mode`} value={`${modeSolvedCount}/${sessionProblems.length}`} />
            <Stat label="Question streak" value={String(stats.questionStreak.current)} />
            <Stat label="Accuracy" value={accuracyLabel(stats.totalCorrect, stats.totalAttempts)} />
          </div>
          <div className="progressbar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
            <div className="progressbar__fill" style={{ width: `${pct}%` }} />
          </div>
          <div className="practice-modes" aria-label="Practice mode">
            {practiceModes.map((practiceMode) => (
              <button
                key={practiceMode.id}
                type="button"
                className={`practice-modes__btn ${practiceMode.id === mode ? 'is-active' : ''}`}
                onClick={() => chooseMode(practiceMode.id)}
                aria-pressed={practiceMode.id === mode}
              >
                {practiceMode.label}
              </button>
            ))}
          </div>
        </section>

        <section className="practice__problem card">
          <div className="practice__problem-head">
            <span className="practice__count">
              Question {questionNumber} · {modeLabel(mode)}
            </span>
            {progress.byPractice[problem.id]?.solved && (
              <span className="practice__solved">Solved before</span>
            )}
          </div>
          <h2>{problem.title}</h2>
          <p className="practice__prompt">{renderRich(problem.prompt)}</p>

          <dl className="practice__givens">
            {problem.givens.map((given) => (
              <div key={given.symbol} className="practice__given">
                <dt>{renderRich(given.symbol)}</dt>
                <dd>
                  <span>{given.label}</span>
                  <strong>{given.value}</strong>
                </dd>
              </div>
            ))}
          </dl>

          <PracticeMeasures measures={measures} onToggleMeasure={toggleMeasure} />

          {isCalculationProblem(problem) && problem.equationParts && (
            <EquationWorkspace
              parts={problem.equationParts}
              inputs={equationInputs}
              checks={equationChecks}
              onInput={setEquationInput}
              onCheck={checkEquationPart}
            />
          )}

          <div className="practice__diagram">
            <LensScene
              objectDistance={objectDistance}
              focalLength={problem.scene.focalLength}
              objectHeight={problem.scene.objectHeight}
              minObjectDistance={5}
              maxObjectDistance={80}
              infinityAtEdge={diagramDraggable}
              snaps={[Math.abs(problem.scene.focalLength), 2 * Math.abs(problem.scene.focalLength), 3 * Math.abs(problem.scene.focalLength)]}
              onObjectDistanceChange={diagramDraggable ? setObjectDistance : undefined}
              measures={measures}
            />
          </div>
          <PracticeExplore
            problem={problem}
            objectDistance={objectDistance}
            image={image}
            enabled={diagramDraggable}
            onObjectDistanceChange={setObjectDistance}
            onReset={resetDiagram}
          />
          {diagramDraggable && (
            <p className="practice__drag-note">
              Drag the candle to explore nearby cases. Your submitted answer is still
              checked against the givens above.
            </p>
          )}

          {isChoiceProblem(problem) ? (
            <ChoicePractice
              problem={problem}
              chosenId={chosenId}
              status={status}
              solved={solved}
              check={lastChoiceCheck}
              onChoose={(id) => {
                setChosenId(id)
                if (status !== 'correct') {
                  setStatus('idle')
                  setLastChoiceCheck(null)
                }
              }}
              onSubmit={() => void submitChoice()}
            />
          ) : (
            <>
              <form
                className="practice__answer"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (!solved) void submit()
                }}
              >
                <label htmlFor="practice-answer">Your answer</label>
                <p className="practice__answer-help">
                  No calculator needed. Use a decimal or a fraction like -1/2 or{' '}
                  {renderRich('\\frac{-1}{2}')}.
                </p>
                <div className="practice__answer-row">
                  <input
                    id="practice-answer"
                    value={answer}
                    onChange={(e) => {
                      setAnswer(e.target.value)
                      if (status !== 'correct') {
                        setStatus('idle')
                        setLastCheck(null)
                      }
                    }}
                    inputMode="text"
                    placeholder={problem.unit ? `number or fraction in ${problem.unit}` : 'number or fraction'}
                    disabled={solved}
                  />
                  {problem.unit && <span className="practice__unit">{problem.unit}</span>}
                  <button type="submit" className="btn btn--primary" disabled={solved || answer.trim() === ''}>
                    Check
                  </button>
                </div>
              </form>

              <Feedback problem={problem} status={status} check={lastCheck} />
            </>
          )}

          <div className="practice__actions">
            {status === 'incorrect' && (
              <button type="button" className="btn" onClick={anotherLikeThis}>
                Another like this
              </button>
            )}
            <button type="button" className="btn" onClick={nextProblem}>
              {solved ? 'Next problem' : 'Skip for now'}
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}

function EquationWorkspace({
  parts,
  inputs,
  checks,
  onInput,
  onCheck,
}: {
  parts: EquationPart[]
  inputs: Record<string, string>
  checks: Record<string, AnswerCheck>
  onInput: (id: string, value: string) => void
  onCheck: (part: EquationPart) => void
}) {
  const completed = parts.filter((part) => checks[part.id]?.correct).length
  const canCheck = parts.every((part) => (inputs[part.id] ?? '').trim() !== '')
  return (
    <section className="equation-workspace" aria-label="Equation workspace">
      <div className="equation-workspace__head">
        <div>
          <strong>Fill the equation first</strong>
          <span>
            Put the distances in centimeters into the denominators, then solve for the
            final answer.
          </span>
        </div>
        <span className="equation-workspace__progress">
          {completed}/{parts.length}
        </span>
      </div>

      <div className="equation-workspace__formula" aria-label="Fill in thin lens equation">
        <EquationBlank part={parts[0]} value={inputs[parts[0].id] ?? ''} onInput={onInput} />
        <span className="equation-workspace__op">=</span>
        <EquationBlank part={parts[1]} value={inputs[parts[1].id] ?? ''} onInput={onInput} />
        <span className="equation-workspace__op">+</span>
        <EquationBlank part={parts[2]} value={inputs[parts[2].id] ?? ''} onInput={onInput} />
      </div>

      <div className="equation-workspace__actions">
        <button
          type="button"
          className="btn"
          onClick={() => parts.forEach(onCheck)}
          disabled={!canCheck}
        >
          Check equation
        </button>
      </div>

      <ul className="equation-workspace__parts">
        {parts.map((part) => {
          const check = checks[part.id]
          return (
            <li key={part.id} className="equation-part">
              {check && (
                <p
                  className={`equation-part__feedback ${
                    check.correct ? 'is-correct' : 'is-incorrect'
                  }`}
                  role="status"
                >
                  {check.correct
                    ? renderRich(part.feedback)
                    : `Check the ${part.prompt.toLowerCase()}; use centimeters, not a reciprocal.`}
                </p>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function EquationBlank({
  part,
  value,
  onInput,
}: {
  part: EquationPart
  value: string
  onInput: (id: string, value: string) => void
}) {
  return (
    <label className="equation-blank">
      <span className="sr-only">{part.prompt}</span>
      <span className="frac frac--equation">
        <span className="frac__num">1</span>
        <span className="frac__den">
          <input
            value={value}
            onChange={(e) => onInput(part.id, e.target.value)}
            inputMode="decimal"
            placeholder={part.label.replace('_', '')}
            aria-label={part.prompt}
          />
          <span className="equation-blank__unit">{part.unit}</span>
        </span>
      </span>
      <span className="equation-blank__symbol">{renderRich(part.label)}</span>
    </label>
  )
}

function ChoicePractice({
  problem,
  chosenId,
  status,
  solved,
  check,
  onChoose,
  onSubmit,
}: {
  problem: ChoicePracticeProblem
  chosenId: string | null
  status: PracticeStatus
  solved: boolean
  check: ChoiceAnswerCheck | null
  onChoose: (id: string) => void
  onSubmit: () => void
}) {
  const chosen = problem.choices.find((choice) => choice.id === chosenId)
  return (
    <section className="practice-choice" aria-label="Answer choices">
      <div className="practice-choice__head">
        <strong>Choose the image outcome</strong>
        <span>Use the focus marks and ray diagram before you commit.</span>
      </div>
      <div className="practice-choice__grid">
        {problem.choices.map((choice) => {
          const picked = choice.id === chosenId
          const showResult = solved || (status === 'incorrect' && picked)
          return (
            <button
              key={choice.id}
              type="button"
              className={`practice-choice__btn ${
                picked ? 'is-selected' : ''
              } ${showResult && choice.correct ? 'is-correct' : ''} ${
                showResult && !choice.correct ? 'is-wrong' : ''
              }`}
              onClick={() => onChoose(choice.id)}
              disabled={solved}
            >
              <span>{renderRich(choice.label)}</span>
              {choice.visual && (
                <span className="practice-choice__visual" aria-hidden="true">
                  <LensScene
                    objectDistance={choice.visual.scene.objectDistance}
                    focalLength={choice.visual.scene.focalLength}
                    objectHeight={choice.visual.scene.objectHeight}
                    showRays={choice.visual.showRays ?? true}
                    showImage={choice.visual.showImage ?? true}
                  />
                  {choice.visual.caption && (
                    <span className="practice-choice__caption">{choice.visual.caption}</span>
                  )}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {status === 'idle' && (
        <p className="practice__hint">{renderRich(problem.hint)}</p>
      )}
      {status === 'incorrect' && (
        <div className="practice-feedback practice-feedback--incorrect" role="status">
          <strong>Not quite.</strong>
          <p>{chosen ? renderRich(chosen.feedback) : 'Choose an answer first.'}</p>
          <p>{renderRich(problem.hint)}</p>
        </div>
      )}
      {status === 'correct' && (
        <div className="practice-feedback practice-feedback--correct" role="status">
          <strong>Correct.</strong>
          <p>{renderRich(chosen?.feedback ?? problem.solution)}</p>
          <SolutionSteps problem={problem} />
        </div>
      )}

      <div className="practice-choice__actions">
        <button
          type="button"
          className="btn btn--primary"
          disabled={solved || !chosenId || check?.correct}
          onClick={onSubmit}
        >
          Check
        </button>
      </div>
    </section>
  )
}

function SolutionSteps({ problem }: { problem: PracticeProblem }) {
  if (!problem.solutionSteps?.length) {
    return <p>{renderRich(problem.solution)}</p>
  }
  return (
    <section className="practice-solution" aria-label="Step-by-step solution">
      <strong>Step-by-step</strong>
      <ol>
        {problem.solutionSteps.map((step, index) => (
          <li key={index}>{renderRich(step)}</li>
        ))}
      </ol>
      <p>{renderRich(problem.solution)}</p>
    </section>
  )
}

function PracticeExplore({
  problem,
  objectDistance,
  image,
  enabled,
  onObjectDistanceChange,
  onReset,
}: {
  problem: PracticeProblem
  objectDistance: number
  image: ReturnType<typeof formImage>
  enabled: boolean
  onObjectDistanceChange: (value: number) => void
  onReset: () => void
}) {
  const distanceControl: Control = {
    key: 'objectDistance',
    type: 'drag-axis',
    min: 5,
    max: 80,
    step: 0.01,
    allowInfinity: true,
  }
  const sliderValue = distanceToSlider(objectDistance, distanceControl)
  return (
    <section className="practice-explore" aria-label="Diagram explorer">
      <div className="practice-explore__head">
        <div>
          <strong>Diagram explorer</strong>
          <span>Move the object and watch the lens equation respond.</span>
        </div>
        <button type="button" className="btn practice-explore__reset" onClick={onReset}>
          Reset to givens
        </button>
      </div>

      {enabled ? (
        <label className="practice-explore__slider">
          <span>
            Object distance <b>{fmt(objectDistance)} cm</b>
          </span>
          <div className="practice-explore__slider-row">
            <input
              type="range"
              min={distanceControl.min}
              max={distanceControl.max}
              step={distanceControl.step}
              value={sliderValue}
              onChange={(e) => onObjectDistanceChange(sliderToDistance(Number(e.target.value), distanceControl))}
            />
            <button
              type="button"
              className={`practice-explore__inf ${objectDistance === Infinity ? 'is-on' : ''}`}
              onClick={() =>
                onObjectDistanceChange(objectDistance === Infinity ? problem.scene.objectDistance : Infinity)
              }
              aria-pressed={objectDistance === Infinity}
              title="Set object distance to infinity"
            >
              ∞
            </button>
          </div>
        </label>
      ) : (
        <p className="practice-explore__note">
          This setup uses a very distant object, so the incoming rays are already nearly
          parallel.
        </p>
      )}

      <div className="practice-explore__chips" aria-label="Live diagram values">
        <span className="chip chip--f">f: {fmt(problem.scene.focalLength)} cm</span>
        <span className="chip chip--do">
          d<sub>o</sub>: {fmt(objectDistance)} cm
        </span>
        <span className={`chip ${image.isReal ? 'chip--real' : 'chip--virtual'}`}>
          d<sub>i</sub>: {fmt(image.imageDistance)} cm
        </span>
        <span className="chip chip--m">m: {fmt(image.magnification)}</span>
      </div>
    </section>
  )
}

function PracticeMeasures({
  measures,
  onToggleMeasure,
}: {
  measures: MeasureFlags
  onToggleMeasure: (key: keyof MeasureFlags) => void
}) {
  return (
    <fieldset className="practice-measures">
      <legend>Show on diagram</legend>
      <label className="practice-measures__opt practice-measures__opt--f">
        <input type="checkbox" checked={!!measures.f} onChange={() => onToggleMeasure('f')} />
        <span className="swatch swatch--f" />
        <b>f</b>
        <span>focal length</span>
      </label>
      <label className="practice-measures__opt practice-measures__opt--do">
        <input
          type="checkbox"
          checked={!!measures.do}
          onChange={() => onToggleMeasure('do')}
        />
        <span className="swatch swatch--do" />
        <b>
          d<sub>o</sub>
        </b>
        <span>object distance</span>
      </label>
      <label className="practice-measures__opt practice-measures__opt--di">
        <input
          type="checkbox"
          checked={!!measures.di}
          onChange={() => onToggleMeasure('di')}
        />
        <span className="swatch swatch--di" />
        <b>
          d<sub>i</sub>
        </b>
        <span>image distance</span>
      </label>
      <label className="practice-measures__opt practice-measures__opt--m">
        <input type="checkbox" checked={!!measures.m} onChange={() => onToggleMeasure('m')} />
        <span className="swatch swatch--m" />
        <b>m</b>
        <span>magnification</span>
      </label>
    </fieldset>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="practice-stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </span>
  )
}

function Feedback({
  problem,
  status,
  check,
}: {
  problem: CalculationProblem
  status: PracticeStatus
  check: AnswerCheck | null
}) {
  if (status === 'idle') {
    return (
      <p className="practice__hint">
        {renderRich(problem.hint)}{' '}
        <span className="practice__tolerance">
          Accepted tolerance: ±{problem.tolerance} {problem.unit || 'units'}.
        </span>
      </p>
    )
  }
  if (status === 'incorrect') {
    return (
      <div className="practice-feedback practice-feedback--incorrect" role="status">
        <strong>Not quite.</strong>
        <p>
          {check?.parsed === null
            ? 'Enter a numeric value, such as -10, 1/2, or \\frac{1}{2}.'
            : `Your answer is ${fmt(check?.parsed ?? 0)}${problem.unit ? ` ${problem.unit}` : ''}.`}
        </p>
        <p>{renderRich(problem.hint)}</p>
      </div>
    )
  }
  return (
    <div className="practice-feedback practice-feedback--correct" role="status">
      <strong>Correct.</strong>
      <p>
        Accepted answer: {fmt(problem.answer)}
        {problem.unit ? ` ${problem.unit}` : ''}
      </p>
      <SolutionSteps problem={problem} />
    </div>
  )
}

function accuracyLabel(correct: number, attempts: number) {
  if (attempts === 0) return '0%'
  return `${Math.round((correct / attempts) * 100)}%`
}

function modeLabel(mode: PracticeMode) {
  return practiceModes.find((practiceMode) => practiceMode.id === mode)?.label ?? 'Mixed'
}
