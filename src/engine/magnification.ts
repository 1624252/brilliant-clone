import type { Orientation } from './types'

/**
 * Lateral magnification: m = -di/do.
 * Sign encodes orientation (+ upright, - inverted); |m| is the size ratio.
 *
 * Boundary cases (kept finite/sane so the engine can't die):
 *   - object on the lens (do === 0): 1 (same size, at the lens).
 *   - object infinitely far (do === ±Infinity): 0 (image shrinks to a point).
 *   - image at infinity (object at the focal point): Infinity.
 */
export function magnification(objectDistance: number, imageDistance: number): number {
  if (objectDistance === 0) {
    return 1 // limit as do -> 0: di -> 0 and m -> 1
  }
  if (!Number.isFinite(objectDistance)) {
    return 0 // far object -> point image on the focal plane
  }
  if (!Number.isFinite(imageDistance)) {
    return Infinity // image at infinity
  }
  return -imageDistance / objectDistance
}

/** Upright when m >= 0, inverted when m < 0. */
export function orientationOf(magnificationValue: number): Orientation {
  return magnificationValue < 0 ? 'inverted' : 'upright'
}
