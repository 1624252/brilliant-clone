import { useCallback, useEffect, useState, type PointerEvent } from 'react'
import {
  RayFocusExplainer,
  RaySourceExplainer,
  ConvexLensExplainer,
  ConcaveLensExplainer,
  CurvatureExplainer,
  type MeasureFlags,
} from '../render'
import { renderRich } from './richText'
import { StepView } from './StepView'
import type { LessonDefinition } from './types'
import './ProblemRunner.css'

interface ProblemRunnerProps {
  lesson: LessonDefinition
  /** Step to resume at (from saved progress). */
  initialStepIndex?: number
  /** True when replaying a lesson already completed in persisted progress. */
  initialCompleted?: boolean
  /** Called when the learner advances to a new step (for saving resume state). */
  onStepChange?: (stepIndex: number) => void
  onComplete?: () => void
  /** Leave the lesson (e.g., back to the roadmap), shown on the finish screen. */
  onExit?: () => void
  /** Open the next lesson; omitted when this is the last one. */
  onNextLesson?: () => void
  /** Title of the next lesson, to label the finish-screen button. */
  nextLessonTitle?: string
  /** Go to practice problems, shown on the finish screen when provided. */
  onPractice?: () => void
}

const initialMeasures = (lesson: LessonDefinition): MeasureFlags =>
  lesson.id === 'thin-lens-equation' ? { f: true, do: true, di: true, m: false } : {}

