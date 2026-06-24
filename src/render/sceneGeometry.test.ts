import { describe, it, expect } from 'vitest'
import {
  DEFAULT_SCENE,
  scaleOf,
  sceneRightX,
  toSvg,
  svgXToOpticalX,
} from './sceneGeometry'

describe('sceneGeometry (default scene)', () => {
  it('uses a consistent, undistorted scale on both axes', () => {
    // 300/60 == 200/40 == 5 px per optical unit
    expect(scaleOf(DEFAULT_SCENE)).toBe(5)
  })

  it('maps the optical origin (lens center) to the SVG center', () => {
    expect(toSvg({ x: 0, y: 0 }, DEFAULT_SCENE)).toEqual({ x: 300, y: 200 })
  })

  it('maps +x right and +y up (SVG y is flipped)', () => {
    expect(toSvg({ x: 10, y: 0 }, DEFAULT_SCENE)).toEqual({ x: 350, y: 200 })
    expect(toSvg({ x: 0, y: 10 }, DEFAULT_SCENE)).toEqual({ x: 300, y: 150 })
  })

  it('reports the right edge in optical units', () => {
    expect(sceneRightX(DEFAULT_SCENE)).toBe(60)
  })

  it('inverts the x mapping (round-trip)', () => {
    const svg = toSvg({ x: 37, y: 0 }, DEFAULT_SCENE)
    expect(svgXToOpticalX(svg.x, DEFAULT_SCENE)).toBeCloseTo(37, 6)
  })
})
