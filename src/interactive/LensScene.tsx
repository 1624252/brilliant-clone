import { useRef, type PointerEvent } from 'react'
import {
  LensDiagram,
  DEFAULT_SCENE,
  toSvg,
  svgXToOpticalX,
  type SceneParams,
  type MeasureFlags,
} from '../render'
import './LensScene.css'

interface LensSceneProps {
  objectDistance: number
  focalLength: number
  objectHeight?: number
  /** Drag clamp range for the object distance (optical units). */
  minObjectDistance?: number
  maxObjectDistance?: number
  onObjectDistanceChange?: (value: number) => void
  scene?: SceneParams
  showRays?: boolean
  measures?: MeasureFlags
}

/** Map a pointer event to an optical x using the SVG's coordinate transform. */
function pointerToOpticalX(
  e: PointerEvent<SVGCircleElement>,
  svg: SVGSVGElement,
  scene: SceneParams,
): number | null {
  const ctm = svg.getScreenCTM()
  if (!ctm) return null // e.g. jsdom in tests
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
  onObjectDistanceChange,
  scene = DEFAULT_SCENE,
  showRays = true,
  measures,
}: LensSceneProps) {
  const draggingRef = useRef(false)
  const draggable = Boolean(onObjectDistanceChange)

  const handlePos = toSvg({ x: -objectDistance, y: objectHeight }, scene)

  function updateFromPointer(e: PointerEvent<SVGCircleElement>) {
    const svg = e.currentTarget.ownerSVGElement
    if (!svg || !onObjectDistanceChange) return
    const opticalX = pointerToOpticalX(e, svg, scene)
    if (opticalX === null) return
    // Object sits to the left of the lens, so its distance is -x.
    const next = clamp(-opticalX, minObjectDistance, maxObjectDistance)
    onObjectDistanceChange(Number(next.toFixed(2)))
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
      measures={measures}
    >
      {draggable && (
        <circle
          className="drag-handle"
          cx={handlePos.x}
          cy={handlePos.y}
          r={14}
          role="slider"
          aria-label="Object distance"
          aria-valuemin={minObjectDistance}
          aria-valuemax={maxObjectDistance}
          aria-valuenow={objectDistance}
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onKeyDown={(e) => {
            if (!onObjectDistanceChange) return
            if (e.key === 'ArrowLeft') {
              onObjectDistanceChange(clamp(objectDistance + 1, minObjectDistance, maxObjectDistance))
            } else if (e.key === 'ArrowRight') {
              onObjectDistanceChange(clamp(objectDistance - 1, minObjectDistance, maxObjectDistance))
            }
          }}
        />
      )}
    </LensDiagram>
  )
}
