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
 * @param objectDistance do, > 0 (real object on the left)
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

  const P: Point = { x: -objectDistance, y: objectHeight } // object tip
  const A: Point = { x: 0, y: objectHeight } // lens crossing of the parallel ray
  const O: Point = { x: 0, y: 0 } // lens center

  const { imageDistance: di, magnification: m, atInfinity } = formImage(
    objectDistance,
    focalLength,
  )

  // Object at the focal point: rays exit parallel, no finite image. Draw just
  // the parallel and chief rays heading off in parallel.
  if (atInfinity) {
    const farFocal: Point = { x: focalLength, y: 0 }
    return {
      object: { base: { x: -objectDistance, y: 0 }, tip: P },
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
      ray.dashed = [C, I] // backward extension to the virtual image tip
    }
    return ray
  })

  return {
    object: { base: { x: -objectDistance, y: 0 }, tip: P },
    image: { base: { x: di, y: 0 }, tip: I },
    rays,
    atInfinity: false,
  }
}
