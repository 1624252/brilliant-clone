import { useState } from 'react'
import { lessons, topics } from '../content'
import type { ProgressState } from '../data/useProgress'
import { deriveChapterStatus } from '../data/lessonStatus'
import { Settings } from './Settings'
import { ConfirmDialog } from './ConfirmDialog'
import { Logo } from './Logo'
import './Topics.css'

interface TopicsProps {
  displayName: string
  progress: ProgressState
  onOpenTopic: (topicId: string) => void
  onSignOut: () => void
}

/** Landing page: pick a subject to study. Today only the lenses topic is live. */
export function Topics({ displayName, progress, onOpenTopic, onSignOut }: TopicsProps) {
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [confirmSignOut, setConfirmSignOut] = useState(false)
  const streak = progress.streak?.current ?? 0

  // Progress for the (single) lenses topic, to show on its card.
  const status = deriveChapterStatus(lessons, progress.byLesson)

  return (
    <div className="topics">
      <header className="topics__bar">
        <Logo size={28} className="topics__brand" />
        <div className="topics__user">
          <span className="topics__streak" title="Daily streak">
            <FlameIcon /> {streak}
          </span>
          <button
            type="button"
            className="topics__avatar"
            onClick={() => setSettingsOpen(true)}
            title="Account settings"
            aria-label="Account settings"
          >
            {(displayName[0] ?? '?').toUpperCase()}
          </button>
          <span className="topics__name">{displayName}</span>
          <button
            type="button"
            className="btn topics__settings"
            onClick={() => setSettingsOpen(true)}
            aria-label="Account settings"
            title="Account settings"
          >
            ⚙
          </button>
          <button
            type="button"
            className="btn topics__signout"
            onClick={() => setConfirmSignOut(true)}
          >
            Sign out
          </button>
        </div>
      </header>

      {settingsOpen && <Settings onClose={() => setSettingsOpen(false)} />}

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

      <main className="topics__main">
        <section className="topics__hero">
          <div className="topics__hero-decor optic-decor" aria-hidden="true">
            <span className="topics__lens-ring optic-lens-ring" />
            <span className="topics__beam topics__beam--one" />
            <span className="topics__beam topics__beam--two" />
          </div>
          <p className="topics__eyebrow">Welcome{displayName ? `, ${displayName}` : ''} 👋</p>
          <h1 className="topics__title">Choose a topic</h1>
          <p className="topics__sub">Pick a subject to start learning. More are on the way.</p>
        </section>

        <ul className="topic-grid">
          {topics.map((t) => {
            const pct = status.totalCount
              ? Math.round((status.completedCount / status.totalCount) * 100)
              : 0
            return (
              <li key={t.id}>
                <button
                  type="button"
                  className="topic-card"
                  disabled={!t.available}
                  onClick={() => t.available && onOpenTopic(t.id)}
                >
                  <span className="topic-card__sweep" aria-hidden="true" />
                  <span className="topic-card__icon" aria-hidden="true">
                    <LensIcon />
                  </span>
                  <span className="topic-card__title">{t.title}</span>
                  <span className="topic-card__blurb">{t.blurb}</span>
                  {t.available && (
                    <span className="topic-card__progress">
                      <span className="topic-card__bar">
                        <span className="topic-card__fill" style={{ width: `${pct}%` }} />
                      </span>
                      <span className="topic-card__meta">
                        {status.completedCount} / {status.totalCount} lessons
                      </span>
                    </span>
                  )}
                  <span className="topic-card__cta">
                    {t.available ? 'Start learning →' : 'coming soon...'}
                  </span>
                </button>
              </li>
            )
          })}

          {/* A gentle hint that the catalog will grow. */}
          <li>
            <div className="topic-card topic-card--soon" aria-hidden="true">
              <span className="topic-card__sweep" aria-hidden="true" />
              <span className="topic-card__icon">✨</span>
              <span className="topic-card__title">More topics coming soon...</span>
              <span className="topic-card__blurb">
                Waves, electricity, mechanics, and more are on the roadmap.
              </span>
            </div>
          </li>
        </ul>
      </main>
    </div>
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

function LensIcon() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
      <ellipse
        cx="12"
        cy="12"
        rx="5"
        ry="9"
        fill="rgba(140,194,255,0.25)"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <line x1="1" y1="12" x2="23" y2="12" stroke="currentColor" strokeWidth="1.2" opacity="0.6" />
    </svg>
  )
}
