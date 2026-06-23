import { chapter, lessons } from '../content'
import type { ProgressState } from '../data/useProgress'
import { deriveChapterStatus, type LessonStatusView } from '../data/lessonStatus'
import './Home.css'

interface HomeProps {
  displayName: string
  progress: ProgressState
  onOpen: (lessonId: string) => void
  onSignOut: () => void
}

export function Home({ displayName, progress, onOpen, onSignOut }: HomeProps) {
  const status = deriveChapterStatus(lessons, progress.byLesson)
  const pct = status.totalCount
    ? Math.round((status.completedCount / status.totalCount) * 100)
    : 0
  const streak = progress.streak?.current ?? 0

  return (
    <div className="home">
      <header className="home__bar">
        <span className="home__brand">LensLab</span>
        <div className="home__user">
          <span className="home__streak" title="Daily streak">
            <FlameIcon /> {streak}
          </span>
          <span className="home__name">{displayName}</span>
          <button type="button" className="btn home__signout" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </header>

      <main className="home__main">
        <section className="home__hero">
          <p className="home__eyebrow">Chapter</p>
          <h1 className="home__title">{chapter.title}</h1>
          <div className="home__progress">
            <div className="home__bar-track">
              <div className="home__bar-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="home__progress-label">
              {status.completedCount} / {status.totalCount} lessons
            </span>
          </div>
        </section>

        <ol className="roadmap">
          {status.items.map((item, i) => (
            <RoadmapItem
              key={item.lesson.id}
              item={item}
              index={i + 1}
              onOpen={onOpen}
            />
          ))}
        </ol>
      </main>
    </div>
  )
}

function RoadmapItem({
  item,
  index,
  onOpen,
}: {
  item: LessonStatusView
  index: number
  onOpen: (id: string) => void
}) {
  const { lesson, completed, inProgress, unlocked, recommended } = item
  const isPlaceholder = !!lesson.placeholder
  const clickable = unlocked && !isPlaceholder

  const state = completed
    ? 'done'
    : isPlaceholder
      ? 'soon'
      : !unlocked
        ? 'locked'
        : 'open'

  const statusLabel = isPlaceholder
    ? 'Coming soon'
    : completed
      ? 'Completed'
      : !unlocked
        ? 'Locked'
        : inProgress
          ? 'Continue'
          : 'Start'

  return (
    <li
      className={[
        'roadmap__item',
        `is-${state}`,
        unlocked ? 'is-reached' : '',
        recommended ? 'is-rec' : '',
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="roadmap__track" aria-hidden="true">
        <span className="roadmap__node">
          {completed ? <CheckIcon /> : clickable ? index : <LockIcon />}
        </span>
      </div>

      <button
        type="button"
        className="roadmap__card"
        disabled={!clickable}
        onClick={() => clickable && onOpen(lesson.id)}
      >
        <span className="roadmap__head">
          <span className="roadmap__title">{lesson.title}</span>
          {recommended && <span className="tag tag--rec">Recommended</span>}
        </span>
        {lesson.summary && <span className="roadmap__summary">{lesson.summary}</span>}
        <span className="roadmap__foot">
          <span className="roadmap__meta">~{lesson.estMinutes} min</span>
          <span className="roadmap__status">{statusLabel}</span>
        </span>
      </button>
    </li>
  )
}

function FlameIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        fill="#ff9f43"
        d="M12 2c1 3-1 4.5-2.5 6S7 11 8 13c.5 1 1.5 1.6 1.5 1.6s-.3-2 .8-3.2c1-1.1 1.2-1.3 1.2-1.3s.2 1.4 1.2 2.6c.9 1.1 1.5 2 1.5 3.3a4.7 4.7 0 1 1-9.4 0c0-3 2.2-4.6 3.4-7C9.3 5.4 11 4 12 2z"
      />
    </svg>
  )
}
function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 13l4 4L19 7"
      />
    </svg>
  )
}
function LockIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 2a5 5 0 0 0-5 5v3H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-1V7a5 5 0 0 0-5-5zm-3 8V7a3 3 0 1 1 6 0v3z"
      />
    </svg>
  )
}
