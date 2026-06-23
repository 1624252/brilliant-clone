import { describe, it, expect } from 'vitest'
import { magnification, orientationOf } from './magnification'

describe('magnification', () => {
  it('is negative (inverted) for a real image', () => {
    // do = 30, di = 15 -> m = -0.5
    expect(magnification(30, 15)).toBeCloseTo(-0.5, 6)
  })

  it('is -1 for an object at 2f', () => {
    expect(magnification(20, 20)).toBeCloseTo(-1, 6)
  })

  it('is positive (upright) for a virtual image', () => {
    // do = 5, di = -10 -> m = 2
    expect(magnification(5, -10)).toBeCloseTo(2, 6)
  })

  it('returns Infinity when the image is at infinity', () => {
    expect(magnification(10, Infinity)).toBe(Infinity)
  })

  it('throws on zero object distance', () => {
    expect(() => magnification(0, 15)).toThrow(RangeError)
  })
})

describe('orientationOf', () => {
  it('maps sign to orientation', () => {
    expect(orientationOf(-0.5)).toBe('inverted')
    expect(orientationOf(2)).toBe('upright')
    expect(orientationOf(0)).toBe('upright')
  })
})