export function ProblemRunner({
  lesson,
  initialStepIndex = 0,
  initialCompleted = false,
  onStepChange,
  onComplete,
  onExit,
  onNextLesson,
  nextLessonTitle,
  onPractice,
}: ProblemRunnerProps) {
  const resumeIndex = Math.min(Math.max(initialStepIndex, 0), lesson.steps.length - 1)
  // Skip the intro when resuming partway through a lesson.
  const [started, setStarted] = useState(initialCompleted || !lesson.intro || resumeIndex > 0)
  const [stepIndex, setStepIndex] = useState(resumeIndex)
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(() =>
    initialCompleted
      ? new Set(Array.from({ length: lesson.steps.length }, (_, i) => i))
      : new Set(Array.from({ length: resumeIndex }, (_, i) => i)),
  )
  const [furthestStepIndex, setFurthestStepIndex] = useState(
    initialCompleted ? lesson.steps.length - 1 : resumeIndex,
  )
  const [done, setDone] = useState(false)
  const [solvedNow, setSolvedNow] = useState(initialCompleted)

  // Start each new step/screen at the top — otherwise, on mobile, tapping Next
  // can leave the learner scrolled partway down the previous step.
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [stepIndex, started, done])

  const featureNumbersTools = lesson.id === 'thin-lens-equation'
  const promptNearAction = lesson.id === 'thin-lens-equation'
  const isLast = stepIndex + 1 >= lesson.steps.length

  const handleSolvedChange = useCallback(
    (solved: boolean) => {
      setSolvedNow(solved)
      if (solved) {
        setCompletedSteps((prev) => (prev.has(stepIndex) ? prev : new Set(prev).add(stepIndex)))
      }
    },
    [stepIndex],
  )

  function loadStep(index: number) {
    setStepIndex(index)
    setSolvedNow(completedSteps.has(index))
  }

  function next() {
    if (stepIndex + 1 >= lesson.steps.length) {
      setDone(true)
      onComplete?.()
      return
    }
    const ni = stepIndex + 1
    loadStep(ni)
    setFurthestStepIndex((current) => Math.max(current, ni))
    onStepChange?.(ni)
  }

  function previous() {
    if (stepIndex === 0) return
    loadStep(stepIndex - 1)
  }

  function forwardToReachedStep() {
    if (stepIndex >= furthestStepIndex) return
    loadStep(stepIndex + 1)
  }

  // Replay the whole lesson from the intro (used by "Review lesson" on the finish
  // screen). Purely local — completion has already been saved.
  function restart() {
    const full = initialCompleted || done
    const nextCompleted = full
      ? new Set(Array.from({ length: lesson.steps.length }, (_, i) => i))
      : new Set<number>()
    setStarted(full || !lesson.intro)
    setStepIndex(0)
    setCompletedSteps(nextCompleted)
    setFurthestStepIndex(full ? lesson.steps.length - 1 : 0)
    setSolvedNow(nextCompleted.has(0))
    setDone(false)
  }

  function moveCompletionSpark(event: PointerEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect()
    event.currentTarget.style.setProperty('--spark-x', `${event.clientX - rect.left}px`)
    event.currentTarget.style.setProperty('--spark-y', `${event.clientY - rect.top}px`)
  }

  function resetCompletionSpark(event: PointerEvent<HTMLDivElement>) {
    event.currentTarget.style.removeProperty('--spark-x')
    event.currentTarget.style.removeProperty('--spark-y')
  }

  if (lesson.intro && !started) {
    return (
      <div className="runner runner--intro">
        <div className="runner__intro-decor optic-decor" aria-hidden="true" />
        <h3 className="intro__heading">{lesson.intro.heading}</h3>
        {lesson.intro.animation === 'focus' && <RayFocusExplainer />}
        {lesson.intro.animation === 'source' && <RaySourceExplainer />}
        {lesson.intro.animation === 'convex' && <ConvexLensExplainer />}
        {lesson.intro.animation === 'concave' && <ConcaveLensExplainer />}
        {lesson.intro.animation === 'curvature' && <CurvatureExplainer />}
        {lesson.intro.paragraphs.map((p, i) => (
          <p key={i} className="intro__para">
            {renderRich(p)}
          </p>
        ))}
        <div className="runner__actions">
          <button type="button" className="btn btn--primary" onClick={() => setStarted(true)}>
            Start lesson
          </button>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div
        className="runner runner--done"
        role="status"
        onPointerMove={moveCompletionSpark}
        onPointerLeave={resetCompletionSpark}
      >
        <div className="runner__finish-decor" aria-hidden="true">
          <span className="runner__spark runner__spark--one" />
          <span className="runner__spark runner__spark--two" />
          <span className="runner__spark runner__spark--three" />
        </div>
        <div className="runner__celebrate" aria-hidden="true">
          <span className="complete-mark__beam complete-mark__beam--top" />
          <span className="complete-mark__beam complete-mark__beam--mid" />
          <span className="complete-mark__beam complete-mark__beam--bottom" />
          <span className="complete-mark__lens" />
          <span className="complete-mark__focus" />
          <span className="complete-mark__check">✓</span>
        </div>
        <h2>Lesson complete!</h2>
        <p>You finished “{lesson.title}”. Nice work — you're really getting this.</p>
        <div className="runner__actions runner__actions--done">
          {onNextLesson && (
            <button type="button" className="btn btn--primary" onClick={onNextLesson}>
              Next lesson{nextLessonTitle ? `: ${nextLessonTitle}` : ''}
            </button>
          )}
          {onPractice && (
            <button
              type="button"
              className={onNextLesson ? 'btn' : 'btn btn--primary'}
              onClick={onPractice}
            >
              Practice problems
            </button>
          )}
          <button type="button" className="btn" onClick={restart}>
            Review lesson
          </button>
          {onExit && (
            <button type="button" className="btn" onClick={onExit}>
              Back to roadmap
            </button>
          )}
        </div>
      </div>
    )
  }

  const total = lesson.steps.length
  const filled = Math.max(completedSteps.size, stepIndex + (solvedNow ? 1 : 0))
  const pct = Math.round((filled / total) * 100)
  const canGoBack = stepIndex > 0
  const canGoForward = stepIndex < furthestStepIndex

  return (
    <div className="runner">
      <div className="runner__progress">
        <div className="runner__progress-head">
          <div className="runner__step-nav" aria-label="Step navigation">
            <button
              type="button"
              className="runner__step-btn"
              onClick={previous}
              disabled={!canGoBack}
              aria-label="Previous step"
              title="Previous step"
            >
              ←
            </button>
            <span>
              Step {stepIndex + 1} of {total}
            </span>
            <button
              type="button"
              className="runner__step-btn"
              onClick={forwardToReachedStep}
              disabled={!canGoForward}
              aria-label="Next reached step"
              title="Next reached step"
            >
              →
            </button>
          </div>
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

      <StepView
        key={stepIndex}
        step={lesson.steps[stepIndex]}
        stepAlreadyCompleted={completedSteps.has(stepIndex)}
        nextLabel={isLast ? 'Finish' : 'Next'}
        onNext={next}
        onSolvedChange={handleSolvedChange}
        featureNumbersTools={featureNumbersTools}
        promptNearAction={promptNearAction}
        initialMeasures={initialMeasures(lesson)}
      />
    </div>
  )
}
