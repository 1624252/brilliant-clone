import { useState } from 'react'
import { useAnimationProgress } from './useAnimationProgress'
import './RayFocusAnimation.css'

// A morphing explainer for diverging lenses: a flat slab (parallel rays pass
// straight through) curves into a concave lens, and the rays bend outward in
// sync. Their dashed backward extensions meet at the virtual focus F, on the
// same side the light came from. One rAF tween (t: 0 = slab, 1 = concave) keeps
// the shape and the rays in step; Replay remounts to restart.

const CENTER_Y = 110
const LENS_X = 190
const F_LEN = 78 // virtual focus sits this far LEFT of the lens
const H = 68 // half lens height
const LEFT_EDGE = 8
const RIGHT_EDGE = 348
const RAY_YS = [60, 85, 135, 160] // parallel ray heights (axis drawn separately)

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
const lerp = (a: number, b: number, t: number) => a + (b - a) * t
const HOLD = 600 // show the flat slab briefly first
const MORPH = 1900 // then hollow into the lens
const TOTAL = HOLD + MORPH
const ease = (x: number) =>
  x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2

/** Lens outline at tween t: flat slab (t=0) hollowing into a biconcave lens (t=1). */
function lensPath(t: number): string {
  const sw = lerp(16, 11, t) // half-width of the (thicker) edges
  // How far the faces bow inward. Clamp below sw so the two control points never
  // cross the axis past each other (which would self-intersect into a bowtie).
  const inset = Math.min(sw - 2, 22 * t)
  const topL = `${LENS_X - sw},${CENTER_Y - H}`
  const botL = `${LENS_X - sw},${CENTER_Y + H}`
  const botR = `${LENS_X + sw},${CENTER_Y + H}`
  const topR = `${LENS_X + sw},${CENTER_Y - H}`
  const ctrlL = `${LENS_X - sw + inset},${CENTER_Y}`
  const ctrlR = `${LENS_X + sw - inset},${CENTER_Y}`
  return `M ${topL} Q ${ctrlL} ${botL} L ${botR} Q ${ctrlR} ${topR} Z`
}

export function ConcaveLensAnimation() {
  const elapsed = useAnimationProgress(TOTAL) * TOTAL
  const nt = elapsed <= HOLD ? 0 : clamp01((elapsed - HOLD) / MORPH)
  const t = ease(nt)

  const concaveOpacity = clamp01((t - 0.55) / 0.35)

  // The outgoing rays diverge by t, so their dashed back-extensions converge at
  // x = LENS_X - F_LEN / t, sweeping in from far left and settling on the virtual
  // focus F at t = 1. We grow the dashed lines to that crossing and put the focal
  // mark there, so the virtual focus is *formed* by the dashes meeting — no fade.
  const xVCross = t > 0.02 ? LENS_X - F_LEN / t : -Infinity
  const xVEnd = Math.max(xVCross, LEFT_EDGE)
  const focusOnScreen = xVCross >= LEFT_EDGE + 6

  return (
    <svg
      className="focus-anim"
      viewBox="0 0 360 220"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="A flat glass slab curves into a concave lens; parallel rays bend outward and appear to come from a virtual focus."
    >
      <line className="axis" x1={0} y1={CENTER_Y} x2={360} y2={CENTER_Y} />

      {/* parallel incoming rays + outgoing rays that diverge more as t grows */}
      {RAY_YS.map((y) => {
        // Outgoing ray appears to come from the virtual focus, so its slope is
        // set by the line from F through the lens-crossing point (LENS_X, y).
        const slope = (y - CENTER_Y) / F_LEN
        const yEnd = y + t * slope * (RIGHT_EDGE - LENS_X)
        // The dashed back-extension grows left along the same line to the live
        // crossing, so the dashes visibly converge at the virtual focus.
        const yVEnd = y + t * slope * (xVEnd - LENS_X)
        return (
          <g key={y}>
            <path className="beam beam--in" d={`M ${LEFT_EDGE},${y} L ${LENS_X},${y}`} />
            <path
              className="beam beam--out"
              d={`M ${LENS_X},${y} L ${RIGHT_EDGE},${yEnd}`}
            />
            <path
              className="beam beam--virtual"
              d={`M ${LENS_X},${y} L ${xVEnd},${yVEnd}`}
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

      {/* virtual focal point: appears where the dashed rays meet, riding in to F */}
      {focusOnScreen && (
        <g>
          <circle className="fpoint" cx={xVCross} cy={CENTER_Y} r={4} />
          <text className="flabel" x={xVCross} y={CENTER_Y - 12} textAnchor="middle">
            F
          </text>
        </g>
      )}

      {/* incoming label, just above the top ray */}
      <text className="clens-tag" x={LEFT_EDGE} y={52}>
        Parallel rays →
      </text>

      {/* stage labels under the lens cross-fade from flat glass to concave lens */}
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
        Concave lens
      </text>

      {/* headline callout (top), appears once it has curved into a concave lens */}
      <g className="callout" style={{ opacity: concaveOpacity }}>
        <text x={180} y={24} textAnchor="middle">
          This is a concave lens 🔭
        </text>
      </g>
    </svg>
  )
}

/** The concave-lens morph with a Replay button. Remounting restarts the tween. */
export function ConcaveLensExplainer() {
  const [run, setRun] = useState(0)
  return (
    <div className="focus-explainer">
      <ConcaveLensAnimation key={run} />
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
