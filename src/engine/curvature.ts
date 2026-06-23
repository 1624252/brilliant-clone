// Maps a continuous "curvature" slider position to a focal length, so one slider
// can reshape a lens from converging through flat to diverging — smoothly.
//
// The slider position p runs from -1 to +1. The magnitude of f is interpolated
// logarithmically (equal slider movement multiplies f by a constant factor), so
// both strong and weak lenses are easy to dial in and the lens flattens smoothly:
//   |p| = 1  -> |f| = F_MIN   (most strongly curved)
//   |p| -> 0 -> |f| -> F_MAX  (nearly flat)
//   p  =  0  -> Infinity      (perfectly flat: no focusing, no divide-by-zero)
// The sign of p sets the type: p > 0 converging (convex), p < 0 diverging (concave).
const F_MIN = 12
const F_MAX = 600

// Above this focal length a lens is treated as effectively flat (used by the
// curvature readout and the "flatten it" success rule).
export const FLAT_FOCAL = 400

/** Focal length for a curvature slider position p in [-1, 1]. p = 0 -> Infinity (flat). */
export function sliderToFocalLength(p: number): number {
  if (p === 0) return Infinity
  // Log-linear interpolation of |f| between F_MAX (flat-ish) and F_MIN (curved).
  const magnitude = F_MAX * Math.pow(F_MIN / F_MAX, Math.abs(p))
  return Math.sign(p) * magnitude
}
