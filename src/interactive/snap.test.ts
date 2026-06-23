import { describe, it, expect } from 'vitest'
import { snapValue } from './snap'

describe('snapValue', () => {
  const snaps = [0, 20, 40, 60]

  it('snaps to the nearest point within the default threshold', () => {
    expect(snapValue(19.5, snaps)).toBe(20)
    expect(snapValue(20.8, snaps)).toBe(20)
    expect(snapValue(0.4, snaps)).toBe(0)
  })

  it('does not snap when outside the threshold', () => {
    expect(snapValue(25, snaps)).toBe(25)
  })

  it('returns the value unchanged when there are no snaps', () => {
    expect(snapValue(33, undefined)).toBe(33)
    expect(snapValue(33, [])).toBe(33)
  })

  it('passes non-finite values through untouched', () => {
    expect(snapValue(Infinity, snaps)).toBe(Infinity)
  })

  it('respects a custom threshold', () => {
    expect(snapValue(23, snaps, 5)).toBe(20) // within 5 of 20
    expect(snapValue(23, snaps, 1)).toBe(23) // not within 1
  })

  it('chooses the closest of two nearby snaps', () => {
    expect(snapValue(10, [8, 11], 5)).toBe(11) // |10-11| < |10-8|
  })
})
