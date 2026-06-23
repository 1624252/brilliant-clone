import { describe, it, expect } from 'vitest'
import { imageDistance, focalLengthFrom, lensType } from './thinLens'

describe('imageDistance (converging lens, f = 10)', () => {
  it('object beyond 2f -> real image between f and 2f', () => {
    // do = 30, f = 10 -> di = 15
    expect(imageDistance(30, 10)).toBeCloseTo(15, 6)
  })

  it('object at 2f -> image at 2f', () => {
    expect(imageDistance(20, 10)).toBeCloseTo(20, 6)
  })

  it('object between f and 2f -> real image beyond 2f', () => {
    // do = 15, f = 10 -> di = 30
    expect(imageDistance(15, 10)).toBeCloseTo(30, 6)
  })

  it('object at the focal point -> image at infinity', () => {
    expect(imageDistance(10, 10)).toBe(Infinity)
  })

  it('object inside the focal length -> virtual image (di < 0)', () => {
    // do = 5, f = 10 -> di = -10
    expect(imageDistance(5, 10)).toBeCloseTo(-10, 6)
  })
})

describe('imageDistance (diverging lens, f = -10)', () => {
  it('always forms a virtual image on the object side (di < 0)', () => {
    expect(imageDistance(10, -10)).toBeCloseTo(-5, 6)
    expect(imageDistance(20, -10)).toBeCloseTo(-20 / 3, 6)
    expect(imageDistance(5, -10)).toBeCloseTo(-10 / 3, 6)
  })
})

describe('imageDistance boundaries (engine must not die)', () => {
  it('object on the lens (do = 0) -> image at the lens (0)', () => {
    expect(imageDistance(0, 10)).toBe(0)
  })

  it('object infinitely far (do = Infinity) -> image at the focal plane (f)', () => {
    expect(imageDistance(Infinity, 10)).toBe(10)
    expect(imageDistance(Infinity, -10)).toBe(-10)
  })

  it('never returns NaN across the full range', () => {
    for (const doVal of [0, 0.0001, 5, 10, 20, 1000, Infinity]) {
      expect(Number.isNaN(imageDistance(doVal, 10))).toBe(false)
    }
  })

  it('throws on zero focal length', () => {
    expect(() => imageDistance(30, 0)).toThrow(RangeError)
  })
})

describe('focalLengthFrom (inverse problem)', () => {
  it('recovers f from object and image distances', () => {
    // do = 30, di = 15 -> f = 10
    expect(focalLengthFrom(30, 15)).toBeCloseTo(10, 6)
  })

  it('is consistent with imageDistance round-trip', () => {
    const f = 12.5
    const di = imageDistance(40, f)
    expect(focalLengthFrom(40, di)).toBeCloseTo(f, 6)
  })

  it('throws on zero distances', () => {
    expect(() => focalLengthFrom(0, 15)).toThrow(RangeError)
    expect(() => focalLengthFrom(30, 0)).toThrow(RangeError)
  })
})

describe('lensType', () => {
  it('classifies by sign of focal length', () => {
    expect(lensType(10)).toBe('converging')
    expect(lensType(-10)).toBe('diverging')
  })

  it('throws on zero focal length', () => {
    expect(() => lensType(0)).toThrow(RangeError)
  })
})
