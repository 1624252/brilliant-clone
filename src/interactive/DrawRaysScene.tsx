import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import type { Point, RayId } from '../engine'
import {
  LensDiagram,
  DEFAULT_SCENE,
  toSvg,
  svgXToOpticalX,
  svgYToOpticalY,
  type MeasureFlags,
} from '../render'
import { LensScene } from './LensScene'
import {
  constructionPoints,
  drawnRayChecks,
  type DrawnRays,
  type PlotScene,
} from './plotRays'
import './DrawRaysScene.css'

interface DrawRaysSceneProps {
  scene: { objectDistance: number; focalLength: number; objectHeight?: number }
  solved: boolean
  onReadyChange: (ready: boolean) => void
  measures?: MeasureFlags
}

type HandleKind = 'start' | 'end'

const TOL = 3
const sc = DEFAULT_SCENE
const rayIds: RayId[] = ['parallel', 'chief', 'focal']
const rayLabels: Record<RayId, string> = {
  parallel: 'Parallel ray',
  chief: 'Chief ray',
  focal: 'Focal ray',
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

function atX(a: Point, b: Point, x: number): Point {
  const slope = (b.y - a.y) / (b.x - a.x)
  return { x, y: a.y + slope * (x - a.x) }
}

function pointOnLineInScene(a: Point, b: Point): Point {
  const preferredX = Math.min(50, sc.halfWidth - 8)
  const slope = (b.y - a.y) / (b.x - a.x)
  if (Math.abs(slope) < 1e-6) return { x: preferredX, y: a.y }

  let p = atX(a, b, preferredX)
  const yLimit = sc.halfHeight - 4
  if (Math.abs(p.y) > yLimit) {
    const targetY = p.y > 0 ? yLimit : -yLimit
    const x = a.x + (targetY - a.y) / slope
    p = { x: clamp(x, 8, sc.halfWidth - 4), y: targetY }
  }
  return p
}

function ruleEndpoint(ray: RayId, s: PlotScene): Point {
  const pts = constructionPoints(s)
  if (ray === 'parallel') return pointOnLineInScene(pts.parallelStart, pts.farFocus)
  if (ray === 'chief') return pointOnLineInScene(pts.objectTip, pts.center)
  return { x: Math.min(50, sc.halfWidth - 8), y: pts.focalStart.y }
}

function initialRays(s: PlotScene): DrawnRays {
  const pts = constructionPoints(s)
  const offset = (p: Point): Point => ({
    x: p.x,
    y: clamp(p.y + 7, -(sc.halfHeight - 4), sc.halfHeight - 4),
  })
  return {
    parallel: { start: pts.parallelStart, end: offset(ruleEndpoint('parallel', s)) },
    chief: { start: pts.chiefStart, end: offset(ruleEndpoint('chief', s)) },
    focal: { start: pts.focalStart, end: offset(ruleEndpoint('focal', s)) },
  }
}

function statusText(ray: RayId, ok: boolean) {
  if (ok) return `${rayLabels[ray]} correct.`
  if (ray === 'parallel') return 'Parallel ray should bend through F.'
  if (ray === 'chief') return 'Chief ray should stay straight through the lens center.'
  return 'Focal ray should leave parallel to the optical axis.'
}

/** Draw-the-rays construction scene with pointer and keyboard-accessible handles. */
export function DrawRaysScene({ scene, solved, onReadyChange, measures }: DrawRaysSceneProps) {
  const H = scene.objectHeight ?? 18
  const s: PlotScene = useMemo(
    () => ({
      objectDistance: scene.objectDistance,
      focalLength: scene.focalLength,
      objectHeight: H,
    }),
    [H, scene.focalLength, scene.objectDistance],
  )
  const pts = constructionPoints(s)
  const sceneKey = `${s.objectDistance}:${s.focalLength}:${s.objectHeight}`
  const [rays, setRays] = useState<DrawnRays>(() => initialRays(s))
  const [activeRay, setActiveRay] = useState<RayId>('parallel')
  const [activeHandle, setActiveHandle] = useState<HandleKind>('end')
  const [trackedSceneKey, setTrackedSceneKey] = useState(sceneKey)
  const draggingRef = useRef<{ ray: RayId; handle: HandleKind } | null>(null)
  const checks = drawnRayChecks(rays, s, TOL)
  const isVirtual = pts.imageTip.x < 0

  if (sceneKey !== trackedSceneKey) {
    setTrackedSceneKey(sceneKey)
    setRays(initialRays(s))
    setActiveRay('parallel')
    setActiveHandle('end')
  }

  useEffect(() => {
    onReadyChange(checks.all)
  }, [checks.all, onReadyChange])

  function updateHandle(ray: RayId, handle: HandleKind, next: Point) {
    if (solved) return
    setRays((prev) => ({
      ...prev,
      [ray]: {
        ...prev[ray],
        [handle]: {
          x: clamp(next.x, -sc.halfWidth + 2, sc.halfWidth - 2),
          y: clamp(next.y, -(sc.halfHeight - 2), sc.halfHeight - 2),
        },
      },
    }))
  }

  function pointerToOptical(e: PointerEvent<SVGCircleElement>): Point | null {
    const svg = e.currentTarget.ownerSVGElement
    const ctm = svg?.getScreenCTM()
    if (!svg || !ctm) return null
    const local = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse())
    return { x: svgXToOpticalX(local.x, sc), y: svgYToOpticalY(local.y, sc) }
  }

  function onPointerDown(ray: RayId, handle: HandleKind, e: PointerEvent<SVGCircleElement>) {
    if (solved) return
    draggingRef.current = { ray, handle }
    setActiveRay(ray)
    setActiveHandle(handle)
    e.currentTarget.setPointerCapture(e.pointerId)
    const p = pointerToOptical(e)
    if (p) updateHandle(ray, handle, p)
  }

  function onPointerMove(e: PointerEvent<SVGCircleElement>) {
    const dragging = draggingRef.current
    if (!dragging) return
    const p = pointerToOptical(e)
    if (p) updateHandle(dragging.ray, dragging.handle, p)
  }

  function onPointerUp(e: PointerEvent<SVGCircleElement>) {
    draggingRef.current = null
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  function onHandleKeyDown(ray: RayId, handle: HandleKind, e: KeyboardEvent) {
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
    const current = rays[ray][handle]
    updateHandle(ray, handle, { x: current.x + d.x, y: current.y + d.y })
  }

  function nudge(handle: HandleKind, delta: Point) {
    const current = rays[activeRay][handle]
    updateHandle(activeRay, handle, { x: current.x + delta.x, y: current.y + delta.y })
  }

  if (solved) {
    return (
      <div className="draw-scene">
        <LensScene
          objectDistance={s.objectDistance}
          focalLength={s.focalLength}
          objectHeight={H}
          showRays
          showImage
          measures={measures}
        />
        <RuleBadges checks={checks} />
      </div>
    )
  }

  const line = (a: Point, b: Point) => `${toSvg(a, sc).x},${toSvg(a, sc).y} ${toSvg(b, sc).x},${toSvg(b, sc).y}`
  const guideStarts: Record<RayId, Point> = {
    parallel: pts.parallelStart,
    chief: pts.chiefStart,
    focal: pts.focalStart,
  }

  return (
    <div className="draw-scene">
      <div className="draw-toolbar" role="radiogroup" aria-label="Ray to draw">
        {rayIds.map((ray) => (
          <button
            key={ray}
            type="button"
            role="radio"
            aria-checked={activeRay === ray}
            className={`draw-toolbar__btn draw-toolbar__btn--${ray} ${
              activeRay === ray ? 'is-active' : ''
            }`}
            onClick={() => setActiveRay(ray)}
          >
            {rayLabels[ray]}
          </button>
        ))}
      </div>

      <LensDiagram
        objectDistance={s.objectDistance}
        focalLength={s.focalLength}
        objectHeight={H}
        showRays={false}
        showImage={false}
        measures={measures}
      >
        {rayIds.map((ray) => {
          const drawn = rays[ray]
          const isActive = activeRay === ray
          const startSvg = toSvg(drawn.start, sc)
          const endSvg = toSvg(drawn.end, sc)
          return (
            <g key={ray} className={`draw-ray draw-ray--${ray} ${isActive ? 'is-active' : ''}`}>
              <polyline className="draw-ray__guide" points={line(pts.objectTip, guideStarts[ray])} />
              <polyline
                className={`ray ray--${ray} draw-ray__line`}
                points={line(drawn.start, drawn.end)}
                markerEnd="url(#arrow)"
              />
              {isVirtual && (
                <polyline className="ray ray--virtual draw-ray__virtual" points={line(drawn.start, pts.imageTip)} />
              )}
              {(['start', 'end'] as HandleKind[]).map((handle) => (
                <circle
                  key={handle}
                  className={`draw-handle draw-handle--${handle} ${
                    isActive && activeHandle === handle ? 'is-active' : ''
                  }`}
                  cx={handle === 'start' ? startSvg.x : endSvg.x}
                  cy={handle === 'start' ? startSvg.y : endSvg.y}
                  r={handle === 'start' ? 14 : 16}
                  role="slider"
                  tabIndex={0}
                  aria-label={`${rayLabels[ray]} ${handle} point`}
                  aria-valuemin={-sc.halfWidth}
                  aria-valuemax={sc.halfWidth}
                  aria-valuenow={Number(rays[ray][handle].x.toFixed(1))}
                  aria-valuetext={`x ${rays[ray][handle].x.toFixed(1)}, y ${rays[ray][handle].y.toFixed(1)}`}
                  onFocus={() => {
                    setActiveRay(ray)
                    setActiveHandle(handle)
                  }}
                  onPointerDown={(e) => onPointerDown(ray, handle, e)}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onKeyDown={(e) => onHandleKeyDown(ray, handle, e)}
                />
              ))}
            </g>
          )
        })}
      </LensDiagram>

      <div className="draw-nudges" aria-label="Fine adjust selected ray">
        <span>
          Adjusting <strong>{rayLabels[activeRay]}</strong> {activeHandle} point
        </span>
        <div className="draw-nudges__handles">
          <button
            type="button"
            className={activeHandle === 'start' ? 'is-active' : ''}
            onClick={() => setActiveHandle('start')}
          >
            Start point
          </button>
          <button
            type="button"
            className={activeHandle === 'end' ? 'is-active' : ''}
            onClick={() => setActiveHandle('end')}
          >
            End point
          </button>
        </div>
        <div className="draw-nudges__grid">
          <button type="button" onClick={() => nudge(activeHandle, { x: 0, y: 1 })}>
            Up
          </button>
          <button type="button" onClick={() => nudge(activeHandle, { x: -1, y: 0 })}>
            Left
          </button>
          <button type="button" onClick={() => nudge(activeHandle, { x: 1, y: 0 })}>
            Right
          </button>
          <button type="button" onClick={() => nudge(activeHandle, { x: 0, y: -1 })}>
            Down
          </button>
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {statusText(activeRay, checks[activeRay])}
      </p>
      <RuleBadges checks={checks} />
    </div>
  )
}

const RAY_COLORS = { parallel: '#ff9f43', chief: '#54d6a0', focal: '#ff6b9d' }

function RuleBadges({ checks }: { checks: ReturnType<typeof drawnRayChecks> }) {
  const rows: { key: RayId; ok: boolean; text: string }[] = [
    { key: 'parallel', ok: checks.parallel, text: 'Parallel ray bends through F' },
    { key: 'chief', ok: checks.chief, text: 'Chief ray stays straight through center' },
    { key: 'focal', ok: checks.focal, text: 'Focal ray exits parallel' },
  ]
  return (
    <ul className="plot-rules draw-rules" aria-label="Ray rules">
      {rows.map((r) => (
        <li key={r.key} className={r.ok ? 'is-ok' : ''}>
          <span className="dot" style={{ background: RAY_COLORS[r.key] }} />
          <span>{r.text}</span>
          <span className="check" aria-hidden="true">
            {r.ok ? '✓' : ''}
          </span>
          <span className="sr-only">{r.ok ? ' correct' : ' not correct yet'}</span>
        </li>
      ))}
    </ul>
  )
}
