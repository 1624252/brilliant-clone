import { describe, it, expect } from 'vitest'
import { makeRng } from './rng'

describe('makeRng', () => {
  it('is deterministic for a given seed', () => {
    const a = makeRng(42)
    const b = makeRng(42)
    const seqA = Array.from({ length: 8 }, () => a.next())
    const seqB = Array.from({ length: 8 }, () => b.next())
    expect(seqA).toEqual(seqB)
  })

  it('produces different sequences for different seeds', () => {
    const a = Array.from({ length: 8 }, () => makeRng(1).next())
    const b = Array.from({ length: 8 }, () => makeRng(2).next())
    expect(a).not.toEqual(b)
  })

  it('keeps int() within the inclusive range', () => {
    const rng = makeRng(7)
    for (let i = 0; i < 500; i++) {
      const v = rng.int(3, 9)
      expect(v).toBeGreaterThanOrEqual(3)
      expect(v).toBeLessThanOrEqual(9)
      expect(Number.isInteger(v)).toBe(true)
    }
  })

  it('pick() returns an element of the array', () => {
    const rng = makeRng(11)
    const items = ['a', 'b', 'c'] as const
    for (let i = 0; i < 100; i++) expect(items).toContain(rng.pick(items))
  })
})
