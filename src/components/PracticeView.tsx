import { useEffect, useMemo, useRef, useState } from 'react'
import { StepView, isPredictStep, isPlotStep, type StepDefinition } from '../content'
import {
  generateProblem,
  liveRng,
  practiceTopicById,
  practiceTopics,
  selectNextTopic,
  type GeneratedProblem,
  type PracticeTopicId,
} from '../content/practice'
import { imageDistance } from '../engine'
import { DEFAULT_SCENE, type MeasureFlags, type SceneParams } from '../render'
import type { ProgressState } from '../data/useProgress'
import { recordPracticeAttempt } from '../data/practice'
import { upsertLeaderboardEntry } from '../data/leaderboard'
import {
  derivePracticeMilestones,
  earnedPracticeMilestoneIds,
  type PracticeMilestone,
} from '../data/practiceMilestones'
import { Leaderboard } from './Leaderboard'
import './PracticeView.css'

interface PracticeViewProps {
  uid: string
  displayName: string
  progress: ProgressState
  onBack: () => void
}

const thinLensMeasures: MeasureFlags = { f: true, do: true, di: true, m: false }
const PRAISE = ['Nice!', 'Sharp!', 'Brilliant!', 'Yes!', 'Spot on!', 'Crisp!', 'Boom!']

/**
 * A diagram scene sized so the object, focal marks, and (finite) image stay
 * on-screen for this problem. Practice randomizes focal lengths/distances, so a
 * fixed scene would push the candle off-window; this fits to the geometry.
 */
function sceneForProblem(step: StepDefinition): SceneParams {
  let obj: number
  let f: number | undefined
  if (isPredictStep(step) || isPlotStep(step)) {
    obj = Math.abs(step.scene.objectDistance)
    f = step.scene.focalLength
  } else {
    obj = Math.abs(step.initial.objectDistance ?? step.fixed?.objectDistance ?? 0)
    f = step.fixed?.focalLength
  }
  const fAbs = f ? Math.abs(f) : 0
  const di = f && obj ? imageDistance(obj, f) : NaN
  // Cover the object, out to ~3F, and the image; clamp so candles stay legible.
  const span = Math.max(obj, 3 * fAbs, Number.isFinite(di) ? Math.abs(di) : 0, 40) + 16
  const halfWidth = Math.min(96, Math.max(56, span))
  const halfHeight = Math.round((halfWidth * DEFAULT_SCENE.viewHeight) / DEFAULT_SCENE.viewWidth)
  return { ...DEFAULT_SCENE, halfWidth, halfHeight }
}

