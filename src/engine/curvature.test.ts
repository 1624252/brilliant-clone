import { describe, it, expect } from 'vitest'
import { sliderToFocalLength } from './curvature'

describe('sliderToFocalLength', () => {
  it('maps the center (p = 0) to an infinite focal length (a flat lens)', () => {
    expect(sliderToFocalLength(0)).toBe(Infinity)
    expect(Number.isFinite(sliderToFocalLength(0))).toBe(false)
  })

  it('maps positive positions to converging (positive) focal lengths', () => {
    expect(sliderToFocalLength(0.5)).toBeGreaterThan(0)
    expect(sliderToFocalLength(1)).toBeGreaterThan(0)
    expect(Number.isFinite(sliderToFocalLength(0.5))).toBe(true)
  })

  it('maps negative positions to diverging (negative) focal lengths', () => {
    expect(sliderToFocalLength(-0.5)).toBeLessThan(0)
    expect(sliderToFocalLength(-1)).toBeLessThan(0)
  })

  it('is symmetric in sign', () => {
    expect(sliderToFocalLength(-0.3)).toBeCloseTo(-sliderToFocalLength(0.3))
  })

  it('approaches infinity smoothly: |f| grows as the slider nears the center', () => {
    const near = Math.abs(sliderToFocalLength(0.1))
    const mid = Math.abs(sliderToFocalLength(0.5))
    const far = Math.abs(sliderToFocalLength(1))
    expect(near).toBeGreaterThan(mid)
    expect(mid).toBeGreaterThan(far)
  })

  it('is logarithmic: equal slider steps multiply |f| by a constant factor', () => {
    const r1 = Math.abs(sliderToFocalLength(0.25)) / Math.abs(sliderToFocalLength(0.5))
    const r2 = Math.abs(sliderToFocalLength(0.5)) / Math.abs(sliderToFocalLength(0.75))
    expect(r1).toBeCloseTo(r2, 5)
  })
})
