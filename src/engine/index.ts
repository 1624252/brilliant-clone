// Public surface of the optics engine. Import from './engine' rather than
// reaching into individual files.
export type { ImageFormation, Orientation, LensType } from './types'
export { imageDistance, focalLengthFrom, lensType } from './thinLens'
export { magnification, orientationOf } from './magnification'
export { formImage } from './imageFormation'
