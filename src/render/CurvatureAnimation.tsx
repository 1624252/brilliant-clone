import { useState } from 'react'
import { useAnimationProgress } from './useAnimationProgress'
import './RayFocusAnimation.css'

const CX = 180
const CY = 105
const H = 62
const BULGE = 22
const SLAB_HALF_WIDTH = 5
const LEFT = 18
const RIGHT = 342
const RAY_YS = [68, 90, 120, 142]
const FOCUS_OFFSET = 94

function lensPath(t: number) {
  const amount = Math.abs(t)
  if (amount < 0.04) {
    return `M ${CX - SLAB_HALF_WIDTH},${CY - H} L ${CX + SLAB_HALF_WIDTH},${CY - H} L ${CX + SLAB_HALF_WIDTH},${CY + H} L ${CX - SLAB_HALF_WIDTH},${CY + H} Z`
  }
  const convex = t > 0
  if (convex) {
    const sw = lerp(SLAB_HALF_WIDTH, 7, amount)
    const bulge = BULGE * amount
    const topR = `${CX + sw},${CY - H}`
    const botR = `${CX + sw},${CY + H}`
    const botL = `${CX - sw},${CY + H}`
    const topL = `${CX - sw},${CY - H}`
    const ctrlR = `${CX + sw + bulge},${CY}`
    const ctrlL = `${CX - sw - bulge},${CY}`
    return `M ${topR} Q ${ctrlR} ${botR} L ${botL} Q ${ctrlL} ${topL} Z`
  }

  const sw = lerp(SLAB_HALF_WIDTH, 11, amount)
  const inset = Math.min(sw - 2, 22 * amount)
  const topL = `${CX - sw},${CY - H}`
  const botL = `${CX - sw},${CY + H}`
  const botR = `${CX + sw},${CY + H}`
  const topR = `${CX + sw},${CY - H}`
  const ctrlL = `${CX - sw + inset},${CY}`
  const ctrlR = `${CX + sw - inset},${CY}`
  return `M ${topL} Q ${ctrlL} ${botL} L ${botR} Q ${ctrlR} ${topR} Z`
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function stageProgress(p: number) {
  if (p < 0.3) {
    return { label: 'concave', t: lerp(-1, 0, p / 0.3), hold: false }
  }
  if (p < 0.42) return { label: 'flat', t: 0, hold: true }
  if (p < 0.58) return { label: 'flat', t: 0, hold: true }
  if (p < 0.88) {
    return { label: 'convex', t: lerp(0, 1, (p - 0.58) / 0.3), hold: false }
  }
  return { label: 'convex', t: 1, hold: true }
}

function pathToFocus(y: number, amount: number, focusX: number) {
  const endAtFocus = y + ((CY - y) * (RIGHT - CX)) / (focusX - CX)
  return lerp(y, endAtFocus, amount)
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
  const stage = stageProgress(p)
  const t = Math.abs(stage.t) < 0.08 ? 0 : stage.t
  const amount = Math.abs(t)
  const label = stage.label
  const realFocusX = CX + FOCUS_OFFSET
  const virtualFocusX = CX - FOCUS_OFFSET
  const liveRealFocusX = t > 0.02 ? CX + FOCUS_OFFSET / amount : Infinity
  const liveVirtualFocusX = t < -0.02 ? CX - FOCUS_OFFSET / amount : -Infinity
  const realFocusOnScreen = liveRealFocusX <= RIGHT - 6
  const virtualFocusOnScreen = liveVirtualFocusX >= LEFT + 6
  const focusX = t >= 0 ? liveRealFocusX : liveVirtualFocusX
  const rayClass =
    label === 'convex'
      ? 'shape-ray--converge'
      : label === 'concave'
        ? 'shape-ray--diverge'
        : 'shape-ray--flat'

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
        const yEnd =
          label === 'flat'
            ? y
            : label === 'convex'
              ? pathToFocus(y, amount, realFocusX)
              : pathToFocus(y, amount, virtualFocusX)
        const virtualYEnd =
          label === 'concave' && virtualFocusOnScreen
            ? y + amount * ((CY - y) * (focusX - CX)) / (virtualFocusX - CX)
            : CY
        return (
          <g key={y}>
            <path className="beam beam--in" d={`M ${LEFT},${y} L ${CX},${y}`} />
            <path className={`beam beam--out ${rayClass}`} d={`M ${CX},${y} L ${RIGHT},${yEnd}`} />
            {label === 'concave' && virtualFocusOnScreen && (
              <path
                className="beam--virtual shape-ray--virtual"
                d={`M ${CX},${y} L ${focusX},${virtualYEnd}`}
              />
            )}
          </g>
        )
      })}
      <path className="lens" d={lensPath(t)} />
      {label !== 'flat' && (label === 'convex' ? realFocusOnScreen : virtualFocusOnScreen) && (
        <g className="shape-focus">
          <circle className="fpoint" cx={focusX} cy={CY} r={4} />
          <text className="flabel" x={focusX} y={CY - 13} textAnchor="middle">
            F
          </text>
        </g>
      )}
      <text className="clens-stage shape-stage" x={CX} y={198} textAnchor="middle">
        {label === 'flat'
          ? 'Flat: rays pass straight'
          : `${label}: rays ${label === 'convex' ? 'converge' : 'diverge'}`}
      </text>
    </svg>
  )
}
