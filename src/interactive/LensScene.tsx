import { useRef, type PointerEvent } from 'react'
import {
  LensDiagram,
  DEFAULT_SCENE,
  toSvg,
  svgXToOpticalX,
  type SceneParams,
  type MeasureFlags,
} from '../render'
import { snapValue } from './snap'
import './LensScene.css'

interface LensSceneProps {
  objectDistance: number
  focalLength: number
  objectHeight?: number
  /** Drag clamp range for the object distance (optical units). */
  minObjectDistance?: number
  maxObjectDistance?: number
  /** When true, dragging the object to the far edge snaps it to infinity. */
  infinityAtEdge?: boolean
  /** Values the drag gently snaps to (e.g., 0, f, 2f). */
  snaps?: number[]
  onObjectDistanceChange?: (value: number) => void
  scene?: SceneParams
  showRays?: boolean
  /** When false, hides the formed image (predict-then-reveal). */
  showImage?: boolean
  measures?: MeasureFlags
}

/** Map a pointer event to an optical x using the SVG's coordinate transform. */
function pointerToOpticalX(
  e: PointerEvent<SVGCircleElement>,
  svg: SVGSVGElement,
  scene: SceneParams,
): number | null {
  const ctm = svg.getScreenCTM()
  if (!ctm) return null // e.g., jsdom in tests
  const local = new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse())
  return svgXToOpticalX(local.x, scene)
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

/**
 * Interactive ray diagram: renders LensDiagram and, when an onChange handler is
 * provided, overlays a draggable handle on the object so the learner can slide
 * it along the optical axis.
 */
export function LensScene({
  objectDistance,
  focalLength,
  objectHeight = 18,
  minObjectDistance = 5,
  maxObjectDistance = 75,
  infinityAtEdge = false,
  snaps,
  onObjectDistanceChange,
  scene = DEFAULT_SCENE,
  showRays = true,
  showImage = true,
  measures,
}: LensSceneProps) {
  const draggingRef = useRef(false)
  const draggable = Boolean(onObjectDistanceChange)

  // Keep the drag handle on-screen even when the object is far away or at
  // infinity (where -objectDistance would be off the left edge or non-finite).
  const edgeX = -scene.halfWidth + 2
  const safeX = Number.isFinite(objectDistance)
    ? Math.max(-objectDistance, edgeX)
    : edgeX
  const offscreen = !Number.isFinite(objectDistance) || -objectDistance < edgeX
  const handlePos = toSvg({ x: safeX, y: objectHeight }, scene)
  const ariaNow = Number.isFinite(objectDistance) ? objectDistance : maxObjectDistance
  const ariaValueText = Number.isFinite(objectDistance)
    ? `${objectDistance.toFixed(1)} optical units`
    : 'infinity'

  // Dragging the candle to (or past) the visible left edge means "infinitely
  // far away": the object distance jumps to ∞ and the rays become a parallel beam.
  const infinityEdge = scene.halfWidth - 2

  function updateFromPointer(e: PointerEvent<SVGCircleElement>) {
    const svg = e.currentTarget.ownerSVGElement
    if (!svg || !onObjectDistanceChange) return
    const opticalX = pointerToOpticalX(e, svg, scene)
    if (opticalX === null) return
    // Object sits to the left of the lens, so its distance is -x.
    const raw = -opticalX
    if (infinityAtEdge && raw >= infinityEdge) {
      onObjectDistanceChange(Infinity)
      return
    }
    const next = clamp(raw, minObjectDistance, maxObjectDistance)
    onObjectDistanceChange(snapValue(Number(next.toFixed(2)), snaps))
  }

  function onPointerDown(e: PointerEvent<SVGCircleElement>) {
    if (!draggable) return
    draggingRef.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    updateFromPointer(e)
  }
  function onPointerMove(e: PointerEvent<SVGCircleElement>) {
    if (!draggingRef.current) return
    updateFromPointer(e)
  }
  function onPointerUp(e: PointerEvent<SVGCircleElement>) {
    draggingRef.current = false
    e.currentTarget.releasePointerCapture(e.pointerId)
  }

  return (
    <LensDiagram
      objectDistance={objectDistance}
      focalLength={focalLength}
      objectHeight={objectHeight}
      scene={scene}
      showRays={showRays}
      showImage={showImage}
      measures={measures}
    >
      {draggable && (
        <circle
          className={`drag-handle ${offscreen ? 'drag-handle--offscreen' : ''}`}
          cx={handlePos.x}
          cy={handlePos.y}
          r={18}
          role="slider"
          aria-label="Object distance"
          aria-valuemin={minObjectDistance}
          aria-valuemax={maxObjectDistance}
          aria-valuenow={ariaNow}
          aria-valuetext={ariaValueText}
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onKeyDown={(e) => {
            if (!onObjectDistanceChange) return
            if (e.key === 'ArrowLeft') {
              // Move farther away; step past the edge lands on infinity.
              if (!Number.isFinite(objectDistance)) return
              const next = objectDistance + 1
              if (infinityAtEdge && next >= infinityEdge) {
                onObjectDistanceChange(Infinity)
              } else {
                onObjectDistanceChange(clamp(next, minObjectDistance, maxObjectDistance))
              }
            } else if (e.key === 'ArrowRight') {
              // Move closer; coming back from infinity returns to the edge.
              const from = Number.isFinite(objectDistance) ? objectDistance : infinityEdge + 1
              onObjectDistanceChange(clamp(from - 1, minObjectDistance, maxObjectDistance))
            }
          }}
        />
      )}
    </LensDiagram>
  )
}
