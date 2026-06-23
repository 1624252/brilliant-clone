import type { LensType } from './types'

/**
 * Thin-lens equation solved for image distance.
 *
 *   1/f = 1/do + 1/di   ->   di = 1 / (1/f - 1/do)
 *
 * Boundary cases are handled so the engine never throws or returns NaN:
 *   - do at the focal point (do === f): +Infinity (rays leave parallel).
 *   - do === 0 (object on the lens): 0 (image forms at the lens).
 *   - do === ±Infinity (object infinitely far): f (image at the focal plane).
 *
 * @param objectDistance do (0..∞ allowed)
 * @param focalLength    f, must be non-zero (use < 0 for a diverging lens)
 */
export function imageDistance(objectDistance: number, focalLength: number): number {
  if (focalLength === 0) {
    throw new RangeError('focalLength must be non-zero')
  }
  // Object infinitely far: parallel rays focus exactly at the focal plane.
  if (!Number.isFinite(objectDistance)) {
    return focalLength
  }
  // Object on the lens: image coincides with the lens.
  if (objectDistance === 0) {
    return 0
  }

  const denominator = 1 / focalLength - 1 / objectDistance
  if (denominator === 0) {
    return Infinity // object at the focal point
  }
  return 1 / denominator
}

/**
 * Thin-lens equation solved for focal length, given object and image distances.
 *   1/f = 1/do + 1/di
 * Useful for "make it focus" style problems where the learner finds f.
 */
export function focalLengthFrom(objectDistance: number, imageDistance: number): number {
  if (objectDistance === 0 || imageDistance === 0) {
    throw new RangeError('distances must be non-zero')
  }
  return 1 / (1 / objectDistance + 1 / imageDistance)
}

/** A lens converges when f > 0 and diverges when f < 0. */
export function lensType(focalLength: number): LensType {
  if (focalLength === 0) {
    throw new RangeError('focalLength must be non-zero')
  }
  return focalLength > 0 ? 'converging' : 'diverging'
}
