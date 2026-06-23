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
  objectHeight = 14,
  scene = DEFAULT_SCENE,
  showRays = true,
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
      </defs>

      {/* optical axis */}
      <line className="axis" x1={0} y1={center.y} x2={scene.viewWidth} y2={center.y} />

      {/* focal-point markers */}
      {markers.map((m, i) => {
        const s = toSvg({ x: m.x, y: 0 }, scene)
        return (
          <g key={i} className="focal">
            <circle cx={s.x} cy={s.y} r={3} />
            <text x={s.x} y={center.y + 17} textAnchor="middle">
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

/** A small candle drawn between a base point and a (possibly flipped) tip. */
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
  const delta = tipY - baseY // svg; negative when the figure points up
  const len = Math.abs(delta)
  if (len < 1) return null

  const width = Math.min(34, Math.max(10, len * 0.22))
  const bodyTopY = baseY + delta * 0.62
  const flameWidth = width * 0.85
  const midY = (bodyTopY + tipY) / 2
  const flame = `M ${cx - flameWidth / 2},${bodyTopY} Q ${cx - flameWidth / 2},${midY} ${cx},${tipY} Q ${cx + flameWidth / 2},${midY} ${cx + flameWidth / 2},${bodyTopY} Z`

  return (
    <g className={`figure figure--${variant}`}>
      <rect
        className="figure__body"
        x={cx - width / 2}
        y={Math.min(baseY, bodyTopY)}
        width={width}
        height={Math.abs(baseY - bodyTopY)}
        rx={3}
      />
      <path className="figure__flame" d={flame} />
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
