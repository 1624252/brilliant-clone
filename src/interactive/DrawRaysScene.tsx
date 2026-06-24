import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from 'react'
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
  extendRayToBounds,
  type DrawnRays,
  type PlotScene,
} from './plotRays'
import './DrawRaysScene.css'

interface DrawRaysSceneProps {
  scene: { objectDistance: number; focalLength: number; objectHeight?: number }
  solved: boolean
  onReadyChange: (ready: boolean) => void
  onHintChange?: (hint: string) => void
  measures?: MeasureFlags
  resetKey?: number
}

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
  if (ray === 'parallel') return 'Parallel ray should head right and line up with the far-side F.'
  if (ray === 'chief') return 'Chief ray should head right in a straight line through the center of the lens.'
  return 'Focal ray should head right and leave parallel to the optical axis.'
}

function firstHint(checks: ReturnType<typeof drawnRayChecks>, s: PlotScene): string {
  const farSide = s.focalLength > 0 ? 'right-side' : 'left-side virtual'
  if (!checks.directions.parallel) {
    return 'The parallel ray starts at the object height on the lens and should travel to the right after the lens.'
  }
  if (!checks.parallel) {
    return `Aim the parallel ray so its outgoing path lines up with the ${farSide} focus F. For a concave lens, use the dotted back-trace to see that alignment.`
  }
  if (!checks.directions.chief) {
    return 'The chief ray should continue to the right after passing through the center of the lens.'
  }
  if (!checks.chief) {
    return 'Aim the chief ray in one straight line through the center of the lens.'
  }
  if (!checks.directions.focal) {
    return 'The focal ray should continue to the right after crossing the lens.'
  }
  if (!checks.focal) {
    return 'Aim the focal ray so it exits parallel to the optical axis, which is the horizontal center line.'
  }
  return 'Drag the ray endpoints until all three requirements are marked Done.'
}

