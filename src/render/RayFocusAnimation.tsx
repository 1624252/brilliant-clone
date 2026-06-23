import './RayFocusAnimation.css'

// A looping explainer: parallel rays enter a converging lens and bend so they all
// cross at the focal point F. Purely presentational; respects reduced-motion.

const CENTER_Y = 110
const LENS_X = 190
const F_X = 270 // focal point to the right of the lens
const LEFT_F_X = 110 // mirror focal point (shown faint for context)
const RAY_YS = [56, 83, 137, 164] // parallel ray heights (skip the axis itself)

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

      {/* incoming parallel rays, then refracted rays converging to F */}
      {RAY_YS.map((y, i) => (
        <g key={i}>
          <line
            className="ray-in"
            pathLength={100}
            x1={6}
            y1={y}
            x2={LENS_X}
            y2={y}
            style={{ animationDelay: `${i * 0.06}s` }}
          />
          <line
            className="ray-out"
            pathLength={100}
            x1={LENS_X}
            y1={y}
            x2={F_X}
            y2={CENTER_Y}
            style={{ animationDelay: `${i * 0.06}s` }}
          />
        </g>
      ))}
      {/* the on-axis ray goes straight through */}
      <line className="ray-in" pathLength={100} x1={6} y1={CENTER_Y} x2={F_X} y2={CENTER_Y} />

      {/* focal points */}
      <circle className="fpoint fpoint--minor" cx={LEFT_F_X} cy={CENTER_Y} r={3} />
      <circle className="fpoint" cx={F_X} cy={CENTER_Y} r={4} />
      <text className="flabel" x={F_X} y={CENTER_Y - 12} textAnchor="middle">
        F
      </text>
      <text className="caption" x={8} y={206}>
        Parallel rays → focal point (F)
      </text>
    </svg>
  )
}
