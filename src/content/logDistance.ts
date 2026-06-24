import type { Control } from './types'

const clamp01 = (v: number) => Math.min(1, Math.max(0, v))

function scaleFor(control: Control): number {
  // Use the visible scene span as the scale so the far end is already optically
  // very far away before the final Infinity endpoint.
  return Math.max(1, control.max - control.min)
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
  // t is the slider's 0..1 position. -log(1 - t) maps:
  //   t = 0 -> -log(1) = 0
  //   t -> 1 -> -log(0) -> Infinity
  return scaleFor(control) * -Math.log(1 - t)
}

export function distanceToSlider(value: number, control: Control): number {
  if (!usesLogDistance(control)) return value
  if (!Number.isFinite(value)) return control.max

  const t = 1 - Math.exp(-Math.max(0, value) / scaleFor(control))
  return fractionToSlider(t, control)
}
