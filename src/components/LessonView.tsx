import { ProblemRunner } from '../content'
import type { LessonDefinition } from '../content'
import { completeLesson, saveStepProgress } from '../data/progress'
import type { ProgressState } from '../data/useProgress'
import './LessonView.css'

interface LessonViewProps {
  lesson: LessonDefinition
  uid: string
  progress: ProgressState
  onBack: () => void
}

export function LessonView({ lesson, uid, progress, onBack }: LessonViewProps) {
  const saved = progress.byLesson[lesson.id]
  // Resume in-progress lessons; replay completed ones from the start (intro first).
  const resumeIndex = saved && saved.status === 'in-progress' ? saved.currentStepIndex : 0

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
            lesson={lesson}
            initialStepIndex={resumeIndex}
            // Persistence is best-effort: a write failure shouldn't break the lesson.
            onStepChange={(i) => {
              void saveStepProgress(uid, lesson.id, i).catch(() => {})
            }}
            onComplete={() => {
              void completeLesson(uid, lesson.id).catch(() => {})
            }}
          />
        </section>
      </main>
    </div>
  )
}
