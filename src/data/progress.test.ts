import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// In-memory Firestore stand-in. Documents are keyed by their full path so we can
// assert that different users (different uids) never touch each other's data.
const store = new Map<string, Record<string, unknown>>()

interface FakeRef {
  path: string
}

const SERVER_TS = '__serverTimestamp__'

/** Shallow top-level merge, matching how these functions use setDoc(merge). */
function applyWrite(path: string, data: Record<string, unknown>, merge: boolean) {
  if (merge && store.has(path)) {
    store.set(path, { ...store.get(path), ...data })
  } else {
    store.set(path, { ...data })
  }
}

vi.mock('../firebase/config', () => ({ db: {} }))

vi.mock('firebase/firestore', () => ({
  doc: (_db: unknown, ...segments: string[]): FakeRef => ({
    path: segments.join('/'),
  }),
  getDoc: async (ref: FakeRef) => {
    const data = store.get(ref.path)
    return {
      exists: () => store.has(ref.path),
      data: () => data,
    }
  },
  setDoc: async (
    ref: FakeRef,
    data: Record<string, unknown>,
    opts?: { merge?: boolean },
  ) => {
    applyWrite(ref.path, data, !!opts?.merge)
  },
  serverTimestamp: () => SERVER_TS,
}))

const {
  bumpStreak,
  completeLesson,
  ensureUserDoc,
  saveStepProgress,
  localDay,
} = await import('./progress')

const userPath = (uid: string) => `users/${uid}`
const progressPath = (uid: string, lessonId: string) =>
  `users/${uid}/progress/${lessonId}`

const streakOf = (uid: string) =>
  store.get(userPath(uid))?.streak as
    | { current: number; longest: number; lastActiveDate: string }
    | undefined

beforeEach(() => {
  store.clear()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('localDay', () => {
  it('formats today as YYYY-MM-DD in local time', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 23, 13, 40)) // June 23, 2026, local
    expect(localDay()).toBe('2026-06-23')
  })

  it('offsets by whole days (yesterday)', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 23, 0, 30))
    expect(localDay(-1)).toBe('2026-06-22')
  })

  it('handles month boundaries when offsetting', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 1, 1, 0)) // July 1
    expect(localDay(-1)).toBe('2026-06-30')
  })
})

describe('ensureUserDoc', () => {
  it('creates a fresh profile with a zeroed streak', async () => {
    await ensureUserDoc('userA', 'Ada', 'ada@example.com')
    const doc = store.get(userPath('userA'))!
    expect(doc.displayName).toBe('Ada')
    expect(doc.email).toBe('ada@example.com')
    expect(doc.streak).toEqual({ current: 0, longest: 0, lastActiveDate: '' })
  })

  it('updates name/email without clobbering an existing streak', async () => {
    await ensureUserDoc('userA', 'Ada', 'ada@example.com')
    // Simulate progress that built a streak.
    store.set(userPath('userA'), {
      ...store.get(userPath('userA')),
      streak: { current: 4, longest: 9, lastActiveDate: '2026-06-20' },
    })

    await ensureUserDoc('userA', 'Ada Lovelace', 'ada@new.com')

    const doc = store.get(userPath('userA'))!
    expect(doc.displayName).toBe('Ada Lovelace')
    expect(doc.email).toBe('ada@new.com')
    expect(doc.streak).toEqual({ current: 4, longest: 9, lastActiveDate: '2026-06-20' })
  })
})

