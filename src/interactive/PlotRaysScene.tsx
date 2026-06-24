import { useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react'
import {
  LensDiagram,
  DEFAULT_SCENE,
  sceneRightX,
  toSvg,
  svgXToOpticalX,
  svgYToOpticalY,
  type MeasureFlags,
} from '../render'
import type { Point } from '../engine'
import { LensScene } from './LensScene'
import { imageTip, rayChecks, type PlotScene } from './plotRays'
import './PlotRaysScene.css'

interface PlotRaysSceneProps {
  scene: { objectDistance: number; focalLength: number; objectHeight?: number }
  solved: boolean
  onReadyChange: (ready: boolean) => void
  measures?: MeasureFlags
}

const TOL = 3
const sc = DEFAULT_SCENE
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/** Point on the line a→b evaluated at x (a.x must differ from b.x). */
function atX(a: Point, b: Point, x: number): Point {
  const slope = (b.y - a.y) / (b.x - a.x)
  return { x, y: a.y + slope * (x - a.x) }
}

/**
 * Interactive ray construction: the learner drags one marker (their predicted
 * image point) until all three principal rays obey their rule and meet there.
 * Reuses LensDiagram for the lens/candle/axis and overlays the rays + handle.
 */
export function PlotRaysScene({ scene, solved, onReadyChange, measures }: PlotRaysSceneProps) {
  const H = scene.objectHeight ?? 18
  const s: PlotScene = {
    objectDistance: scene.objectDistance,
    focalLength: scene.focalLength,
    objectHeight: H,
  }
  const I = imageTip(s)
  const isVirtual = I.x < 0
  // Start the marker away from the answer so there's something to solve.
  const [marker, setMarker] = useState<Point>(
    isVirtual ? { x: Math.max(-sc.halfWidth + 8, I.x - 20), y: 10 } : { x: 50, y: 10 },
  )
  const draggingRef = useRef(false)

  const checks = rayChecks(marker, s, TOL)

  function moveTo(next: Point) {
    if (solved) return
    const minX = isVirtual ? -sc.halfWidth + 2 : 1
    const maxX = isVirtual ? -1 : sc.halfWidth - 2
    const clamped: Point = {
      x: clamp(next.x, minX, maxX),
      y: clamp(next.y, -(sc.halfHeight - 2), sc.halfHeight - 2),
    }
    if (rayChecks(clamped, s, TOL).all) {
      setMarker(I) // snap cleanly onto the true crossing
      onReadyChange(true)
    } else {
      setMarker(clamped)
      onReadyChange(false)
    }
  }

  function pointerToOptical(e: PointerEvent<SVGElement>): Point | null {
    const svg = e.currentTarget.ownerSVGElement
    const ctm = svg?.getScreenCTM()
    if (!svg || !ctm) return null // e.g., jsdom in tests
    const local = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse())
    return { x: svgXToOpticalX(local.x, sc), y: svgYToOpticalY(local.y, sc) }
  }

  function onPointerDown(e: PointerEvent<SVGCircleElement>) {
    if (solved) return
    draggingRef.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    const p = pointerToOptical(e)
    if (p) moveTo(p)
  }
  function onPointerMove(e: PointerEvent<SVGCircleElement>) {
    if (!draggingRef.current) return
    const p = pointerToOptical(e)
    if (p) moveTo(p)
  }
  function onPointerUp(e: PointerEvent<SVGCircleElement>) {
    draggingRef.current = false
    e.currentTarget.releasePointerCapture(e.pointerId)
  }
  function onKeyDown(e: KeyboardEvent) {
    if (solved) return
    const big = e.shiftKey ? 5 : 1
    const moves: Record<string, Point> = {
      ArrowLeft: { x: -big, y: 0 },
      ArrowRight: { x: big, y: 0 },
      ArrowUp: { x: 0, y: big },
      ArrowDown: { x: 0, y: -big },
    }
    const d = moves[e.key]
    if (!d) return
    e.preventDefault()
    moveTo({ x: marker.x + d.x, y: marker.y + d.y })
  }

  // Once solved, show the canonical, fully-correct diagram (rays + image candle).
  if (solved) {
    return (
      <div className="plot-scene">
        <LensScene
          objectDistance={s.objectDistance}
          focalLength={s.focalLength}
          objectHeight={H}
          showRays
          showImage
          measures={measures}
        />
        <RuleBadges checks={{ chief: true, parallel: true, focal: true, all: true }} />
      </div>
    )
  }

  // Fixed construction points (optical coords).
  const P: Point = { x: -s.objectDistance, y: H } // object tip
  const O: Point = { x: 0, y: 0 } // lens center
  const A: Point = { x: 0, y: H } // parallel ray's lens crossing
  const B: Point = { x: 0, y: I.y } // focal ray's lens crossing
  const R = sceneRightX(sc)

  const line = (a: Point, b: Point) => `${toSvg(a, sc).x},${toSvg(a, sc).y} ${toSvg(b, sc).x},${toSvg(b, sc).y}`
  // Outgoing segment from a lens crossing through the marker, extended to the edge.
  const outTo = (c: Point) => (Math.abs(marker.x - c.x) > 0.5 ? atX(c, marker, R) : marker)

  const m = toSvg(marker, sc)

  return (
    <div className="plot-scene">
      <LensDiagram
        objectDistance={s.objectDistance}
        focalLength={s.focalLength}
        objectHeight={H}
        showRays={false}
        showImage={false}
        measures={measures}
      >
        {/* incoming rays (before the lens) — fixed guides */}
        <polyline className="ray ray--parallel plot-in" points={line(P, A)} />
        <polyline className="ray ray--chief plot-in" points={line(P, O)} />
        <polyline className="ray ray--focal plot-in" points={line(P, B)} />

        {/* outgoing rays (after the lens) — pivot about each crossing toward the marker */}
        <polyline
          className={`ray ray--parallel plot-out ${checks.parallel ? 'plot-out--ok' : 'plot-out--off'}`}
          points={line(A, outTo(A))}
          markerEnd="url(#arrow)"
        />
        <polyline
          className={`ray ray--chief plot-out ${checks.chief ? 'plot-out--ok' : 'plot-out--off'}`}
          points={line(O, outTo(O))}
          markerEnd="url(#arrow)"
        />
        <polyline
          className={`ray ray--focal plot-out ${checks.focal ? 'plot-out--ok' : 'plot-out--off'}`}
          points={line(B, outTo(B))}
          markerEnd="url(#arrow)"
        />
        {isVirtual && (
          <>
            <polyline className="ray ray--parallel plot-virtual" points={line(A, marker)} />
            <polyline className="ray ray--chief plot-virtual" points={line(O, marker)} />
            <polyline className="ray ray--focal plot-virtual" points={line(B, marker)} />
          </>
        )}

        {/* draggable marker: the learner's predicted crossing point */}
        <circle className="plot-marker__pulse" cx={m.x} cy={m.y} r={22} />
        <circle
          className="plot-marker"
          cx={m.x}
          cy={m.y}
          r={13}
          role="button"
          tabIndex={0}
          aria-label="Predicted crossing point — drag to where the three rays meet"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onKeyDown={onKeyDown}
        />
      </LensDiagram>

      <RuleBadges checks={checks} />
    </div>
  )
}

const RAY_COLORS = { parallel: '#ff9f43', chief: '#54d6a0', focal: '#ff6b9d' }

/** Live checklist of the three ray rules; each lights up when satisfied. */
function RuleBadges({ checks }: { checks: ReturnType<typeof rayChecks> }) {
  const rows: { key: keyof typeof RAY_COLORS; ok: boolean; text: string }[] = [
    {
      key: 'parallel',
      ok: checks.parallel,
      text: 'Parallel ray lines up with the focus on the correct side',
    },
    {
      key: 'chief',
      ok: checks.chief,
      text: 'Chief ray goes straight through the center of the lens',
    },
    {
      key: 'focal',
      ok: checks.focal,
      text: 'Focal ray exits parallel to the optical axis',
    },
  ]
  return (
    <ul className="plot-rules" aria-label="Ray rules">
      {rows.map((r) => (
        <li key={r.key} className={r.ok ? 'is-ok' : ''}>
          <span
            className="requirement-box"
            style={{ '--rule-color': RAY_COLORS[r.key] } as CSSProperties}
          />
          <span>{r.text}</span>
          <span className="requirement-state" aria-hidden="true">
            {r.ok ? 'Done' : 'Needed'}
          </span>
        </li>
      ))}
    </ul>
  )
}
