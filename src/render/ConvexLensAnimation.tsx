import { useState } from 'react'
import { useAnimationProgress } from './useAnimationProgress'
import './RayFocusAnimation.css'

// A morphing explainer: a flat rectangular slab (which lets parallel rays pass
// straight through) curves into a convex lens, and the rays bend in sync to meet
// at the focal point F. Drives one tween (t: 0 = slab, 1 = convex) with rAF so the
// shape and the rays stay in step. Replay remounts to restart.

const CENTER_Y = 110
const LENS_X = 190
const F_LEN = 72
const H = 68 // half lens height
const LEFT_EDGE = 8
const RIGHT_EDGE = 348
const RAY_YS = [60, 85, 135, 160] // parallel ray heights (axis drawn separately)

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const HOLD = 600 // show the flat slab briefly first
const MORPH = 1900 // then bow into the lens
const TOTAL = HOLD + MORPH
const ease = (x: number) =>
  x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2

/** Lens outline at tween t: flat-faced slab (t=0) bulging into a convex lens (t=1). */
function lensPath(t: number): string {
  const sw = lerp(16, 7, t) // half-width of the flat sides
  const bulge = 27 * t // how far the faces bow outward
  const topR = `${LENS_X + sw},${CENTER_Y - H}`
  const botR = `${LENS_X + sw},${CENTER_Y + H}`
  const botL = `${LENS_X - sw},${CENTER_Y + H}`
  const topL = `${LENS_X - sw},${CENTER_Y - H}`
  const ctrlR = `${LENS_X + sw + bulge},${CENTER_Y}`
  const ctrlL = `${LENS_X - sw - bulge},${CENTER_Y}`
  return `M ${topR} Q ${ctrlR} ${botR} L ${botL} Q ${ctrlL} ${topL} Z`
}

export function ConvexLensAnimation() {
  const elapsed = useAnimationProgress(TOTAL) * TOTAL
  const nt = elapsed <= HOLD ? 0 : clamp01((elapsed - HOLD) / MORPH)
  const t = ease(nt)

  const convexOpacity = clamp01((t - 0.55) / 0.35)

  // The outgoing rays bend by t, so they converge at x = LENS_X + F_LEN / t,
  // which sweeps in from far right and settles exactly on F at t = 1. We draw the
  // rays to that crossing and place the focal mark there, so the focus is *formed*
  // by the rays meeting — not faded in.
  const trueF = LENS_X + F_LEN
  const xCross = t > 0.02 ? LENS_X + F_LEN / t : Infinity
  const xEnd = Math.min(xCross, RIGHT_EDGE)
  const focusOnScreen = xCross <= RIGHT_EDGE - 6

  return (
    <svg
      className="focus-anim"
      viewBox="0 0 360 220"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="A flat glass slab curves into a convex lens; parallel rays bend to meet at the focal point."
    >
      <line className="axis" x1={0} y1={CENTER_Y} x2={360} y2={CENTER_Y} />

      {/* parallel incoming rays + outgoing rays that bend more as t grows, drawn
          all the way to the live crossing so they visibly meet at one point */}
      {RAY_YS.map((y) => {
        const slope = (CENTER_Y - y) / F_LEN
        const yEnd = y + t * slope * (xEnd - LENS_X)
        return (
          <g key={y}>
            <path className="beam beam--in" d={`M ${LEFT_EDGE},${y} L ${LENS_X},${y}`} />
            <path
              className="beam beam--out"
              d={`M ${LENS_X},${y} L ${xEnd},${yEnd}`}
            />
          </g>
        )
      })}
      {/* on-axis ray goes straight through at every stage */}
      <path
        className="beam beam--in"
        d={`M ${LEFT_EDGE},${CENTER_Y} L ${RIGHT_EDGE},${CENTER_Y}`}
      />

      {/* the morphing lens */}
      <path className="lens" d={lensPath(t)} />

      {/* focal point: appears where the rays actually cross and rides inward to F */}
      {focusOnScreen && (
        <g>
          <circle className="fpoint" cx={xCross} cy={CENTER_Y} r={4} />
          {xCross <= trueF + 4 && (
            <text className="flabel" x={xCross} y={CENTER_Y - 12} textAnchor="middle">
              F
            </text>
          )}
        </g>
      )}

      {/* incoming label, just above the top ray */}
      <text className="clens-tag" x={LEFT_EDGE} y={52}>
        Parallel rays →
      </text>

      {/* stage labels under the lens cross-fade from flat glass to convex lens */}
      <text
        className="clens-stage"
        x={LENS_X}
        y={CENTER_Y + H + 22}
        textAnchor="middle"
        style={{ opacity: 1 - t }}
      >
        Flat glass
      </text>
      <text
        className="clens-stage clens-stage--convex"
        x={LENS_X}
        y={CENTER_Y + H + 22}
        textAnchor="middle"
        style={{ opacity: t }}
      >
        Convex lens
      </text>

      {/* headline callout (top), appears once it has curved into a convex lens */}
      <g className="callout" style={{ opacity: convexOpacity }}>
        <text x={180} y={24} textAnchor="middle">
          This is a convex lens 🔍
        </text>
      </g>
    </svg>
  )
}

/** The convex-lens morph with a Replay button. Remounting restarts the tween. */
export function ConvexLensExplainer() {
  const [run, setRun] = useState(0)
  return (
    <div className="focus-explainer">
      <ConvexLensAnimation key={run} />
      <button
        type="button"
        className="focus-replay"
        onClick={() => setRun((n) => n + 1)}
      >
        ↻ Replay
      </button>
    </div>
  )
}
