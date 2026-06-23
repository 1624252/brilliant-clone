import type { ReactNode } from 'react'
import { tracePrincipalRays, type Point } from '../engine'
import {
  DEFAULT_SCENE,
  sceneRightX,
  toSvg,
  scaleOf,
  type SceneParams,
} from './sceneGeometry'
import './LensDiagram.css'

interface LensDiagramProps {
  objectDistance: number
  focalLength: number
  objectHeight?: number
  scene?: SceneParams
  showRays?: boolean
  /** Overlay dimension lines for f, do, di and the object/image heights. */
  showMeasures?: boolean
  /** Overlay content (e.g. a drag handle) rendered on top of the diagram. */
  children?: ReactNode
}

const RAY_CLASS: Record<string, string> = {
  parallel: 'ray ray--parallel',
  chief: 'ray ray--chief',
  focal: 'ray ray--focal',
}

/**
 * Presentational SVG of a thin-lens ray diagram. Pure: it derives everything
 * from objectDistance/focalLength via the engine and draws it. No state.
 */
export function LensDiagram({
  objectDistance,
  focalLength,
  objectHeight = 18,
  scene = DEFAULT_SCENE,
  showRays = true,
  showMeasures = false,
  children,
}: LensDiagramProps) {
  const trace = tracePrincipalRays(
    objectDistance,
    focalLength,
    objectHeight,
    sceneRightX(scene),
  )
  const scale = scaleOf(scene)
  const polyline = (pts: Point[]) =>
    pts.map((p) => svgStr(p, scene)).join(' ')

  const center = toSvg({ x: 0, y: 0 }, scene)
  const lensHalf = scene.halfHeight * 0.82 * scale
  const isConverging = focalLength > 0

  const markers = [
    { x: focalLength, label: 'F' },
    { x: -focalLength, label: 'F' },
    { x: 2 * focalLength, label: '2F' },
    { x: -2 * focalLength, label: '2F' },
  ]

  const objBase = toSvg(trace.object.base, scene)
  const objTip = toSvg(trace.object.tip, scene)
  const img = trace.image
  const imageIsVirtual = img ? img.base.x < 0 : false

  const label = describeImage(
    trace.atInfinity,
    img?.base.x ?? 0,
    trace.object.tip.y,
    img?.tip.y ?? 0,
  )

  return (
    <svg
      className="lens-diagram"
      viewBox={`0 0 ${scene.viewWidth} ${scene.viewHeight}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={label}
    >
      <defs>
        <marker
          id="arrow"
          viewBox="0 0 10 10"
          refX="8"
          refY="5"
          markerWidth="6"
          markerHeight="6"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" fill="context-stroke" />
        </marker>
        <linearGradient id="glass" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#6fb3ff" stopOpacity="0.15" />
          <stop offset="50%" stopColor="#bcd6ff" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#6fb3ff" stopOpacity="0.15" />
        </linearGradient>
        {/* candle wax: shaded left-to-right so the body reads as a cylinder */}
        <linearGradient id="wax" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#cdb789" />
          <stop offset="30%" stopColor="#f6eccd" />
          <stop offset="70%" stopColor="#f1e4c0" />
          <stop offset="100%" stopColor="#c4ad80" />
        </linearGradient>
        {/* flame: hot yellow core to orange edge */}
        <radialGradient id="flame" cx="50%" cy="55%" r="60%">
          <stop offset="0%" stopColor="#fff3b0" />
          <stop offset="55%" stopColor="#ffb047" />
          <stop offset="100%" stopColor="#ff6b3d" />
        </radialGradient>
      </defs>

      {/* optical axis */}
      <line className="axis" x1={0} y1={center.y} x2={scene.viewWidth} y2={center.y} />

      {/* focal-point markers */}
      {markers.map((m, i) => {
        const s = toSvg({ x: m.x, y: 0 }, scene)
        return (
          <g key={i} className="focal">
            <circle cx={s.x} cy={s.y} r={4} />
            <text x={s.x} y={center.y - 12} textAnchor="middle">
              {m.label}
            </text>
          </g>
        )
      })}

      {/* lens body (real shape: convex when converging, concave when diverging) */}
      <path
        className={`lens ${isConverging ? 'lens--converging' : 'lens--diverging'}`}
        d={lensPath(center.x, center.y, lensHalf, isConverging)}
      />

      {/* principal rays */}
      {showRays &&
        trace.rays.map((r, i) => (
          <g key={i}>
            <polyline
              className={RAY_CLASS[r.id]}
              points={polyline(r.solid)}
              markerEnd="url(#arrow)"
            />
            {r.dashed && (
              <polyline className="ray ray--virtual" points={polyline(r.dashed)} />
            )}
          </g>
        ))}

      {/* object + image as candle figures (orientation + size read at a glance) */}
      <Figure cx={objBase.x} baseY={objBase.y} tipY={objTip.y} variant="object" />
      {img && (
        <Figure
          cx={toSvg(img.base, scene).x}
          baseY={toSvg(img.base, scene).y}
          tipY={toSvg(img.tip, scene).y}
          variant={imageIsVirtual ? 'virtual' : 'real'}
        />
      )}

      {/* toggleable measurement overlays mapping each symbol onto the picture */}
      {showMeasures && (
        <g className="dims">
          <HDim
            kind="f"
            x1={center.x}
            x2={toSvg({ x: focalLength, y: 0 }, scene).x}
            y={center.y + 30}
            axisY={center.y}
            label="f"
          />
          <HDim
            kind="do"
            x1={objBase.x}
            x2={center.x}
            y={center.y + 56}
            axisY={center.y}
            label="dₒ"
          />
          {img && (
            <HDim
              kind="di"
              x1={center.x}
              x2={toSvg(img.base, scene).x}
              y={center.y + 82}
              axisY={center.y}
              label="dᵢ"
            />
          )}
          <VDim
            kind="m"
            x={objBase.x}
            y1={center.y}
            y2={objTip.y}
            label="h₀"
          />
          {img && (
            <VDim
              kind="m"
              x={toSvg(img.base, scene).x}
              y1={center.y}
              y2={toSvg(img.tip, scene).y}
              label="hᵢ"
            />
          )}
        </g>
      )}

      {children}
    </svg>
  )
}

function svgStr(p: Point, scene: SceneParams): string {
  const s = toSvg(p, scene)
  return `${s.x},${s.y}`
}

/** Biconvex (converging) or biconcave (diverging) lens outline. */
function lensPath(cx: number, cy: number, half: number, converging: boolean): string {
  const w = 14
  if (converging) {
    return `M ${cx},${cy - half} Q ${cx + w},${cy} ${cx},${cy + half} Q ${cx - w},${cy} ${cx},${cy - half} Z`
  }
  return `M ${cx - w},${cy - half} Q ${cx},${cy} ${cx - w},${cy + half} L ${cx + w},${cy + half} Q ${cx},${cy} ${cx + w},${cy - half} Z`
}

/**
 * A candle drawn from a base point (on the axis) to a tip. The whole figure is
 * parametrized along base->tip, so an inverted image (tip below the axis) simply
 * draws the candle upside-down, making the flip obvious.
 */
function Figure({
  cx,
  baseY,
  tipY,
  variant,
}: {
  cx: number
  baseY: number
  tipY: number
  variant: 'object' | 'real' | 'virtual'
}) {
  const delta = tipY - baseY // svg; negative when the candle points up
  const len = Math.abs(delta)
  if (len < 1) return null

  // Point at a fraction along base(0) -> tip(1). Width (x) is orientation-free.
  const at = (frac: number) => baseY + delta * frac
  const bodyW = Math.min(34, Math.max(11, len * 0.2))
  const flameW = bodyW * 0.6
  const rimRy = bodyW * 0.16

  // Body 0..0.64; wax pool at 0.64; wick 0.64..0.71; flame 0.71..1.
  const bodyTop = at(0.64)
  const bodyRectY = Math.min(baseY, bodyTop)
  const bodyH = Math.abs(baseY - bodyTop)

  const fb = at(0.72) // flame base
  const ft = at(1) // flame tip
  const teardrop = (w: number, base: number, tip: number) => {
    const mid = base + (tip - base) * 0.5
    const lip = base + (tip - base) * 0.12
    return `M ${cx - w / 2},${base} Q ${cx},${lip} ${cx + w / 2},${base} Q ${cx + w / 2},${mid} ${cx},${tip} Q ${cx - w / 2},${mid} ${cx - w / 2},${base} Z`
  }

  return (
    <g className={`figure figure--${variant}`}>
      {/* saucer / holder under the candle */}
      <ellipse className="figure__saucer" cx={cx} cy={baseY} rx={bodyW * 0.85} ry={rimRy} />
      {/* wax body */}
      <rect
        className="figure__wax"
        x={cx - bodyW / 2}
        y={bodyRectY}
        width={bodyW}
        height={bodyH}
        rx={bodyW * 0.22}
      />
      {/* soft highlight stripe for a waxy sheen */}
      <rect
        className="figure__sheen"
        x={cx - bodyW * 0.28}
        y={Math.min(baseY, at(0.6))}
        width={bodyW * 0.18}
        height={Math.abs(baseY - at(0.6))}
        rx={bodyW * 0.09}
      />
      {/* molten wax pool on top */}
      <ellipse className="figure__pool" cx={cx} cy={at(0.64)} rx={bodyW / 2} ry={rimRy} />
      {/* wick */}
      <line className="figure__wick" x1={cx} y1={at(0.64)} x2={cx} y2={at(0.72)} />
      {/* flame glow, then flame, then hot core */}
      <ellipse
        className="figure__glow"
        cx={cx}
        cy={at(0.86)}
        rx={flameW * 1.15}
        ry={Math.abs(ft - fb) * 0.7}
      />
      <path className="figure__flame" d={teardrop(flameW, fb, ft)} />
      <path className="figure__flame-core" d={teardrop(flameW * 0.5, at(0.78), at(0.96))} />
    </g>
  )
}

/** A horizontal distance measurement with end ticks, axis guides, and a label pill. */
function HDim({
  kind,
  x1,
  x2,
  y,
  axisY,
  label,
}: {
  kind: 'f' | 'do' | 'di'
  x1: number
  x2: number
  y: number
  axisY: number
  label: string
}) {
  if (Math.abs(x2 - x1) < 2) return null
  const mid = (x1 + x2) / 2
  const pillW = label.length * 11 + 16
  return (
    <g className={`dim dim--${kind}`}>
      <line className="dim__guide" x1={x1} y1={axisY} x2={x1} y2={y} />
      <line className="dim__guide" x2={x2} y1={axisY} x1={x2} y2={y} />
      <line className="dim__line" x1={x1} y1={y} x2={x2} y2={y} />
      <line className="dim__tick" x1={x1} y1={y - 5} x2={x1} y2={y + 5} />
      <line className="dim__tick" x1={x2} y1={y - 5} x2={x2} y2={y + 5} />
      <rect
        className="dim__pill"
        x={mid - pillW / 2}
        y={y - 12}
        width={pillW}
        height={24}
        rx={12}
      />
      <text className="dim__label" x={mid} y={y + 6} textAnchor="middle">
        {label}
      </text>
    </g>
  )
}

/** A vertical height measurement (used for object/image heights -> magnification). */
function VDim({
  kind,
  x,
  y1,
  y2,
  label,
}: {
  kind: 'm'
  x: number
  y1: number
  y2: number
  label: string
}) {
  if (Math.abs(y2 - y1) < 2) return null
  const mid = (y1 + y2) / 2
  const bx = x - 20 // nudge the bracket just left of the candle body
  return (
    <g className={`dim dim--${kind}`}>
      <line className="dim__line" x1={bx} y1={y1} x2={bx} y2={y2} />
      <line className="dim__tick" x1={bx - 5} y1={y1} x2={bx + 5} y2={y1} />
      <line className="dim__tick" x1={bx - 5} y1={y2} x2={bx + 5} y2={y2} />
      <rect className="dim__pill" x={bx - 18} y={mid - 12} width={36} height={24} rx={12} />
      <text className="dim__label" x={bx} y={mid + 6} textAnchor="middle">
        {label}
      </text>
    </g>
  )
}

/** Human-readable summary used as the SVG's accessible label (and in tests). */
function describeImage(
  atInfinity: boolean,
  imageX: number,
  objectTipY: number,
  imageTipY: number,
): string {
  if (atInfinity) return 'Object at the focal point; the image forms at infinity.'
  const real = imageX > 0 ? 'real' : 'virtual'
  const orientation = Math.sign(imageTipY) === Math.sign(objectTipY) ? 'upright' : 'inverted'
  return `Lens ray diagram: ${real}, ${orientation} image.`
}
