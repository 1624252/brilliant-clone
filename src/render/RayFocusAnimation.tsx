import { useState, type CSSProperties } from 'react'
import './RayFocusAnimation.css'

// A one-shot explainer: parallel rays draw on one by one, left to right, enter a
// converging lens, and bend so they all cross at the focal point F. Purely
// presentational; respects reduced-motion. Replay remounts to restart.

const CENTER_Y = 110
const LENS_X = 190
const F_X = 270 // focal point to the right of the lens
const LEFT_F_X = 110 // mirror focal point (shown faint for context)
const LEFT_EDGE = 6
// Ray heights, ordered top-to-bottom so the sweep reads cleanly (axis included).
const RAY_YS = [56, 83, CENTER_Y, 137, 164]
const RAY_STEP = 0.5 // seconds between successive rays starting to draw
const SEG_DRAW = 0.42 // seconds to draw one segment

type RayStyle = CSSProperties & Record<'--len', number>

const pathLen = (pts: [number, number][]): number => {
  let len = 0
  for (let i = 1; i < pts.length; i++) {
    len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])
  }
  return len
}

const pathD = (pts: [number, number][]): string =>
  'M ' + pts.map((p) => `${p[0]},${p[1]}`).join(' L ')

/** A single straight segment that "draws on" over SEG_DRAW seconds after `delay`. */
function RaySeg({
  pts,
  cls,
  delay,
}: {
  pts: [number, number][]
  cls: string
  delay: number
}) {
  const style: RayStyle = { '--len': pathLen(pts), animationDelay: `${delay}s` }
  return <path className={cls} d={pathD(pts)} style={style} />
}

export function RayFocusAnimation() {
  return (
    <svg
      className="focus-anim"
      viewBox="0 0 360 220"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Parallel rays entering a converging lens bend to meet at the focal point."
    >
      <line className="axis" x1={0} y1={CENTER_Y} x2={360} y2={CENTER_Y} />

      {/* lens */}
      <path
        className="lens"
        d={`M ${LENS_X},${CENTER_Y - 78} Q ${LENS_X + 16},${CENTER_Y} ${LENS_X},${CENTER_Y + 78} Q ${LENS_X - 16},${CENTER_Y} ${LENS_X},${CENTER_Y - 78} Z`}
      />

      {/* rays draw one by one: incoming parallel segment, then refracted to F */}
      {RAY_YS.map((y, i) => {
        const inDelay = i * RAY_STEP
        const outDelay = inDelay + SEG_DRAW * 0.8
        return (
          <g key={y}>
            <RaySeg pts={[[LEFT_EDGE, y], [LENS_X, y]]} cls="ray-in" delay={inDelay} />
            <RaySeg
              pts={[[LENS_X, y], [F_X, CENTER_Y]]}
              cls="ray-out"
              delay={outDelay}
            />
          </g>
        )
      })}

      {/* focal points */}
      <circle className="fpoint fpoint--minor" cx={LEFT_F_X} cy={CENTER_Y} r={3} />
      <circle className="fpoint" cx={F_X} cy={CENTER_Y} r={4} />
      <text className="flabel" x={F_X} y={CENTER_Y - 12} textAnchor="middle">
        F
      </text>

      {/* pop-up callouts that label what's happening */}
      <g className="callout callout--light">
        <text x={44} y={36} textAnchor="middle">
          ☀️ Light
        </text>
      </g>
      <g className="callout callout--focus">
        <text x={F_X} y={CENTER_Y + 30} textAnchor="middle">
          Focus
        </text>
      </g>

      <text className="caption" x={8} y={208}>
        Parallel rays → focal point (F)
      </text>
    </svg>
  )
}

/**
 * The focus animation plus a Replay button. Remounting the SVG (via key) restarts
 * its CSS animations from the top.
 */
export function RayFocusExplainer() {
  const [run, setRun] = useState(0)
  return (
    <div className="focus-explainer">
      <RayFocusAnimation key={run} />
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

// A point light source emits rays that pass through the lens and reconverge to a
// single image point — the parallel ray visibly passes through the focal point F.
// Coordinates are a correct real-image construction (f = 10, dₒ = 18 units).
const S = { x: 118, y: 62 } // light source (object tip)
const IMG = { x: 280, y: 170 } // image tip (inverted, below axis)
const LENS2_X = 190
const FR = { x: 230, y: 110 } // focal point (right)
const FL = { x: 150, y: 110 } // focal point (left)
// Where each principal ray crosses the lens plane.
const CROSS = { parallel: 62, chief: 110, focal: 170 }

export function RaySourceAnimation() {
  const rays: { cy: number }[] = [
    { cy: CROSS.parallel },
    { cy: CROSS.chief },
    { cy: CROSS.focal },
  ]
  return (
    <svg
      className="focus-anim"
      viewBox="0 0 360 220"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="A light source emits rays that pass through the lens and meet again at the image point, crossing the focal point."
    >
      <line className="axis" x1={0} y1={CENTER_Y} x2={360} y2={CENTER_Y} />

      {/* lens */}
      <path
        className="lens"
        d={`M ${LENS2_X},${CENTER_Y - 78} Q ${LENS2_X + 16},${CENTER_Y} ${LENS2_X},${CENTER_Y + 78} Q ${LENS2_X - 16},${CENTER_Y} ${LENS2_X},${CENTER_Y - 78} Z`}
      />

      {/* rays draw one by one: source -> lens (in), then lens -> image (out) */}
      {rays.map((r, i) => {
        const inDelay = i * RAY_STEP
        const outDelay = inDelay + SEG_DRAW * 0.8
        return (
          <g key={i}>
            <RaySeg pts={[[S.x, S.y], [LENS2_X, r.cy]]} cls="ray-in" delay={inDelay} />
            <RaySeg
              pts={[[LENS2_X, r.cy], [IMG.x, IMG.y]]}
              cls="ray-out"
              delay={outDelay}
            />
          </g>
        )
      })}

      {/* focal points (the parallel ray passes through FR) */}
      <circle className="fpoint fpoint--minor" cx={FL.x} cy={FL.y} r={3} />
      <circle className="fpoint" cx={FR.x} cy={FR.y} r={4} />
      <text className="flabel" x={FR.x} y={CENTER_Y - 12} textAnchor="middle">
        F
      </text>

      {/* light source: a glowing dot */}
      <circle className="src-glow" cx={S.x} cy={S.y} r={11} />
      <circle className="src" cx={S.x} cy={S.y} r={5} />
      {/* image point */}
      <circle className="img-point" cx={IMG.x} cy={IMG.y} r={4.5} />

      {/* callouts */}
      <g className="callout callout--light">
        <text x={S.x} y={S.y - 16} textAnchor="middle">
          ☀️ Light source
        </text>
      </g>
      <g className="callout callout--focus">
        <text x={FR.x} y={CENTER_Y + 28} textAnchor="middle">
          Focus
        </text>
      </g>

      <text className="caption" x={8} y={208}>
        Light source → through the lens → image
      </text>
    </svg>
  )
}

/** The source→image animation with a Replay button. */
export function RaySourceExplainer() {
  const [run, setRun] = useState(0)
  return (
    <div className="focus-explainer">
      <RaySourceAnimation key={run} />
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
