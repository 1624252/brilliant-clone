import { describe, it, expect } from 'vitest'
import { formImage } from './imageFormation'

describe('formImage (converging lens, f = 10)', () => {
  it('object beyond 2f: real, inverted, reduced', () => {
    const r = formImage(30, 10)
    expect(r.imageDistance).toBeCloseTo(15, 6)
    expect(r.magnification).toBeCloseTo(-0.5, 6)
    expect(r.isReal).toBe(true)
    expect(r.orientation).toBe('inverted')
    expect(r.isMagnified).toBe(false)
    expect(r.atInfinity).toBe(false)
  })

  it('object at 2f: real, inverted, same size', () => {
    const r = formImage(20, 10)
    expect(r.imageDistance).toBeCloseTo(20, 6)
    expect(r.magnification).toBeCloseTo(-1, 6)
    expect(r.isReal).toBe(true)
    expect(r.orientation).toBe('inverted')
    expect(r.isMagnified).toBe(false) // |m| == 1 is not "magnified"
  })

  it('object between f and 2f: real, inverted, magnified', () => {
    const r = formImage(15, 10)
    expect(r.imageDistance).toBeCloseTo(30, 6)
    expect(r.magnification).toBeCloseTo(-2, 6)
    expect(r.isReal).toBe(true)
    expect(r.orientation).toBe('inverted')
    expect(r.isMagnified).toBe(true)
  })

  it('object at the focal point: image at infinity', () => {
    const r = formImage(10, 10)
    expect(r.atInfinity).toBe(true)
    expect(r.isReal).toBe(false)
    expect(Number.isFinite(r.imageDistance)).toBe(false)
  })

  it('object inside f: virtual, upright, magnified (a magnifying glass)', () => {
    const r = formImage(5, 10)
    expect(r.imageDistance).toBeCloseTo(-10, 6)
    expect(r.magnification).toBeCloseTo(2, 6)
    expect(r.isReal).toBe(false)
    expect(r.orientation).toBe('upright')
    expect(r.isMagnified).toBe(true)
  })
})

describe('formImage (diverging lens, f = -10)', () => {
  it('always virtual, upright, reduced for a real object', () => {
    for (const objectDistance of [5, 10, 20, 50]) {
      const r = formImage(objectDistance, -10)
      expect(r.isReal).toBe(false)
      expect(r.orientation).toBe('upright')
      expect(r.isMagnified).toBe(false)
      expect(r.imageDistance).toBeLessThan(0)
      expect(r.magnification).toBeGreaterThan(0)
      expect(r.magnification).toBeLessThan(1)
    }
  })
})
