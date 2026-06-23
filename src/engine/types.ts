// Core types for the optics engine.
//
// Sign conventions (standard intro-physics "real-is-positive" thin-lens model).
// All distances share a single unit (we treat them as centimeters in lessons).
//
//   objectDistance (do):  > 0 for a real object in front of the lens.
//   focalLength    (f):   > 0 converging lens, < 0 diverging lens.
//   imageDistance  (di):  > 0 real image (opposite side of the lens from the
//                         object), < 0 virtual image (same side as the object),
//                         ±Infinity when the object sits at the focal point.
//   magnification  (m):   m = -di/do. Sign gives orientation (+ upright,
//                         - inverted); |m| is the size ratio (>1 enlarged).

export type Orientation = 'upright' | 'inverted'

export type LensType = 'converging' | 'diverging'

/** A point in optical coordinates: origin at the lens center, +x to the right
 * (direction light travels), +y up. Distances are in the same unit as do/f. */
export interface Point {
  x: number
  y: number
}

/** Full description of the image a thin lens forms for a given object. */
export interface ImageFormation {
  objectDistance: number
  focalLength: number
  /** di; +real / -virtual / ±Infinity at the focal point. */
  imageDistance: number
  /** m = -di/do; +upright / -inverted; |m| is the size ratio. */
  magnification: number
  /** True only for a finite image on the far side of the lens. */
  isReal: boolean
  orientation: Orientation
  /** |m| > 1. For an object at the focal point this is treated as true. */
  isMagnified: boolean
  /** Object sits at the focal point; refracted rays exit parallel, no finite image. */
  atInfinity: boolean
}
