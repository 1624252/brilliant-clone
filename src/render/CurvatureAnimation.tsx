import { useState } from 'react'
import { useAnimationProgress } from './useAnimationProgress'
import './RayFocusAnimation.css'

const CX = 180
const CY = 105
const H = 62
const BULGE = 22
const LEFT = 18
const RIGHT = 342
const RAY_YS = [68, 90, 120, 142]

function lensPath(t: number) {
  const b = t * BULGE
  if (Math.abs(b) < 1.5) {
    return `M ${CX - 5},${CY - H} L ${CX + 5},${CY - H} L ${CX + 5},${CY + H} L ${CX - 5},${CY + H} Z`
  }
  const convex = b > 0
  const k = Math.abs(b)
  return convex
    ? `M ${CX},${CY - H} C ${CX - k},${CY - H * 0.55} ${CX - k},${CY + H * 0.55} ${CX},${CY + H} C ${CX + k},${CY + H * 0.55} ${CX + k},${CY - H * 0.55} ${CX},${CY - H} Z`
    : `M ${CX - k},${CY - H} C ${CX + k * 0.45},${CY - H * 0.4} ${CX + k * 0.45},${CY + H * 0.4} ${CX - k},${CY + H} L ${CX + k},${CY + H} C ${CX - k * 0.45},${CY + H * 0.4} ${CX - k * 0.45},${CY - H * 0.4} ${CX + k},${CY - H} Z`
}

export function CurvatureExplainer() {
  const [replayKey, setReplayKey] = useState(0)
  return (
    <div className="focus-explainer" key={replayKey}>
      <CurvatureAnimation />
      <button type="button" className="focus-replay" onClick={() => setReplayKey((k) => k + 1)}>
        Replay
      </button>
    </div>
  )
}

function CurvatureAnimation() {
  const p = useAnimationProgress(5200)
  const wave = Math.sin((p * Math.PI * 2) - Math.PI / 2)
  const t = Math.abs(wave) < 0.08 ? 0 : wave
  const focusX = t > 0 ? CX + 80 : CX - 80
  const label = t > 0.18 ? 'convex' : t < -0.18 ? 'concave' : 'flat'
  const rayClass = t > 0.18 ? 'shape-ray--converge' : t < -0.18 ? 'shape-ray--diverge' : 'shape-ray--flat'

  return (
    <svg
      className="focus-anim shape-anim"
      viewBox="0 0 360 220"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="A lens changes from concave to flat to convex while rays spread out, pass straight, or converge."
    >
      <line className="axis" x1={0} y1={CY} x2={360} y2={CY} />
      {RAY_YS.map((y) => {
        const bend = t * (CY - y) * 0.92
        const yEnd = y + bend
        return (
          <g key={y}>
            <path className="beam beam--in" d={`M ${LEFT},${y} L ${CX},${y}`} />
            <path className={`beam beam--out ${rayClass}`} d={`M ${CX},${y} L ${RIGHT},${yEnd}`} />
          </g>
        )
      })}
      <path className="lens" d={lensPath(t)} />
      {Math.abs(t) > 0.18 && (
        <g className="shape-focus">
          <circle className="fpoint" cx={focusX} cy={CY} r={4} />
          <text className="flabel" x={focusX} y={CY - 13} textAnchor="middle">
            F
          </text>
        </g>
      )}
      <text className="clens-stage shape-stage" x={CX} y={198} textAnchor="middle">
        {label === 'flat' ? 'Flat: rays pass straight' : `${label}: rays ${label === 'convex' ? 'converge' : 'diverge'}`}
      </text>
    </svg>
  )
}
