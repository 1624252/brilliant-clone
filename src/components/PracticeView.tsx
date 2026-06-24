import { useEffect, useMemo, useState } from 'react'
import { LensScene } from '../interactive'
import {
  checkPracticeAnswer,
  opticsPracticeProblems,
  type AnswerCheck,
  type CalculationProblem,
} from '../content'
import { recordPracticeAttempt } from '../data/progress'
import type { ProgressState } from '../data/useProgress'
import { renderRich } from '../content/richText'
import type { MeasureFlags } from '../render'
import './PracticeView.css'

interface PracticeViewProps {
  uid: string
  progress: ProgressState
  onBack: () => void
}

type PracticeStatus = 'idle' | 'correct' | 'incorrect'

const fmt = (n: number) => (Number.isFinite(n) ? n.toFixed(1) : '∞')

function firstUnsolvedIndex(progress: ProgressState) {
  const idx = opticsPracticeProblems.findIndex((p) => !progress.byPractice[p.id]?.solved)
  return idx >= 0 ? idx : 0
}

export function PracticeView({ uid, progress, onBack }: PracticeViewProps) {
  const [problemIndex, setProblemIndex] = useState(() => firstUnsolvedIndex(progress))
  const problem = opticsPracticeProblems[problemIndex]
  const [objectDistance, setObjectDistance] = useState(problem.scene.objectDistance)
  const [answer, setAnswer] = useState('')
  const [status, setStatus] = useState<PracticeStatus>('idle')
  const [lastCheck, setLastCheck] = useState<AnswerCheck | null>(null)
  const [measures, setMeasures] = useState<MeasureFlags>(problem.measures ?? {})
  const [trackedProblemId, setTrackedProblemId] = useState(problem.id)

  if (problem.id !== trackedProblemId) {
    setTrackedProblemId(problem.id)
    setObjectDistance(problem.scene.objectDistance)
    setAnswer('')
    setStatus('idle')
    setLastCheck(null)
    setMeasures(problem.measures ?? {})
  }

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [problem.id])

  const solvedCount = useMemo(
    () => opticsPracticeProblems.filter((p) => progress.byPractice[p.id]?.solved).length,
    [progress.byPractice],
  )
  const stats = progress.practiceStats
  const pct = Math.round((solvedCount / opticsPracticeProblems.length) * 100)
  const solved = status === 'correct'

  async function submit() {
    const check = checkPracticeAnswer(problem, answer)
    setLastCheck(check)
    setStatus(check.correct ? 'correct' : 'incorrect')
    await recordPracticeAttempt(uid, problem.id, {
      correct: check.correct,
      answer: check.parsed,
    }).catch(() => {})
  }

  function nextProblem() {
    setProblemIndex((i) => (i + 1) % opticsPracticeProblems.length)
  }

  function toggleMeasure(key: keyof MeasureFlags) {
    setMeasures((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="practice">
      <header className="practice__bar">
        <button type="button" className="btn practice__back" onClick={onBack}>
          ← Roadmap
        </button>
        <span className="practice__title">AP Physics II Optics Practice</span>
        <span className="practice__spacer" />
      </header>

      <main className="practice__main">
        <section className="practice__hero card">
          <p className="practice__eyebrow">Calculation practice</p>
          <h1>Use the equation, then check it against the rays.</h1>
          <p>
            Solve AP-style thin-lens questions with signed quantities. Correct answers
            count toward your daily streak and your question streak.
          </p>
          <div className="practice__stats" aria-label="Practice progress">
            <Stat label="Solved" value={`${solvedCount}/${opticsPracticeProblems.length}`} />
            <Stat label="Question streak" value={String(stats.questionStreak.current)} />
            <Stat label="Best streak" value={String(stats.questionStreak.longest)} />
            <Stat label="Accuracy" value={accuracyLabel(stats.totalCorrect, stats.totalAttempts)} />
          </div>
          <div className="progressbar" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
            <div className="progressbar__fill" style={{ width: `${pct}%` }} />
          </div>
        </section>

        <section className="practice__problem card">
          <div className="practice__problem-head">
            <span className="practice__count">
              Problem {problemIndex + 1} of {opticsPracticeProblems.length}
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

          <div className="practice__diagram">
            <LensScene
              objectDistance={objectDistance}
              focalLength={problem.scene.focalLength}
              objectHeight={problem.scene.objectHeight}
              minObjectDistance={5}
              maxObjectDistance={80}
              snaps={[Math.abs(problem.scene.focalLength), 2 * Math.abs(problem.scene.focalLength), 3 * Math.abs(problem.scene.focalLength)]}
              onObjectDistanceChange={problem.scene.draggable ? setObjectDistance : undefined}
              measures={measures}
            />
          </div>
          {problem.scene.draggable && (
            <p className="practice__drag-note">
              Drag the candle to test the setup visually. Your answer is still checked
              against the AP-style givens above.
            </p>
          )}

          <form
            className="practice__answer"
            onSubmit={(e) => {
              e.preventDefault()
              if (!solved) void submit()
            }}
          >
            <label htmlFor="practice-answer">Your answer</label>
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
                inputMode="decimal"
                placeholder={problem.unit ? `number in ${problem.unit}` : 'number'}
                disabled={solved}
              />
              {problem.unit && <span className="practice__unit">{problem.unit}</span>}
              <button type="submit" className="btn btn--primary" disabled={solved || answer.trim() === ''}>
                Check
              </button>
            </div>
          </form>

          <Feedback problem={problem} status={status} check={lastCheck} />

          <div className="practice__actions">
            <button type="button" className="btn" onClick={nextProblem}>
              {solved ? 'Next problem' : 'Skip for now'}
            </button>
          </div>
        </section>
      </main>
    </div>
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
        Expected tolerance: ±{problem.tolerance} {problem.unit}. Keep signs for virtual
        images and inverted heights.
      </p>
    )
  }
  if (status === 'incorrect') {
    return (
      <div className="practice-feedback practice-feedback--incorrect" role="status">
        <strong>Not quite.</strong>
        <p>
          {check?.parsed === null
            ? 'Enter a numeric value, such as -10 or 15.5.'
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
      <p>{renderRich(problem.solution)}</p>
    </div>
  )
}

function accuracyLabel(correct: number, attempts: number) {
  if (attempts === 0) return '0%'
  return `${Math.round((correct / attempts) * 100)}%`
}
