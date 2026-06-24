import { describe, it, expect, vi, beforeEach } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { PracticeView } from './PracticeView'
import { defaultAppearance } from '../data/appearance'
import type { ProgressState } from '../data/useProgress'

// Mock the Firestore-backed data modules so the view renders without Firebase.
vi.mock('../data/practice', () => ({
  recordPracticeAttempt: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('../data/leaderboard', () => ({
  upsertLeaderboardEntry: vi.fn().mockResolvedValue(undefined),
  subscribeLeaderboard: (cb: (e: unknown[]) => void) => {
    cb([{ uid: 'me', displayName: 'Me', totalCorrect: 5 }])
    return () => {}
  },
}))

beforeEach(() => {
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {})
})

const progress: ProgressState = {
  byLesson: {},
  streak: null,
  appearance: defaultAppearance,
  practiceStats: null,
  mastery: {},
  loading: false,
}

describe('PracticeView', () => {
  it('renders a problem and stats without revealing a question total', () => {
    render(<PracticeView uid="me" displayName="Me" progress={progress} onBack={() => {}} />)

    expect(screen.getByText(/answer streak/i)).toBeInTheDocument()
    expect(screen.getByText(/accuracy/i)).toBeInTheDocument()
    // A current-topic chip is shown.
    expect((document.querySelector('.practice__topic-chip')?.textContent ?? '').length).toBeGreaterThan(0)
    // The total number of questions is never shown ("Step 1 of N", "x / N", etc.).
    expect(screen.queryByText(/\bof\s+\d+/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/\bstep\s+\d+/i)).not.toBeInTheDocument()
  })

  it('opens the global leaderboard with the current user highlighted', () => {
    render(<PracticeView uid="me" displayName="Me" progress={progress} onBack={() => {}} />)

    fireEvent.click(screen.getByRole('button', { name: /leaderboard/i }))
    expect(screen.getByRole('dialog', { name: /leaderboard/i })).toBeInTheDocument()
    expect(screen.getByText('You')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })
})
