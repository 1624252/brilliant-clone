import './ChromaticAberrationDiagram.css'

interface ChromaticAberrationDiagramProps {
  dispersion?: number
  screenDistance?: number
  correction?: number
}

const LENS_X = 180
const AXIS_Y = 120
const SCALE = 6
const GREEN_F = 20

function xFor(distance: number) {
  return LENS_X + distance * SCALE
}

function focusDistances(dispersion = 0.7, correction = 0) {
  const spread = 8 * Math.max(0, Math.min(1, dispersion)) * (1 - Math.max(0, Math.min(1, correction)))
  return {
    blue: GREEN_F - spread,
    green: GREEN_F,
    red: GREEN_F + spread,
  }
}

export function ChromaticAberrationDiagram({
  dispersion = 0.7,
  screenDistance,
  correction = 0,
}: ChromaticAberrationDiagramProps) {
  const f = focusDistances(dispersion, correction)
  const screenX = screenDistance === undefined ? null : xFor(screenDistance)
  const spread = f.red - f.blue
  return (
    <svg
      className="chromatic-diagram"
      viewBox="0 0 420 240"
      role="img"
      aria-label="Red, green, and blue rays focusing at different distances."
    >
      <line className="chromatic-axis" x1={20} y1={AXIS_Y} x2={400} y2={AXIS_Y} />
      <path className="chromatic-lens" d={`M ${LENS_X},35 Q ${LENS_X + 24},${AXIS_Y} ${LENS_X},205 Q ${LENS_X - 24},${AXIS_Y} ${LENS_X},35 Z`} />

      {[
        { id: 'blue', y: 62, focus: f.blue, color: '#5aa7ff' },
        { id: 'green', y: 120, focus: f.green, color: '#54d6a0' },
        { id: 'red', y: 178, focus: f.red, color: '#ff6b6b' },
      ].map((ray) => {
        const fx = xFor(ray.focus)
        return (
          <g key={ray.id} className={`chromatic-ray chromatic-ray--${ray.id}`}>
            <line x1={20} y1={ray.y} x2={LENS_X} y2={ray.y} />
            <line x1={LENS_X} y1={ray.y} x2={fx} y2={AXIS_Y} />
            <circle cx={fx} cy={AXIS_Y} r={5} />
            <text x={fx} y={AXIS_Y - 12} textAnchor="middle">
              {ray.id[0].toUpperCase()}
            </text>
          </g>
        )
      })}

      {screenX !== null && (
        <g className="chromatic-screen">
          <line x1={screenX} y1={42} x2={screenX} y2={198} />
          <text x={screenX} y={220} textAnchor="middle">
            screen
          </text>
        </g>
      )}

      <text className="chromatic-note" x={24} y={24}>
        {spread < 2
          ? 'Corrected: colors focus close together'
          : 'Chromatic aberration: colors focus apart'}
      </text>
    </svg>
  )
}
