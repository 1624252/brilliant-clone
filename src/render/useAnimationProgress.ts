import { useEffect, useState } from 'react'

/**
 * Drives a 0..1 progress value over `durationMs` with requestAnimationFrame.
 *
 * The animation restarts on mount, so the Replay wrappers (which remount the SVG
 * via a changing `key`) reliably replay. These are short, one-shot teaching
 * animations, so they always play — the looping/decorative motion (e.g. focal
 * point pulses) is what honors `prefers-reduced-motion`, via CSS media queries.
 */
export function useAnimationProgress(durationMs: number): number {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let raf = 0
    let start = 0
    const frame = (now: number) => {
      if (!start) start = now
      const t = Math.min(1, (now - start) / durationMs)
      setProgress(t)
      if (t < 1) raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [durationMs])

  return progress
}
