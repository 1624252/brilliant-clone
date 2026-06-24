import { describe, it, expect } from 'vitest'
import {
  constructionPoints,
  drawnRayChecks,
  imageTip,
  rayChecks,
  type DrawnRays,
  type PlotScene,
} from './plotRays'

// Object beyond 2F (the ray-tracing lesson scene): f=20, do=60 -> di=30, m=-0.5.
const scene: PlotScene = { objectDistance: 60, focalLength: 20, objectHeight: 18 }
const virtualScene: PlotScene = { objectDistance: 12, focalLength: 20, objectHeight: 18 }

describe('plotRays geometry', () => {
  it('locates the true image tip from the engine', () => {
    const I = imageTip(scene)
    expect(I.x).toBeCloseTo(30, 5)
    expect(I.y).toBeCloseTo(-9, 5)
  })

  it('satisfies all three ray rules exactly at the image tip', () => {
    const checks = rayChecks(imageTip(scene), scene)
    expect(checks).toEqual({ chief: true, parallel: true, focal: true, all: true })
  })

  it('fails when the marker is far from the crossing', () => {
    expect(rayChecks({ x: 60, y: 12 }, scene).all).toBe(false)
    expect(rayChecks({ x: 15, y: 0 }, scene).all).toBe(false)
  })

  it('requires the marker on the far (image) side of the lens', () => {
    // Mirror of the image tip on the near side should not count.
    expect(rayChecks({ x: -30, y: -9 }, scene).all).toBe(false)
  })

  it('supports virtual image tips on the candle side', () => {
    const I = imageTip(virtualScene)
    expect(I.x).toBeCloseTo(-30, 5)
    expect(I.y).toBeCloseTo(45, 5)
    expect(rayChecks(I, virtualScene).all).toBe(true)
    expect(rayChecks({ x: 30, y: 45 }, virtualScene).all).toBe(false)
  })

  it('flags individual rules independently', () => {
    // On the chief line (object→center) but wrong height: only chief holds.
    // Chief line passes O(0,0) and P(-60,18); at x=30 -> y = -9 (that's the tip),
    // so pick a point on the line away from the tip: x=10 -> y=-3.
    const onChief = rayChecks({ x: 10, y: -3 }, scene)
    expect(onChief.chief).toBe(true)
    expect(onChief.all).toBe(false)
  })

  it('validates drawn ray start and endpoint rules', () => {
    const pts = constructionPoints(scene)
    const rays: DrawnRays = {
      parallel: { start: pts.parallelStart, end: { x: 50, y: -27 } },
      chief: { start: pts.chiefStart, end: { x: 50, y: -15 } },
      focal: { start: pts.focalStart, end: { x: 50, y: pts.focalStart.y } },
    }
    expect(drawnRayChecks(rays, scene).all).toBe(true)
    expect(
      drawnRayChecks(
        { ...rays, parallel: { ...rays.parallel, start: { x: 0, y: 5 } } },
        scene,
      ).parallel,
    ).toBe(false)
    expect(
      drawnRayChecks({ ...rays, focal: { ...rays.focal, end: { x: 50, y: 8 } } }, scene)
        .focal,
    ).toBe(false)
  })

  it('validates concave-lens drawn rays with a virtual reduced image', () => {
    const concave: PlotScene = { objectDistance: 40, focalLength: -20, objectHeight: 18 }
    const pts = constructionPoints(concave)
    const rays: DrawnRays = {
      parallel: { start: pts.parallelStart, end: { x: 20, y: 36 } },
      chief: { start: pts.chiefStart, end: { x: 50, y: -22.5 } },
      focal: { start: pts.focalStart, end: { x: 50, y: pts.focalStart.y } },
    }
    expect(imageTip(concave).x).toBeLessThan(0)
    expect(drawnRayChecks(rays, concave).all).toBe(true)
  })
})