export function PracticeView({ uid, displayName, progress, onBack }: PracticeViewProps) {
  // A single persistent RNG (kept in state, not a ref, so it isn't read during
  // render in a way the rules-of-refs lint disallows).
  const [rng] = useState(() => liveRng())
  const [problem, setProblem] = useState<GeneratedProblem>(() => {
    const topic = selectNextTopic({}, null, rng)
    return generateProblem(topic, rng)
  })
  // Interleave from the very first problem onward.
  const [lastTopicId, setLastTopicId] = useState<PracticeTopicId | null>(problem.topicId)
  const [leaderboardOpen, setLeaderboardOpen] = useState(false)

  // Per-question bookkeeping for recording and the correct-answer celebration.
  const recordedRef = useRef(false)
  const firstTryRef = useRef(true)
  const celebratedRef = useRef(false)
  const sessionStreakRef = useRef(0)
  const [burst, setBurst] = useState<{ key: number; streak: number; word: string } | null>(null)

  const scene = useMemo(() => sceneForProblem(problem.step), [problem.step])

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [problem.step.id])

  // Auto-dismiss the celebration burst.
  useEffect(() => {
    if (!burst) return
    const t = setTimeout(() => setBurst(null), 1400)
    return () => clearTimeout(t)
  }, [burst])

  const stats = progress.practiceStats
  const totalCorrect = stats?.totalCorrect ?? 0
  const totalAttempts = stats?.totalAttempts ?? 0
  const accuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0
  const answerStreak = stats?.questionStreak?.current ?? 0
  const bestStreak = stats?.questionStreak?.longest ?? 0

  // Sync the public leaderboard name/score on entry (covers display-name changes).
  useEffect(() => {
    if (totalCorrect > 0) {
      void upsertLeaderboardEntry(uid, displayName, totalCorrect).catch(() => {})
    }
  }, [uid, displayName, totalCorrect])

  function handleAttempt(correct: boolean) {
    // One recorded attempt per question (first submission decides the outcome).
    if (recordedRef.current) return
    recordedRef.current = true
    firstTryRef.current = correct
    void recordPracticeAttempt(uid, { topicId: problem.topicId, correct, displayName }).catch(() => {})
  }

  function handleSolvedChange(solved: boolean) {
    if (!solved || celebratedRef.current) return
    celebratedRef.current = true
    // A first-try solve grows the session streak; a recovered one resets it.
    sessionStreakRef.current = firstTryRef.current ? sessionStreakRef.current + 1 : 0
    setBurst({
      key: Date.now(),
      streak: sessionStreakRef.current,
      word: PRAISE[Math.floor(Math.random() * PRAISE.length)],
    })
  }

  function nextQuestion() {
    // Read the freshest mastery (from the latest snapshot) to weight selection.
    const topic = selectNextTopic(progress.mastery, lastTopicId, rng)
    setProblem(generateProblem(topic, rng))
    setLastTopicId(topic)
    recordedRef.current = false
    firstTryRef.current = true
    celebratedRef.current = false
  }

  const topic = practiceTopicById[problem.topicId]

  // Milestone celebration (mirrors the lesson roadmap pattern).
  const milestones = derivePracticeMilestones(stats)
  const earnedKey = earnedPracticeMilestoneIds(milestones).join(',')
  const [celebrate, setCelebrate] = useState<PracticeMilestone[]>([])
  useEffect(() => {
    const key = `lenslab:practice-milestones:${uid}`
    const earned = earnedPracticeMilestoneIds(milestones)
    const stored = localStorage.getItem(key)
    if (stored === null) {
      localStorage.setItem(key, JSON.stringify(earned))
      return
    }
    let seen: string[] = []
    try {
      seen = JSON.parse(stored) as string[]
    } catch {
      seen = []
    }
    const fresh = milestones.filter((m) => m.earned && !seen.includes(m.id))
    if (fresh.length === 0) return
    localStorage.setItem(key, JSON.stringify(earned))
    const show = setTimeout(() => setCelebrate(fresh), 0)
    const hide = setTimeout(() => setCelebrate([]), 5000)
    return () => {
      clearTimeout(show)
      clearTimeout(hide)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, earnedKey])

  return (
    <div className="practice">
      <header className="practice__bar">
        <button type="button" className="btn practice__back" onClick={onBack}>
          ← Roadmap
        </button>
        <span className="practice__title">Practice</span>
        <button
          type="button"
          className="btn practice__leaderboard-btn"
          onClick={() => setLeaderboardOpen(true)}
        >
          🏆 Leaderboard
        </button>
      </header>

      {celebrate.length > 0 && (
        <div className="ms-toast" role="alertdialog" aria-labelledby="practice-ms-title">
          <span className="ms-toast__spark" aria-hidden="true">
            🎉
          </span>
          <div className="ms-toast__body">
            <strong id="practice-ms-title">Milestone unlocked!</strong>
            <span>{celebrate.map((m) => m.label).join(' · ')}</span>
          </div>
          <button
            type="button"
            className="ms-toast__close"
            onClick={() => setCelebrate([])}
            aria-label="Dismiss milestone notification"
          >
            ×
          </button>
        </div>
      )}

      {leaderboardOpen && <Leaderboard uid={uid} onClose={() => setLeaderboardOpen(false)} />}

      <main className="practice__main">
        <section className="practice__problem card">
          <span className="practice__topic-chip">{topic.label}</span>

          {burst && (
            <div
              key={burst.key}
              className={`solve-burst ${burst.streak >= 5 ? 'is-hot' : burst.streak >= 3 ? 'is-warm' : ''}`}
              aria-hidden="true"
            >
              <span className="solve-burst__ring" />
              {Array.from({ length: 8 }).map((_, i) => (
                <span key={i} className={`solve-burst__spark solve-burst__spark--${i}`} />
              ))}
              <span className="solve-burst__word">{burst.word}</span>
              {burst.streak >= 2 && (
                <span className="solve-burst__streak">🔥 {burst.streak} in a row</span>
              )}
            </div>
          )}

          <StepView
            // Remount per question so all step state resets cleanly.
            key={problem.step.id}
            step={problem.step}
            scene={scene}
            nextLabel="Next question"
            onNext={nextQuestion}
            onAttempt={handleAttempt}
            onSolvedChange={handleSolvedChange}
            featureNumbersTools={problem.topicId === 'thin-lens'}
            initialMeasures={problem.topicId === 'thin-lens' ? thinLensMeasures : {}}
          />
        </section>

        <section className="practice__stats card" aria-label="Your practice stats">
          <div className="practice-stat">
            <span className="practice-stat__value">🔥 {answerStreak}</span>
            <span className="practice-stat__label">Answer streak</span>
          </div>
          <div className="practice-stat">
            <span className="practice-stat__value">{bestStreak}</span>
            <span className="practice-stat__label">Best streak</span>
          </div>
          <div className="practice-stat">
            <span className="practice-stat__value">{totalCorrect}</span>
            <span className="practice-stat__label">Correct</span>
          </div>
          <div className="practice-stat">
            <span className="practice-stat__value">{accuracy}%</span>
            <span className="practice-stat__label">Accuracy</span>
          </div>
        </section>

        <section className="practice__mastery" aria-label="Topic mastery">
          {practiceTopics.map((t) => {
            const m = progress.mastery[t.id]
            const seen = (m?.attempts ?? 0) > 0
            const strength = seen ? Math.round(((m?.correct ?? 0) / (m?.attempts ?? 1)) * 100) : 0
            return (
              <div
                key={t.id}
                className={`mastery-pip ${t.id === problem.topicId ? 'is-current' : ''} ${
                  seen ? '' : 'is-new'
                }`}
                title={`${t.label}: ${t.description}`}
              >
                <span className="mastery-pip__label">{t.label}</span>
                <span className="mastery-pip__track">
                  <span className="mastery-pip__fill" style={{ width: `${strength}%` }} />
                </span>
              </div>
            )
          })}
        </section>
      </main>
    </div>
  )
}
