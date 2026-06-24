import { formImage, type Point } from '../engine'

// Geometry helpers for the "plot the three rays" interaction. The learner drags a
// single marker (their predicted image point). Each principal ray is drawn from
// its fixed lens-crossing through that marker, and we check whether the marker
// satisfies each ray's physical rule:
//
//   chief ray     -> stays straight: the marker lies on the line object→center.
//   parallel ray  -> bends through F: the line (lens@object-height)→marker hits F.
//   focal ray     -> exits parallel: the marker sits at the image height.
//
// All three rules hold at exactly one place — the true image tip — so satisfying
// them is equivalent to locating where the rays cross, while teaching *why*.

export interface PlotScene {
  objectDistance: number
  focalLength: number
  objectHeight: number
}

export interface RayChecks {
  chief: boolean
  parallel: boolean
  focal: boolean
  all: boolean
}

/** The true image tip (optical coords) for a scene, via the thin-lens engine. */
export function imageTip(s: PlotScene): Point {
  const { imageDistance, magnification } = formImage(s.objectDistance, s.focalLength)
  return { x: imageDistance, y: magnification * s.objectHeight }
}

/** Perpendicular distance from point p to the line through a and b. */
function distToLine(p: Point, a: Point, b: Point): number {
  const dx = b.x - a.x
  const dy = b.y - a.y
  const len = Math.hypot(dx, dy)
  if (len < 1e-9) return Math.hypot(p.x - a.x, p.y - a.y)
  return Math.abs(dx * (p.y - a.y) - dy * (p.x - a.x)) / len
}

/**
 * Which ray rules the marker currently satisfies (within `tol`, optical units).
 * The marker must be on the physically correct image side: far side for real
 * images, candle side for virtual images.
 */
export function rayChecks(marker: Point, s: PlotScene, tol = 3): RayChecks {
  const h = s.objectHeight
  const P: Point = { x: -s.objectDistance, y: h } // object tip
  const O: Point = { x: 0, y: 0 } // lens center
  const A: Point = { x: 0, y: h } // parallel ray's lens crossing
  const F: Point = { x: s.focalLength, y: 0 } // far focal point
  const img = imageTip(s)

  const validSide = img.x >= 0 ? marker.x > 0 : marker.x < 0
  const chief = validSide && distToLine(marker, P, O) <= tol
  const parallel = validSide && distToLine(F, A, marker) <= tol
  const focal = validSide && Math.abs(marker.y - img.y) <= tol
  return { chief, parallel, focal, all: chief && parallel && focal }
}
