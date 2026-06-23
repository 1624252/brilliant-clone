import { describe, it, expect } from 'vitest'
import { tracePrincipalRays, type PrincipalRay, type RayId } from './rays'

const SCENE_RIGHT = 80

function ray(rays: PrincipalRay[], id: RayId): PrincipalRay {
  const found = rays.find((r) => r.id === id)
  if (!found) throw new Error(`no ${id} ray`)
  return found
}

/** y of the line through two points, evaluated at x. */
function yAtX(a: { x: number; y: number }, b: { x: number; y: number }, x: number): number {
  return a.y + ((b.y - a.y) / (b.x - a.x)) * (x - a.x)
}

describe('tracePrincipalRays (converging, real image: do=30, f=10, h=12)', () => {
  const trace = tracePrincipalRays(30, 10, 12, SCENE_RIGHT)

  it('places the object arrow on the left', () => {
    expect(trace.object.base).toEqual({ x: -30, y: 0 })
    expect(trace.object.tip).toEqual({ x: -30, y: 12 })
  })

  it('forms a real, inverted image at di=15 (matches the engine)', () => {
    expect(trace.image).not.toBeNull()
    expect(trace.image!.base.x).toBeCloseTo(15, 6)
    expect(trace.image!.tip.y).toBeCloseTo(-6, 6) // m = -0.5, h = 12
    expect(trace.atInfinity).toBe(false)
  })

  it('traces three rays with no dashed extensions (image is real)', () => {
    expect(trace.rays).toHaveLength(3)
    for (const r of trace.rays) expect(r.dashed).toBeUndefined()
  })

  it('parallel ray crosses the lens at the object height, then bends through the far focal point', () => {
    const r = ray(trace.rays, 'parallel')
    const [start, cross, far] = r.solid
    expect(start).toEqual({ x: -30, y: 12 })
    expect(cross).toEqual({ x: 0, y: 12 })
    // After the lens it must pass through F' = (f, 0) = (10, 0).
    expect(yAtX(cross, far, 10)).toBeCloseTo(0, 6)
  })

  it('chief ray passes straight through the lens center', () => {
    const r = ray(trace.rays, 'chief')
    const [, cross] = r.solid
    expect(cross).toEqual({ x: 0, y: 0 })
    // Object tip, center, and image tip are collinear.
    expect(yAtX(r.solid[0], r.solid[2], 15)).toBeCloseTo(-6, 6)
  })

  it('focal ray enters through the near focal point and exits parallel to the axis', () => {
    const r = ray(trace.rays, 'focal')
    const [start, cross, far] = r.solid
    // Incoming segment passes through F = (-f, 0) = (-10, 0).
    expect(yAtX(start, cross, -10)).toBeCloseTo(0, 6)
    // Outgoing segment is horizontal (constant height).
    expect(cross.y).toBeCloseTo(-6, 6)
    expect(far.y).toBeCloseTo(-6, 6)
  })

  it('all three rays converge at the image tip', () => {
    for (const id of ['parallel', 'chief', 'focal'] as RayId[]) {
      const r = ray(trace.rays, id)
      const [, cross, far] = r.solid
      expect(yAtX(cross, far, 15)).toBeCloseTo(-6, 6)
    }
  })
})

describe('tracePrincipalRays (converging, virtual image: do=5, f=10, h=12)', () => {
  const trace = tracePrincipalRays(5, 10, 12, SCENE_RIGHT)

  it('forms a virtual, upright, magnified image (di=-10, tip up)', () => {
    expect(trace.image!.base.x).toBeCloseTo(-10, 6)
    expect(trace.image!.tip.y).toBeCloseTo(24, 6) // m = 2, h = 12
  })

  it('adds dashed backward extensions to the virtual image tip', () => {
    for (const r of trace.rays) {
      expect(r.dashed).toBeDefined()
      const end = r.dashed![1]
      expect(end.x).toBeCloseTo(-10, 6)
      expect(end.y).toBeCloseTo(24, 6)
    }
  })
})

describe('tracePrincipalRays edge cases', () => {
  it('object at the focal point: image at infinity, parallel/chief rays only', () => {
    const trace = tracePrincipalRays(10, 10, 12, SCENE_RIGHT)
    expect(trace.atInfinity).toBe(true)
    expect(trace.image).toBeNull()
    expect(trace.rays.map((r) => r.id)).toEqual(['parallel', 'chief'])
  })

  it('object infinitely far: parallel beam converges at the far focal point', () => {
    const trace = tracePrincipalRays(Infinity, 10, 12, SCENE_RIGHT)
    expect(trace.image).not.toBeNull()
    expect(trace.image!.base).toEqual({ x: 10, y: 0 })
    // Incoming top/bottom rays arrive parallel to the axis (flat before the lens)...
    const top = ray(trace.rays, 'parallel')
    expect(top.solid[0].y).toBeCloseTo(12, 6)
    expect(top.solid[1].y).toBeCloseTo(12, 6)
    // ...then bend through F = (10, 0).
    expect(yAtX(top.solid[1], top.solid[2], 10)).toBeCloseTo(0, 6)
    // No NaNs anywhere in the geometry.
    for (const r of trace.rays) {
      for (const p of r.solid) {
        expect(Number.isNaN(p.x)).toBe(false)
        expect(Number.isNaN(p.y)).toBe(false)
      }
    }
  })

  it('object on the lens (do = 0) produces a finite, NaN-free trace', () => {
    const trace = tracePrincipalRays(0, 10, 12, SCENE_RIGHT)
    for (const r of trace.rays) {
      for (const p of r.solid) {
        expect(Number.isFinite(p.x)).toBe(true)
        expect(Number.isFinite(p.y)).toBe(true)
      }
    }
  })

  it('throws on non-positive object height', () => {
    expect(() => tracePrincipalRays(30, 10, 0, SCENE_RIGHT)).toThrow(RangeError)
  })
})
