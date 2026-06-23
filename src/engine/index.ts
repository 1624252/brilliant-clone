// Public surface of the optics engine. Import from './engine' rather than
// reaching into individual files.
export type { ImageFormation, Orientation, LensType, Point } from './types'
export { imageDistance, focalLengthFrom, lensType } from './thinLens'
export { magnification, orientationOf } from './magnification'
export { formImage } from './imageFormation'
export { sliderToFocalLength, FLAT_FOCAL } from './curvature'
export { tracePrincipalRays } from './rays'
export type { RayTrace, PrincipalRay, RayId } from './rays'
