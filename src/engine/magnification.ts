import type { Orientation } from './types'

/**
 * Lateral magnification: m = -di/do.
 * Sign encodes orientation (+ upright, - inverted); |m| is the size ratio.
 * Returns ±Infinity when the image is at infinity (object at the focal point).
 */
export function magnification(objectDistance: number, imageDistance: number): number {
  if (objectDistance === 0) {
    throw new RangeError('objectDistance must be non-zero')
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