/** Draw-the-rays construction scene with pointer and keyboard-accessible handles. */
export function DrawRaysScene({
  scene,
  solved,
  onReadyChange,
  onHintChange,
  measures,
  resetKey = 0,
}: DrawRaysSceneProps) {
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
  const [trackedSceneKey, setTrackedSceneKey] = useState(sceneKey)
  const [trackedResetKey, setTrackedResetKey] = useState(resetKey)
  const draggingRef = useRef<RayId | null>(null)
  const checks = drawnRayChecks(rays, s, TOL)
  const isVirtual = pts.imageTip.x < 0
  const orderedRayIds = rayIds.filter((ray) => ray !== activeRay).concat(activeRay)

  if (sceneKey !== trackedSceneKey) {
    setTrackedSceneKey(sceneKey)
    setRays(initialRays(s))
    setActiveRay('parallel')
  }

  if (resetKey !== trackedResetKey) {
    setTrackedResetKey(resetKey)
    setRays(initialRays(s))
    setActiveRay('parallel')
    draggingRef.current = null
  }

  useEffect(() => {
    onReadyChange(checks.all)
  }, [checks.all, onReadyChange])

  useEffect(() => {
    onHintChange?.(firstHint(checks, s))
  }, [
    checks.parallel,
    checks.chief,
    checks.focal,
    checks.directions.parallel,
    checks.directions.chief,
    checks.directions.focal,
    onHintChange,
    s,
  ])

  function updateEnd(ray: RayId, next: Point) {
    if (solved) return
    const clamped = {
      x: clamp(next.x, -sc.halfWidth + 2, sc.halfWidth - 2),
      y: clamp(next.y, -(sc.halfHeight - 2), sc.halfHeight - 2),
    }
    setRays((prev) => {
      const candidate: DrawnRays = {
        ...prev,
        [ray]: {
          ...prev[ray],
          end: clamped,
        },
      }
      const end = drawnRayChecks(candidate, s, TOL)[ray] ? ruleEndpoint(ray, s) : clamped
      return {
        ...prev,
        [ray]: {
          ...prev[ray],
          end,
        },
      }
    })
  }

  function pointerToOptical(e: PointerEvent<SVGCircleElement>): Point | null {
    const svg = e.currentTarget.ownerSVGElement
    const ctm = svg?.getScreenCTM()
    if (!svg || !ctm) return null
    const local = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse())
    return { x: svgXToOpticalX(local.x, sc), y: svgYToOpticalY(local.y, sc) }
  }

  function onPointerDown(ray: RayId, e: PointerEvent<SVGCircleElement>) {
    if (solved) return
    draggingRef.current = ray
    setActiveRay(ray)
    e.currentTarget.setPointerCapture(e.pointerId)
    const p = pointerToOptical(e)
    if (p) updateEnd(ray, p)
  }

  function onPointerMove(e: PointerEvent<SVGCircleElement>) {
    const ray = draggingRef.current
    if (!ray) return
    const p = pointerToOptical(e)
    if (p) updateEnd(ray, p)
  }

  function onPointerUp(e: PointerEvent<SVGCircleElement>) {
    draggingRef.current = null
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  function onHandleKeyDown(ray: RayId, e: KeyboardEvent) {
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
    const current = rays[ray].end
    updateEnd(ray, { x: current.x + d.x, y: current.y + d.y })
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
  const rayBounds = {
    minX: -sc.halfWidth + 2,
    maxX: sc.halfWidth - 2,
    minY: -(sc.halfHeight - 2),
    maxY: sc.halfHeight - 2,
  }
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
        {orderedRayIds.map((ray) => {
          const drawn = rays[ray]
          const isActive = activeRay === ray
          const extendedEnd = extendRayToBounds(drawn.start, drawn.end, rayBounds)
          const backEnd = extendRayToBounds(drawn.start, {
            x: drawn.start.x - (drawn.end.x - drawn.start.x),
            y: drawn.start.y - (drawn.end.y - drawn.start.y),
          }, rayBounds)
          const endSvg = toSvg(drawn.end, sc)
          return (
            <g key={ray} className={`draw-ray draw-ray--${ray} ${isActive ? 'is-active' : ''}`}>
              <polyline className="draw-ray__guide" points={line(pts.objectTip, guideStarts[ray])} />
              <polyline
                className={`ray ray--${ray} draw-ray__incoming`}
                points={line(pts.objectTip, drawn.start)}
                onPointerDown={() => setActiveRay(ray)}
              />
              <polyline
                className={`ray ray--${ray} draw-ray__line`}
                points={line(drawn.start, extendedEnd)}
                markerEnd="url(#arrow)"
                onPointerDown={() => setActiveRay(ray)}
              />
              {isVirtual && (
                <polyline
                  className={`ray ray--${ray} draw-ray__virtual`}
                  points={line(drawn.start, backEnd)}
                  onPointerDown={() => setActiveRay(ray)}
                />
              )}
              <circle
                className={`draw-handle draw-handle--end ${isActive ? 'is-active' : ''}`}
                cx={endSvg.x}
                cy={endSvg.y}
                r={16}
                role="slider"
                tabIndex={0}
                aria-label={`${rayLabels[ray]} end point`}
                aria-valuemin={-sc.halfWidth}
                aria-valuemax={sc.halfWidth}
                aria-valuenow={Number(rays[ray].end.x.toFixed(1))}
                aria-valuetext={`x ${rays[ray].end.x.toFixed(1)}, y ${rays[ray].end.y.toFixed(1)}`}
                onFocus={() => setActiveRay(ray)}
                onPointerDown={(e) => onPointerDown(ray, e)}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onKeyDown={(e) => onHandleKeyDown(ray, e)}
              />
            </g>
          )
        })}
      </LensDiagram>

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
    <ul className="plot-rules draw-rules" aria-label="Ray rules">
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
          <span className="sr-only">{r.ok ? ' correct' : ' not correct yet'}</span>
        </li>
      ))}
    </ul>
  )
}
