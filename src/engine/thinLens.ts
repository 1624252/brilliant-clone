import type { LensType } from './types'

/**
 * Thin-lens equation solved for image distance.
 *
 *   1/f = 1/do + 1/di   ->   di = 1 / (1/f - 1/do)
 *
 * Returns +Infinity when the object sits exactly at the focal point
 * (objectDistance === focalLength), where refracted rays leave parallel and
 * no finite image forms.
 *
 * @param objectDistance do, must be non-zero
 * @param focalLength    f, must be non-zero (use < 0 for a diverging lens)
 */
export function imageDistance(objectDistance: number, focalLength: number): number {
  if (objectDistance === 0) {
    throw new RangeError('objectDistance must be non-zero')
  }
  if (focalLength === 0) {
    throw new RangeError('focalLength must be non-zero')
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
