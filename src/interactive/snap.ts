/**
 * Gently snap a value to the nearest "important" number (e.g., 0, f, 2f) when
 * it's within a threshold, so learners can land on key values easily.
 */
export function snapValue(
  value: number,
  snaps: number[] | undefined,
  threshold = 1.25,
): number {
  if (!snaps || !Number.isFinite(value)) return value
  let best = value
  let bestDist = threshold
  for (const s of snaps) {
    const d = Math.abs(value - s)
    if (d <= bestDist) {
      best = s
      bestDist = d
    }
  }
  return best
}
