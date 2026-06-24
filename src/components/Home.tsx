import { useEffect, useState } from 'react'
import type { LessonDefinition } from '../content'
import type { ProgressState } from '../data/useProgress'
import { deriveChapterStatus, type LessonStatusView } from '../data/lessonStatus'
import { renderRich } from '../content/richText'
import { avatarGlyph } from '../data/appearance'
import {
  deriveMilestones,
  earnedMilestoneIds,
  type Milestone,
} from '../data/milestones'
import { Settings } from './Settings'
import { ConfirmDialog } from './ConfirmDialog'
import { Logo } from './Logo'
import { AccountMenu } from './AccountMenu'
import './Home.css'

interface HomeProps {
  uid: string
  displayName: string
  progress: ProgressState
  chapter: { id: string; title: string }
  lessons: LessonDefinition[]
  onOpen: (lessonId: string) => void
  /** Back to the topics landing page. */
  onBack: () => void
  onSignOut: () => void
}

export function Home({
  uid,
  displayName,
  progress,
  chapter,
  lessons,
  onOpen,
  onBack,
  onSignOut,
}: HomeProps) {
  const [confirmSignOut, setConfirmSignOut] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const status = deriveChapterStatus(lessons, progress.byLesson)
  const pct = status.totalCount
    ? Math.round((status.completedCount / status.totalCount) * 100)
    : 0
  const streak = progress.streak?.current ?? 0

  const milestones = deriveMilestones(status, progress.streak)
  const earnedKey = earnedMilestoneIds(milestones).join(',')
  const [celebrate, setCelebrate] = useState<Milestone[]>([])
  // Pop a small celebration when milestones are newly earned. We remember the
  // earned set per user in localStorage; the first visit seeds it silently so we
  // only celebrate things earned *after* this point.
  useEffect(() => {
    const key = `lenslab:milestones:${uid}`
    const earned = earnedMilestoneIds(milestones)
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
    // setTimeout(0) avoids a synchronous setState during the effect.
    const show = setTimeout(() => setCelebrate(fresh), 0)
    const hide = setTimeout(() => setCelebrate([]), 5000)
    return () => {
      clearTimeout(show)
      clearTimeout(hide)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, earnedKey])

  return (
    <div className="home">
      <header className="home__bar">
        <div className="home__left">
          <button
            type="button"
            className="btn home__back"
            onClick={onBack}
            aria-label="Back to topics"
          >
            ← Topics
          </button>
          <Logo size={28} className="home__brand" />
        </div>
        <div className="home__user">
          <span className="home__streak" title="Daily streak">
            <FlameIcon /> {streak}
          </span>
          <button
            type="button"
            className="home__avatar"
            onClick={() => setSettingsOpen(true)}
            title="Account Settings"
            aria-label="Account Settings"
          >
            {avatarGlyph(progress.appearance.avatarId, (displayName[0] ?? '?').toUpperCase())}
          </button>
          <span className="home__name">{displayName}</span>
          <AccountMenu
            onOpenSettings={() => setSettingsOpen(true)}
            onSignOut={() => setConfirmSignOut(true)}
          />
        </div>
      </header>

      {settingsOpen && <Settings progress={progress} onClose={() => setSettingsOpen(false)} />}

      {celebrate.length > 0 && (
        <div className="ms-toast" role="status">
          <span className="ms-toast__confetti" aria-hidden="true" />
          <span className="ms-toast__spark" aria-hidden="true">
            🎉
          </span>
          <div className="ms-toast__body">
            <strong>Milestone unlocked!</strong>
            <span>{celebrate.map((m) => m.label).join(' · ')}</span>
          </div>
        </div>
      )}

      {confirmSignOut && (
        <ConfirmDialog
          title="Sign out?"
          message="You can sign back in anytime — your progress is saved."
          confirmLabel="Sign out"
          cancelLabel="Stay signed in"
          tone="danger"
          onConfirm={() => {
            setConfirmSignOut(false)
            onSignOut()
          }}
          onCancel={() => setConfirmSignOut(false)}
        />
      )}

      <main className="home__main">
        <section className="home__hero">
          <div className="home__hero-decor optic-decor" aria-hidden="true">
            <span className="home__hero-ring optic-lens-ring" />
            <span className="home__hero-focus" />
          </div>
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

          <div className="milestones" aria-label="Milestones">
            <ul className="milestones__strip">
              {milestones.map((m) => (
                <li
                  key={m.id}
                  className={`badge ${m.earned ? 'is-earned' : 'is-locked'}`}
                  title={m.description}
                >
                  <span className="badge__icon" aria-hidden="true">
                    {m.earned ? <CheckIcon /> : <LockIcon />}
                  </span>
                  <span className="badge__label">{m.label}</span>
                </li>
              ))}
            </ul>
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
    ? 'coming soon...'
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
        {recommended && <span className="roadmap__halo" />}
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
        {lesson.summary && <span className="roadmap__summary">{renderRich(lesson.summary)}</span>}
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
