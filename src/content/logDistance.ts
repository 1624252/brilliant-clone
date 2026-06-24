import type { Control } from './types'

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))
const LOG_BASE = 0.15

function scaleFor(control: Control): number {
  // Express the log curve in "focal-length units" when the lesson provides a
  // focal snap mark. For f=20, log_0.15(1 - t)=1 lands exactly at F.
  const firstPositiveSnap = control.snaps?.find((s) => s > 0)
  return firstPositiveSnap ?? 1
}

function sliderFraction(raw: number, control: Control): number {
  return clamp01((raw - control.min) / (control.max - control.min))
}

function fractionToSlider(t: number, control: Control): number {
  return control.min + clamp01(t) * (control.max - control.min)
}

export function usesLogDistance(control: Control): boolean {
  return control.key === 'objectDistance' && !!control.allowInfinity
}

export function sliderToDistance(raw: number, control: Control): number {
  if (!usesLogDistance(control)) return raw
  if (raw <= control.min) return control.min
  if (raw >= control.max) return Infinity

  const t = sliderFraction(raw, control)
  // t is the slider's 0..1 position. log_0.15(1 - t) maps:
  //   t = 0 -> log_0.15(1) = 0
  //   t -> 1 -> log_0.15(0) -> Infinity
  return scaleFor(control) * (Math.log(1 - t) / Math.log(LOG_BASE))
}

export function distanceToSlider(value: number, control: Control): number {
  if (!usesLogDistance(control)) return value
  if (!Number.isFinite(value)) return control.max

  const t = 1 - Math.pow(LOG_BASE, Math.max(0, value) / scaleFor(control))
  return fractionToSlider(t, control)
}
