import { describe, expect, it } from 'vitest'
import { distanceToSlider, sliderToDistance } from './logDistance'
import type { Control } from './types'

const control: Control = {
  key: 'objectDistance',
  type: 'drag-axis',
  min: 0,
  max: 80,
  step: 0.5,
  allowInfinity: true,
  snaps: [0, 20, 40, 60],
}

describe('log-distance slider mapping', () => {
  it('maps the slider start to zero object distance', () => {
    expect(sliderToDistance(0, control)).toBe(0)
  })

  it('round-trips the focal-point distance through the nonlinear slider', () => {
    const sliderPosition = distanceToSlider(20, control)
    expect(sliderPosition).toBeGreaterThan(0)
    expect(sliderPosition).toBeLessThan(control.max)
    expect(sliderToDistance(sliderPosition, control)).toBeCloseTo(20)
  })

  it('approaches infinity at the far end', () => {
    expect(sliderToDistance(control.max, control)).toBe(Infinity)
    expect(distanceToSlider(Infinity, control)).toBe(control.max)
  })

  it('uses the slider fraction as a logarithmic 0-to-infinity curve', () => {
    const q1 = sliderToDistance(20, control) // t = 0.25 -> 20 * log_0.15(0.75)
    const mid = sliderToDistance(40, control) // t = 0.5 -> 20 * log_0.15(0.5)
    const q3 = sliderToDistance(60, control) // t = 0.75 -> 20 * log_0.15(0.25)

    expect(q1).toBeCloseTo(20 * (Math.log(0.75) / Math.log(0.15)))
    expect(mid).toBeCloseTo(20 * (Math.log(0.5) / Math.log(0.15)))
    expect(q3).toBeCloseTo(20 * (Math.log(0.25) / Math.log(0.15)))
    expect(q3 - mid).toBeGreaterThan(mid - q1)
  })

  it('places focal-length snap marks on the base-0.15 curve', () => {
    expect(distanceToSlider(20, control)).toBeCloseTo(68) // 1 - 0.15
    expect(distanceToSlider(40, control)).toBeCloseTo(78.2) // 1 - 0.15^2
    expect(distanceToSlider(60, control)).toBeCloseTo(79.73) // 1 - 0.15^3
  })

  it('keeps the final finite slider step visually close to infinity', () => {
    expect(sliderToDistance(79.99, control)).toBeGreaterThan(90)
    expect(sliderToDistance(80, control)).toBe(Infinity)
  })
})
