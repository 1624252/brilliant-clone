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
    pts
      .map((p) => {
        const s = toSvg(p, scene)
        return `${s.x},${s.y}`
      })
      .join(' ')

  const center = toSvg({ x: 0, y: 0 }, scene)
  const lensHalf = scene.halfHeight * 0.85 * scale // lens body half-height (px)
  const isConverging = focalLength > 0

  // Focal (F) and double-focal (2F) markers on both sides.
  const markers = [
    { x: focalLength, label: 'F' },
    { x: -focalLength, label: 'F' },
    { x: 2 * focalLength, label: '2F' },
    { x: -2 * focalLength, label: '2F' },
  ]

  const objBase = toSvg(trace.object.base, scene)
  const objTip = toSvg(trace.object.tip, scene)
  const img = trace.image
  const imgBase = img ? toSvg(img.base, scene) : null
  const imgTip = img ? toSvg(img.tip, scene) : null
  const imageIsVirtual = img ? img.base.x < 0 : false

  const label = describeImage(trace.atInfinity, img?.base.x ?? 0, trace.object.tip.y, img?.tip.y ?? 0)

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
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" fill="context-stroke" />
        </marker>
      </defs>

      {/* optical axis */}
      <line
        className="axis"
        x1={0}
        y1={center.y}
        x2={scene.viewWidth}
        y2={center.y}
      />

      {/* focal-point markers */}
      {markers.map((m, i) => {
        const s = toSvg({ x: m.x, y: 0 }, scene)
        return (
          <g key={i} className="focal">
            <circle cx={s.x} cy={s.y} r={3} />
            <text x={s.x} y={center.y + 18} textAnchor="middle">
              {m.label}
            </text>
          </g>
        )
      })}

      {/* lens body */}
      <line
        className={`lens ${isConverging ? 'lens--converging' : 'lens--diverging'}`}
        x1={center.x}
        y1={center.y - lensHalf}
        x2={center.x}
        y2={center.y + lensHalf}
        markerStart="url(#arrow)"
        markerEnd="url(#arrow)"
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

      {/* object arrow */}
      <line
        className="object"
        x1={objBase.x}
        y1={objBase.y}
        x2={objTip.x}
        y2={objTip.y}
        markerEnd="url(#arrow)"
      />

      {/* image arrow */}
      {imgBase && imgTip && (
        <line
          className={`image ${imageIsVirtual ? 'image--virtual' : 'image--real'}`}
          x1={imgBase.x}
          y1={imgBase.y}
          x2={imgTip.x}
          y2={imgTip.y}
          markerEnd="url(#arrow)"
        />
      )}

      {children}
    </svg>
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