describe('bumpStreak', () => {
  it('starts a streak at 1 on the first active day', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 23, 9, 0))
    await ensureUserDoc('userA', 'Ada', 'ada@example.com')

    await bumpStreak('userA')

    expect(streakOf('userA')).toEqual({
      current: 1,
      longest: 1,
      lastActiveDate: '2026-06-23',
    })
  })

  it('does not double-count within the same day', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 23, 9, 0))
    await ensureUserDoc('userA', 'Ada', 'ada@example.com')

    await bumpStreak('userA')
    await bumpStreak('userA')

    expect(streakOf('userA')?.current).toBe(1)
  })

  it('increments on a consecutive day', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 23, 9, 0))
    await ensureUserDoc('userA', 'Ada', 'ada@example.com')
    await bumpStreak('userA')

    vi.setSystemTime(new Date(2026, 5, 24, 9, 0)) // next day
    await bumpStreak('userA')

    expect(streakOf('userA')).toEqual({
      current: 2,
      longest: 2,
      lastActiveDate: '2026-06-24',
    })
  })

  it('resets to 1 after a missed day but keeps the longest', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 23, 9, 0))
    await ensureUserDoc('userA', 'Ada', 'ada@example.com')
    await bumpStreak('userA') // day 1
    vi.setSystemTime(new Date(2026, 5, 24, 9, 0))
    await bumpStreak('userA') // day 2 -> current 2, longest 2

    vi.setSystemTime(new Date(2026, 5, 26, 9, 0)) // skipped the 25th
    await bumpStreak('userA')

    expect(streakOf('userA')).toEqual({
      current: 1,
      longest: 2,
      lastActiveDate: '2026-06-26',
    })
  })

  it('tolerates a missing profile doc (no prior streak)', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 23, 9, 0))

    await bumpStreak('userA') // never called ensureUserDoc

    expect(streakOf('userA')).toEqual({
      current: 1,
      longest: 1,
      lastActiveDate: '2026-06-23',
    })
  })

  it('keeps each user streak independent', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 23, 9, 0))
    await ensureUserDoc('userA', 'Ada', 'ada@example.com')
    await ensureUserDoc('userB', 'Babbage', 'b@example.com')

    // User A is active two days in a row.
    await bumpStreak('userA')
    vi.setSystemTime(new Date(2026, 5, 24, 9, 0))
    await bumpStreak('userA')

    // User B only shows up on the second day.
    await bumpStreak('userB')

    expect(streakOf('userA')?.current).toBe(2)
    expect(streakOf('userB')?.current).toBe(1)
  })
})

describe('saveStepProgress', () => {
  it('writes resume state under the user/lesson path', async () => {
    await saveStepProgress('userA', 'thin-lens-equation', 3)
    const doc = store.get(progressPath('userA', 'thin-lens-equation'))!
    expect(doc).toMatchObject({
      lessonId: 'thin-lens-equation',
      status: 'in-progress',
      currentStepIndex: 3,
    })
  })

  it('keeps progress separate per user', async () => {
    await saveStepProgress('userA', 'thin-lens-equation', 3)
    await saveStepProgress('userB', 'thin-lens-equation', 0)

    expect(
      store.get(progressPath('userA', 'thin-lens-equation'))?.currentStepIndex,
    ).toBe(3)
    expect(
      store.get(progressPath('userB', 'thin-lens-equation'))?.currentStepIndex,
    ).toBe(0)
  })

  it('does not downgrade a completed lesson when replay progress is saved', async () => {
    await completeLesson('userA', 'thin-lens-equation')
    await saveStepProgress('userA', 'thin-lens-equation', 1)

    const doc = store.get(progressPath('userA', 'thin-lens-equation'))!
    expect(doc.status).toBe('completed')
    expect(doc.currentStepIndex).toBe(1)
  })
})

describe('completeLesson', () => {
  it('marks the lesson completed and bumps the streak', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 23, 9, 0))
    await ensureUserDoc('userA', 'Ada', 'ada@example.com')

    await completeLesson('userA', 'focusing-light')

    expect(store.get(progressPath('userA', 'focusing-light'))).toMatchObject({
      lessonId: 'focusing-light',
      status: 'completed',
    })
    expect(streakOf('userA')?.current).toBe(1)
  })

  it('preserves the resume index when completing an in-progress lesson', async () => {
    await saveStepProgress('userA', 'focusing-light', 2)
    await completeLesson('userA', 'focusing-light')

    const doc = store.get(progressPath('userA', 'focusing-light'))!
    expect(doc.status).toBe('completed')
    // merge:true means the earlier currentStepIndex is not wiped out.
    expect(doc.currentStepIndex).toBe(2)
  })
})

