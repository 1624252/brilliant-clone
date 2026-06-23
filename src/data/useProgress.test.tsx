import { describe, it, expect, beforeEach, vi } from 'vitest'
import { act, renderHook } from '@testing-library/react'
import type { LessonProgress, Streak } from './progress'

// A fake firestore reference our mocked SDK hands back. We only need enough
// identity to tell collection-vs-doc apart and to recover which uid it targets.
interface FakeRef {
  kind: 'collection' | 'doc'
  path: string[]
}

interface Listener {
  ref: FakeRef
  active: boolean
  /** Deliver a snapshot, mirroring Firebase: a no-op once unsubscribed. */
  deliver: (snap: unknown) => void
}

const listeners: Listener[] = []

vi.mock('../firebase/config', () => ({ db: {} }))

vi.mock('firebase/firestore', () => ({
  collection: (_db: unknown, ...path: string[]): FakeRef => ({
    kind: 'collection',
    path,
  }),
  doc: (_db: unknown, ...path: string[]): FakeRef => ({ kind: 'doc', path }),
  onSnapshot: (ref: FakeRef, next: (snap: unknown) => void) => {
    const listener: Listener = {
      ref,
      active: true,
      // Firebase stops invoking the callback after unsubscribe; model that here.
      deliver: (snap) => {
        if (listener.active) next(snap)
      },
    }
    listeners.push(listener)
    return () => {
      listener.active = false
    }
  },
}))

// Import after the mocks are registered so the hook picks them up.
const { useProgress } = await import('./useProgress')

/** Most recently registered, still-active listener of a kind for a given uid. */
function listenerFor(kind: FakeRef['kind'], uid: string): Listener {
  const found = [...listeners]
    .reverse()
    .find((l) => l.active && l.ref.kind === kind && l.ref.path.includes(uid))
  if (!found) throw new Error(`no active ${kind} listener for ${uid}`)
  return found
}

/** Deliver a progress-collection snapshot for a user. */
function emitProgress(uid: string, byLesson: Record<string, LessonProgress>) {
  const l = listenerFor('collection', uid)
  act(() => {
    l.deliver({
      forEach: (cb: (d: { id: string; data: () => LessonProgress }) => void) =>
        Object.entries(byLesson).forEach(([id, data]) =>
          cb({ id, data: () => data }),
        ),
    })
  })
}

/** Deliver a user-doc snapshot (carrying the streak) for a user. */
function emitStreak(uid: string, streak: Streak | undefined) {
  const l = listenerFor('doc', uid)
  act(() => {
    l.deliver({ data: () => (streak ? { streak } : {}) })
  })
}

const completed = (lessonId: string): LessonProgress => ({
  lessonId,
  status: 'completed',
  currentStepIndex: 0,
})

const streakOf = (current: number): Streak => ({
  current,
  longest: current,
  lastActiveDate: '2026-06-23',
})

beforeEach(() => {
  listeners.length = 0
})

describe('useProgress', () => {
  it('starts in a loading state with no data', () => {
    const { result } = renderHook(() => useProgress('userA'))
    expect(result.current.loading).toBe(true)
    expect(result.current.byLesson).toEqual({})
    expect(result.current.streak).toBeNull()
  })

  it('populates progress and streak when snapshots arrive', () => {
    const { result } = renderHook(() => useProgress('userA'))

    emitProgress('userA', { 'focusing-light': completed('focusing-light') })
    emitStreak('userA', streakOf(3))

    expect(result.current.loading).toBe(false)
    expect(result.current.byLesson['focusing-light']).toEqual(
      completed('focusing-light'),
    )
    expect(result.current.streak).toEqual(streakOf(3))
  })

  it('clears the previous user data immediately when switching accounts', () => {
    const { result, rerender } = renderHook(({ uid }) => useProgress(uid), {
      initialProps: { uid: 'userA' },
    })

    // User A finishes a lesson and builds a streak.
    emitProgress('userA', { 'focusing-light': completed('focusing-light') })
    emitStreak('userA', streakOf(5))
    expect(result.current.byLesson['focusing-light']).toBeDefined()
    expect(result.current.streak).toEqual(streakOf(5))

    // User B signs in. Before B's snapshot lands, none of A's data may show.
    rerender({ uid: 'userB' })
    expect(result.current.loading).toBe(true)
    expect(result.current.byLesson).toEqual({})
    expect(result.current.streak).toBeNull()

    // Once B's snapshots arrive we see only B's (empty) progress.
    emitProgress('userB', {})
    emitStreak('userB', undefined)
    expect(result.current.loading).toBe(false)
    expect(result.current.byLesson).toEqual({})
    expect(result.current.streak).toBeNull()
  })

  it('does not mix the two users data after a switch', () => {
    const { result, rerender } = renderHook(({ uid }) => useProgress(uid), {
      initialProps: { uid: 'userA' },
    })
    emitProgress('userA', { 'focusing-light': completed('focusing-light') })

    rerender({ uid: 'userB' })
    emitProgress('userB', { 'thin-lens-equation': completed('thin-lens-equation') })

    expect(result.current.byLesson['focusing-light']).toBeUndefined()
    expect(result.current.byLesson['thin-lens-equation']).toBeDefined()
  })

  it('unsubscribes the previous user listeners when switching accounts', () => {
    const { rerender } = renderHook(({ uid }) => useProgress(uid), {
      initialProps: { uid: 'userA' },
    })
    const aProgress = listenerFor('collection', 'userA')
    const aUser = listenerFor('doc', 'userA')

    rerender({ uid: 'userB' })

    expect(aProgress.active).toBe(false)
    expect(aUser.active).toBe(false)
  })

  it('ignores a late snapshot from the previous users listener', () => {
    const { result, rerender } = renderHook(({ uid }) => useProgress(uid), {
      initialProps: { uid: 'userA' },
    })
    const aProgress = listenerFor('collection', 'userA')

    rerender({ uid: 'userB' })
    emitProgress('userB', {})

    // A is unsubscribed, so a stale callback must not resurrect A's data.
    act(() => {
      aProgress.deliver({
        forEach: (cb: (d: { id: string; data: () => LessonProgress }) => void) =>
          cb({ id: 'focusing-light', data: () => completed('focusing-light') }),
      })
    })

    expect(aProgress.active).toBe(false)
    expect(result.current.byLesson['focusing-light']).toBeUndefined()
  })

  it('clears data and stops loading on sign-out (uid null)', () => {
    const { result, rerender } = renderHook(({ uid }) => useProgress(uid), {
      initialProps: { uid: 'userA' as string | null },
    })
    emitProgress('userA', { 'focusing-light': completed('focusing-light') })
    emitStreak('userA', streakOf(2))

    rerender({ uid: null })

    expect(result.current.loading).toBe(false)
    expect(result.current.byLesson).toEqual({})
    expect(result.current.streak).toBeNull()
  })

  it('resubscribes and loads again when a user signs back in', () => {
    const { result, rerender } = renderHook(({ uid }) => useProgress(uid), {
      initialProps: { uid: 'userA' as string | null },
    })
    rerender({ uid: null })

    rerender({ uid: 'userA' })
    expect(result.current.loading).toBe(true)

    emitProgress('userA', { 'focusing-light': completed('focusing-light') })
    expect(result.current.loading).toBe(false)
    expect(result.current.byLesson['focusing-light']).toBeDefined()
  })
})
