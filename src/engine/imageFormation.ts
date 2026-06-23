import type { ImageFormation } from './types'
import { imageDistance } from './thinLens'
import { magnification, orientationOf } from './magnification'

/**
 * Compute the full image description for an object in front of a thin lens.
 * This is the engine's main entry point; lessons drive their visuals and
 * success checks from the returned values.
 *
 * @param objectDistance do, > 0 for a real object
 * @param focalLength    f, > 0 converging / < 0 diverging
 */
export function formImage(objectDistance: number, focalLength: number): ImageFormation {
  const di = imageDistance(objectDistance, focalLength)
  const atInfinity = !Number.isFinite(di)
  const m = magnification(objectDistance, di)

  // Real image: finite and on the far side of the lens (di > 0).
  const isReal = Number.isFinite(di) && di > 0

  // At the focal point there is no finite image; treat it as "magnified"
  // since the rays spread without bound.
  const isMagnified = Number.isFinite(m) ? Math.abs(m) > 1 : true

  return {
    objectDistance,
    focalLength,
    imageDistance: di,
    magnification: m,
    isReal,
    orientation: orientationOf(m),
    isMagnified,
    atInfinity,
  }
}
