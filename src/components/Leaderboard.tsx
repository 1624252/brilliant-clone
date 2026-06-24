import { useEffect, useState } from 'react'
import { subscribeLeaderboard, type LeaderboardEntry } from '../data/leaderboard'
import './Leaderboard.css'

interface LeaderboardProps {
  /** Current user, highlighted in the list. */
  uid: string
  onClose: () => void
}

export function Leaderboard({ uid, onClose }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[] | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => subscribeLeaderboard(setEntries, () => setFailed(true)), [])

  // Close on Escape for keyboard users.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const youRank = entries?.findIndex((e) => e.uid === uid) ?? -1

  return (
    <div className="lb-backdrop" role="presentation" onClick={onClose}>
      <div
        className="lb card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="lb-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="lb__head">
          <h2 id="lb-title">🏆 Leaderboard</h2>
          <button type="button" className="lb__close" onClick={onClose} aria-label="Close leaderboard">
            ×
          </button>
        </header>
        <p className="lb__sub">Top learners by correct practice answers.</p>

        {failed ? (
          <p className="lb__empty">
            Couldn’t load the leaderboard. If you’re running locally, deploy the Firestore rules
            first.
          </p>
        ) : entries === null ? (
          <p className="lb__empty">Loading…</p>
        ) : entries.length === 0 ? (
          <p className="lb__empty">No scores yet — be the first to answer a question!</p>
        ) : (
          <ol className="lb__list">
            {entries.map((entry, i) => (
              <li
                key={entry.uid}
                className={`lb__row ${entry.uid === uid ? 'is-you' : ''} ${i < 3 ? 'is-top' : ''}`}
              >
                <span className="lb__rank">{i + 1}</span>
                <span className="lb__name">
                  {entry.displayName}
                  {entry.uid === uid && <span className="lb__you-tag">You</span>}
                </span>
                <span className="lb__score">{entry.totalCorrect}</span>
              </li>
            ))}
          </ol>
        )}

        {entries && youRank === -1 && !failed && (
          <p className="lb__note">Answer a question correctly to claim your spot.</p>
        )}
      </div>
    </div>
  )
}
