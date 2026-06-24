import { formImage, type Point, type RayId } from '../engine'

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

export interface DrawnRay {
  start: Point
  end: Point
}

export type DrawnRays = Record<RayId, DrawnRay>

export interface DrawRayChecks extends RayChecks {
  starts: Record<RayId, boolean>
}

export interface PlotBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
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

export function constructionPoints(s: PlotScene): {
  objectTip: Point
  center: Point
  parallelStart: Point
  chiefStart: Point
  focalStart: Point
  farFocus: Point
  imageTip: Point
} {
  const h = s.objectHeight
  const img = imageTip(s)
  return {
    objectTip: { x: -s.objectDistance, y: h },
    center: { x: 0, y: 0 },
    parallelStart: { x: 0, y: h },
    chiefStart: { x: 0, y: 0 },
    focalStart: { x: 0, y: img.y },
    farFocus: { x: s.focalLength, y: 0 },
    imageTip: img,
  }
}

export function pointDistance(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

/** Extend the ray through `end` until it reaches the rectangular scene bounds. */
export function extendRayToBounds(start: Point, end: Point, bounds: PlotBounds): Point {
  const dx = end.x - start.x
  const dy = end.y - start.y
  if (Math.hypot(dx, dy) < 1e-9) return end

  const candidates: number[] = []
  if (Math.abs(dx) > 1e-9) {
    candidates.push((bounds.minX - start.x) / dx)
    candidates.push((bounds.maxX - start.x) / dx)
  }
  if (Math.abs(dy) > 1e-9) {
    candidates.push((bounds.minY - start.y) / dy)
    candidates.push((bounds.maxY - start.y) / dy)
  }

  const valid = candidates
    .filter((t) => t >= 1)
    .map((t) => ({ x: start.x + dx * t, y: start.y + dy * t, t }))
    .filter(
      (p) =>
        p.x >= bounds.minX - 1e-6 &&
        p.x <= bounds.maxX + 1e-6 &&
        p.y >= bounds.minY - 1e-6 &&
        p.y <= bounds.maxY + 1e-6,
    )
    .sort((a, b) => a.t - b.t)

  const hit = valid[0]
  return hit ? { x: hit.x, y: hit.y } : end
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

/**
 * Rule checks for the draw-the-rays interaction. Each drawn ray has two learner-
 * controlled points: the lens crossing (`start`) and an outgoing endpoint. The
 * start must land on the correct lens point, and the endpoint must make the ray
 * obey its physical rule.
 */
export function drawnRayChecks(rays: DrawnRays, s: PlotScene, tol = 3): DrawRayChecks {
  const pts = constructionPoints(s)
  const starts = {
    parallel: pointDistance(rays.parallel.start, pts.parallelStart) <= tol,
    chief: pointDistance(rays.chief.start, pts.chiefStart) <= tol,
    focal: pointDistance(rays.focal.start, pts.focalStart) <= tol,
  }
  const parallel =
    starts.parallel && distToLine(pts.farFocus, rays.parallel.start, rays.parallel.end) <= tol
  const chief =
    starts.chief && distToLine(rays.chief.end, pts.objectTip, pts.center) <= tol
  const focal = starts.focal && Math.abs(rays.focal.end.y - rays.focal.start.y) <= tol
  return { starts, chief, parallel, focal, all: parallel && chief && focal }
}
