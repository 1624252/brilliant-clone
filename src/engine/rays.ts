import type { Point } from './types'
import { formImage } from './imageFormation'

// Principal-ray tracing for a thin lens, in optical coordinates (origin at the
// lens center, +x right, +y up).
//
// The construction relies on one fact: every ray leaving the object tip either
// passes through the image tip (real image) or appears to come from it (virtual
// image). Combined with the three well-known lens-crossing points, that fully
// determines all three principal rays:
//
//   parallel ray -> crosses the lens at the object's height, then bends to/from
//                   the far focal point (toward the image tip).
//   chief ray    -> passes straight through the lens center.
//   focal ray    -> aimed through the near focal point, exits parallel to axis.

export type RayId = 'parallel' | 'chief' | 'focal'

export interface PrincipalRay {
  id: RayId
  /** The path light actually travels, as a polyline of optical-space points. */
  solid: Point[]
  /** Backward extension to a virtual image tip (dashed in the UI), if any. */
  dashed?: Point[]
}

export interface RayTrace {
  object: { base: Point; tip: Point }
  /** Null when the object sits at the focal point (image at infinity). */
  image: { base: Point; tip: Point } | null
  rays: PrincipalRay[]
  atInfinity: boolean
}

/** Point on the line through a and b, evaluated at x. Assumes a.x !== b.x. */
function linePointAtX(a: Point, b: Point, x: number): Point {
  const slope = (b.y - a.y) / (b.x - a.x)
  return { x, y: a.y + slope * (x - a.x) }
}

/**
 * Trace the three principal rays for an object in front of a thin lens.
 *
 * @param objectDistance do, 0..∞ (use Infinity for an object infinitely far away)
 * @param focalLength    f, > 0 converging / < 0 diverging
 * @param objectHeight   h, > 0 (arrow points up from the axis)
 * @param sceneRightX    x of the right scene edge; outgoing rays extend to here
 */
export function tracePrincipalRays(
  objectDistance: number,
  focalLength: number,
  objectHeight: number,
  sceneRightX: number,
): RayTrace {
  if (objectHeight <= 0) {
    throw new RangeError('objectHeight must be positive')
  }

  // Object infinitely far away: light arrives as a parallel beam. A converging
  // lens brings it to the far focus; a diverging lens spreads it as if it came
  // from the near-side virtual focus.
  if (!Number.isFinite(objectDistance)) {
    const R = sceneRightX
    const farFocal: Point = { x: focalLength, y: 0 }
    const top: Point = { x: 0, y: objectHeight }
    const bot: Point = { x: 0, y: -objectHeight }
    const diverging = focalLength < 0
    const topSolid = [{ x: -R, y: objectHeight }, top, linePointAtX(top, farFocal, R)]
    const botSolid = [{ x: -R, y: -objectHeight }, bot, linePointAtX(bot, farFocal, R)]
    return {
      object: { base: { x: -R, y: 0 }, tip: { x: -R, y: objectHeight } },
      image: { base: farFocal, tip: farFocal },
      atInfinity: false,
      rays: [
        {
          id: 'parallel',
          solid: topSolid,
          dashed: diverging ? [top, linePointAtX(top, farFocal, -R)] : undefined,
        },
        { id: 'chief', solid: [{ x: -R, y: 0 }, { x: 0, y: 0 }, { x: R, y: 0 }] },
        {
          id: 'focal',
          solid: botSolid,
          dashed: diverging ? [bot, linePointAtX(bot, farFocal, -R)] : undefined,
        },
      ],
    }
  }

  // Guard the degenerate object-at-the-lens case (do -> 0), where the object,
  // its image, and all lens crossings collapse onto x = 0 and slopes blow up.
  const doDraw = Math.max(objectDistance, 0.5)

  const P: Point = { x: -doDraw, y: objectHeight } // object tip
  const A: Point = { x: 0, y: objectHeight } // lens crossing of the parallel ray
  const O: Point = { x: 0, y: 0 } // lens center

  // Flat lens (f -> ∞): light passes straight through without bending, so the
  // parallel ray stays parallel, the chief ray keeps its direction, and the
  // "image" coincides with the object (you simply see it as-is).
  if (!Number.isFinite(focalLength)) {
    return {
      object: { base: { x: -doDraw, y: 0 }, tip: P },
      image: { base: { x: -doDraw, y: 0 }, tip: P },
      atInfinity: false,
      rays: [
        { id: 'parallel', solid: [P, A, { x: sceneRightX, y: objectHeight }] },
        { id: 'chief', solid: [P, O, linePointAtX(P, O, sceneRightX)] },
      ],
    }
  }

  const { imageDistance: di, magnification: m, atInfinity } = formImage(
    doDraw,
    focalLength,
  )

  // Object at the focal point: rays exit parallel, no finite image. Draw just
  // the parallel and chief rays heading off in parallel.
  if (atInfinity) {
    const farFocal: Point = { x: focalLength, y: 0 }
    return {
      object: { base: { x: -doDraw, y: 0 }, tip: P },
      image: null,
      atInfinity: true,
      rays: [
        { id: 'parallel', solid: [P, A, linePointAtX(A, farFocal, sceneRightX)] },
        { id: 'chief', solid: [P, O, linePointAtX(P, O, sceneRightX)] },
      ],
    }
  }

  const I: Point = { x: di, y: m * objectHeight } // image tip
  const B: Point = { x: 0, y: I.y } // lens crossing of the focal ray
  const isVirtual = di < 0

  const crossings: { id: RayId; C: Point }[] = [
    { id: 'parallel', C: A },
    { id: 'chief', C: O },
    { id: 'focal', C: B },
  ]

  const rays: PrincipalRay[] = crossings.map(({ id, C }) => {
    const far = linePointAtX(C, I, sceneRightX)
    const ray: PrincipalRay = { id, solid: [P, C, far] }
    if (isVirtual) {
      ray.dashed = [C, linePointAtX(C, I, -sceneRightX)] // extended backward trace
    }
    return ray
  })

  return {
    object: { base: { x: -doDraw, y: 0 }, tip: P },
    image: { base: { x: di, y: 0 }, tip: I },
    rays,
    atInfinity: false,
  }
}
