import { ProblemRunner } from '../content'
import type { LessonDefinition } from '../content'
import { completeLesson, saveStepProgress } from '../data/progress'
import type { ProgressState } from '../data/useProgress'
import './LessonView.css'

interface LessonViewProps {
  lesson: LessonDefinition
  lessons: LessonDefinition[]
  uid: string
  progress: ProgressState
  onBack: () => void
  /** Navigate to another lesson (used by the "Next lesson" finish button). */
  onOpenLesson: (lessonId: string) => void
}

export function LessonView({
  lesson,
  lessons,
  uid,
  progress,
  onBack,
  onOpenLesson,
}: LessonViewProps) {
  const saved = progress.byLesson[lesson.id]
  const completedBefore = saved?.status === 'completed'
  // In-progress lessons resume where the learner left off; completed lessons
  // reopen from step 1 while preserving completed progress in the runner.
  const resumeIndex = saved && !completedBefore ? saved.currentStepIndex : 0

  // The next real (non-placeholder) lesson by order, if any.
  const ordered = [...lessons]
    .filter((l) => !l.placeholder)
    .sort((a, b) => a.order - b.order)
  const pos = ordered.findIndex((l) => l.id === lesson.id)
  const nextLesson = pos >= 0 ? ordered[pos + 1] : undefined

  return (
    <div className="lessonview">
      <header className="lessonview__bar">
        <button type="button" className="btn lessonview__back" onClick={onBack}>
          ← Lessons
        </button>
        <span className="lessonview__title">{lesson.title}</span>
        <span className="lessonview__spacer" />
      </header>

      <main className="lessonview__main">
        <section className="card">
          <ProblemRunner
            // Remount on lesson change so state resets when moving to the next one.
            key={lesson.id}
            lesson={lesson}
            initialStepIndex={resumeIndex}
            initialCompleted={completedBefore}
            // Persistence is best-effort: a write failure shouldn't break the lesson.
            onStepChange={(i) => {
              void saveStepProgress(uid, lesson.id, i).catch(() => {})
            }}
            onComplete={() => {
              void completeLesson(uid, lesson.id).catch(() => {})
            }}
            onExit={onBack}
            onNextLesson={
              nextLesson ? () => onOpenLesson(nextLesson.id) : undefined
            }
            nextLessonTitle={nextLesson?.title}
          />
        </section>
      </main>
    </div>
  )
}
