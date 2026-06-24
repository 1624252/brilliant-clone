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
  className?: string
  objectDistance: number
  focalLength: number
  objectHeight?: number
  scene?: SceneParams
  showRays?: boolean
  /** When false, hides the formed image (used to set up predict-then-reveal). */
  showImage?: boolean
  /** Which measurement overlays to draw. Each maps a symbol onto the picture. */
  measures?: MeasureFlags
  /** When set, pins the thin-lens equation with current numbers to the top-right corner. */
  equation?: EquationValues
  /** Overlay content (e.g., a drag handle) rendered on top of the diagram. */
  children?: ReactNode
}

export interface MeasureFlags {
  f?: boolean
  do?: boolean
  di?: boolean
  /** object/image height brackets (i.e. magnification). */
  m?: boolean
}

/** Live values plugged into the corner equation overlay. */
export interface EquationValues {
  f: number
  dObj: number
  dImg: number
  m: number
}

const fmtNum = (n: number) => (Number.isFinite(n) ? n.toFixed(1) : '\u221e')

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
  className,
  objectDistance,
  focalLength,
  objectHeight = 18,
  scene = DEFAULT_SCENE,
  showRays = true,
  showImage = true,
  measures = {},
  equation,
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
  const isFlat = !Number.isFinite(focalLength)
  const isConverging = focalLength > 0
  // The face bulge tracks focal length: a short f is strongly curved, a long f is
  // nearly flat. We measure it on a *log* scale of |f| (between ~12 and ~600, the
  // curvature slider's range) so that — since the slider maps to f logarithmically
  // — equal slider movement gives equal visual change, with no sudden jump.
  const bulgeT = isFlat
    ? 0
    : Math.min(
        1,
        Math.max(0, (Math.log(600) - Math.log(Math.abs(focalLength))) / (Math.log(600) - Math.log(12))),
      )
  const bulge = isFlat ? 0 : 3 + bulgeT * 15

  // A flat lens has no focal points to mark.
  const markers = isFlat
    ? []
    : [
        { x: focalLength, label: 'F' },
        { x: -focalLength, label: 'F' },
        { x: 2 * focalLength, label: '2F' },
        { x: -2 * focalLength, label: '2F' },
      ]

  const objBase = toSvg(trace.object.base, scene)
  const objTip = toSvg(trace.object.tip, scene)
  const objectInfinite = !Number.isFinite(objectDistance)
  const img = trace.image
  const imageIsVirtual = img ? img.base.x < 0 : false

  const label = showImage
    ? describeImage(
        trace.atInfinity,
        img?.base.x ?? 0,
        trace.object.tip.y,
        img?.tip.y ?? 0,
      )
    : 'Lens ray diagram: predict where the image forms.'

  return (
    <svg
      className={`lens-diagram${className ? ` ${className}` : ''}`}
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

      {/* lens body (real shape: convex converging, concave diverging, flat = none) */}
      <path
        className={`lens ${
          isFlat ? 'lens--flat' : isConverging ? 'lens--converging' : 'lens--diverging'
        }`}
        d={lensPath(center.x, center.y, lensHalf, isConverging, isFlat, bulge)}
      />
      <text
        className="lens-label"
        x={center.x}
        y={center.y + lensHalf + 24}
        textAnchor="middle"
      >
        {isFlat
          ? 'Flat lens'
          : isConverging
            ? 'Convex (converging) lens'
            : 'Concave (diverging) lens'}
      </text>

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
              <polyline className={`${RAY_CLASS[r.id]} ray--virtual`} points={polyline(r.dashed)} />
            )}
          </g>
        ))}

      {/* object: a candle at a finite distance, or a "from infinity" marker */}
      {objectInfinite ? (
        <g className="inf-source">
          <text x={objBase.x + 6} y={objTip.y - 14} textAnchor="start">
            ☀️ Object at ∞
          </text>
          <text
            className="inf-source__sub"
            x={objBase.x + 6}
            y={objTip.y + 4}
            textAnchor="start"
          >
            dₒ = ∞ · Parallel rays
          </text>
        </g>
      ) : (
        <Figure cx={objBase.x} baseY={objBase.y} tipY={objTip.y} variant="object" />
      )}
      {img && showImage && (
        <Figure
          cx={toSvg(img.base, scene).x}
          baseY={toSvg(img.base, scene).y}
          tipY={toSvg(img.tip, scene).y}
          variant={imageIsVirtual ? 'virtual' : 'real'}
        />
      )}

      {/* toggleable measurement overlays mapping each symbol onto the picture */}
      <g className="dims">
        {measures.f && Number.isFinite(focalLength) && (
          <HDim
            kind="f"
            x1={center.x}
            x2={toSvg({ x: focalLength, y: 0 }, scene).x}
            y={center.y + 34}
            axisY={center.y}
            label="f"
          />
        )}
        {measures.do &&
          (objectInfinite ? (
            <text className="dim__label dim__label--do" x={center.x - 80} y={center.y + 62}>
              dₒ = ∞
            </text>
          ) : (
            <HDim
              kind="do"
              x1={objBase.x}
              x2={center.x}
              y={center.y + 62}
              axisY={center.y}
              label="dₒ"
            />
          ))}
        {measures.di && img && (
          <HDim
            kind="di"
            x1={center.x}
            x2={toSvg(img.base, scene).x}
            y={center.y + 90}
            axisY={center.y}
            label="dᵢ"
          />
        )}
        {measures.m && (
          <VDim kind="m" x={objBase.x} y1={center.y} y2={objTip.y} label="h₀" />
        )}
        {measures.m && img && (
          <VDim
            kind="m"
            x={toSvg(img.base, scene).x}
            y1={center.y}
            y2={toSvg(img.tip, scene).y}
            label="hᵢ"
          />
        )}
      </g>

      {equation && <EquationBadge {...equation} scene={scene} />}

      {children}
    </svg>
  )
}

/** One term in an equation row: an operator, or a 1/den stacked fraction. */
type EqToken = { op: string } | { den: string; cls: string }

const EQ_FS = 18 // fraction glyph size (SVG units)
const EQ_GAP = 9 // horizontal gap between row tokens
const EQ_PAD = 16 // inner card padding
// Rough advance widths (no DOM measuring in SVG); kept generous so text never
// overflows the auto-sized card.
const eqTextW = (str: string, size: number) => str.length * size * 0.6
const eqFracW = (den: string) =>
  Math.max(eqTextW('1', EQ_FS), eqTextW(den, EQ_FS)) + 12
const eqTokenW = (t: EqToken) => ('op' in t ? eqTextW(t.op, EQ_FS) : eqFracW(t.den))
const eqRowW = (toks: EqToken[]) =>
  toks.reduce((sum, t) => sum + eqTokenW(t), 0) + EQ_GAP * (toks.length - 1)

/** One equation row laid out left→right starting at `startX`, centered on `cy`. */
function EqRow({
  toks,
  startX,
  cy,
  tone,
}: {
  toks: EqToken[]
  startX: number
  cy: number
  tone: 'sym' | 'num'
}) {
  const widths = toks.map(eqTokenW)
  // Left edge of each token = startX + sum of previous widths and gaps (pure).
  const lefts = widths.map(
    (_, i) => startX + widths.slice(0, i).reduce((a, b) => a + b, 0) + EQ_GAP * i,
  )
  return (
    <g className={`eqbadge__row eqbadge__row--${tone}`}>
      {toks.map((t, i) => {
        const w = widths[i]
        const cx = lefts[i]
        const mid = cx + w / 2
        if ('op' in t) {
          return (
            <text key={i} className="eqbadge__op" x={mid} y={cy + 6} textAnchor="middle">
              {t.op}
            </text>
          )
        }
        return (
          <g key={i}>
            {/* numerator 1 / bar / denominator */}
            <text className="eqbadge__fnum" x={mid} y={cy - 7} textAnchor="middle">
              1
            </text>
            <line className="eqbadge__bar" x1={cx + 2} x2={cx + w - 2} y1={cy} y2={cy} />
            <text className={`eqbadge__fden ${t.cls}`} x={mid} y={cy + 18} textAnchor="middle">
              {t.den}
            </text>
          </g>
        )
      })}
    </g>
  )
}

/**
 * The thin-lens equation pinned to the diagram's top-right corner: a faint
 * symbolic row over the same equation with the learner's current numbers
 * plugged in (both as stacked 1/d fractions), plus the magnification. Drawn in
 * SVG units so it scales with the diagram, and the card auto-sizes to its text.
 */
function EquationBadge({
  f,
  dObj,
  dImg,
  m,
  scene,
}: EquationValues & { scene: SceneParams }) {
  const num: EqToken[] = [
    { den: fmtNum(f), cls: 'eqbadge--f' },
    { op: '=' },
    { den: fmtNum(dObj), cls: 'eqbadge--do' },
    { op: '+' },
    { den: fmtNum(dImg), cls: 'eqbadge--di' },
  ]
  const mText = `m = ${fmtNum(m)}`

  const inner = Math.max(eqRowW(num), eqTextW(mText, EQ_FS))
  const w = Math.ceil(inner + EQ_PAD * 2)
  const x = scene.viewWidth - w - 12
  const y = 12
  const right = x + w - EQ_PAD

  const numCy = y + 30
  const mY = y + 64
  const h = mY + 10 - y

  return (
    <g
      className="eqbadge"
      role="img"
      aria-label={`Thin lens equation with current values: one over f ${fmtNum(
        f,
      )} equals one over object distance ${fmtNum(dObj)} plus one over image distance ${fmtNum(
        dImg,
      )}; magnification ${fmtNum(m)}.`}
    >
      <rect className="eqbadge__bg" x={x} y={y} width={w} height={h} rx={12} />
      <EqRow toks={num} startX={right - eqRowW(num)} cy={numCy} tone="num" />
      <text className="eqbadge__m" x={right} y={mY} textAnchor="end">
        {mText}
      </text>
    </g>
  )
}

function svgStr(p: Point, scene: SceneParams): string {
  const s = toSvg(p, scene)
  return `${s.x},${s.y}`
}

/**
 * Biconvex (converging), biconcave (diverging), or thin flat (no focusing) lens.
 * `bulge` is how far the faces bow (SVG units); it tracks the focal length so a
 * strong lens looks strongly curved and a weak one looks nearly flat.
 */
function lensPath(
  cx: number,
  cy: number,
  half: number,
  converging: boolean,
  flat = false,
  bulge = 14,
): string {
  if (flat) {
    // A thin rectangular slab: parallel faces, so it bends nothing.
    return `M ${cx - 5},${cy - half} L ${cx + 5},${cy - half} L ${cx + 5},${cy + half} L ${cx - 5},${cy + half} Z`
  }
  const w = bulge
  if (converging) {
    return `M ${cx},${cy - half} Q ${cx + w},${cy} ${cx},${cy + half} Q ${cx - w},${cy} ${cx},${cy - half} Z`
  }
  // Biconcave: straight outer edges (half-width w) with faces bowing inward to the
  // axis. The control point sits on the axis, so the faces never cross.
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
  return (
    <g className={`dim dim--${kind}`}>
      <line className="dim__guide" x1={x1} y1={axisY} x2={x1} y2={y} />
      <line className="dim__guide" x2={x2} y1={axisY} x1={x2} y2={y} />
      <line className="dim__line" x1={x1} y1={y} x2={x2} y2={y} />
      <line className="dim__tick" x1={x1} y1={y - 6} x2={x1} y2={y + 6} />
      <line className="dim__tick" x1={x2} y1={y - 6} x2={x2} y2={y + 6} />
      <text className="dim__label" x={mid} y={y - 8} textAnchor="middle">
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
  const bx = x - 22 // nudge the bracket just left of the candle body
  return (
    <g className={`dim dim--${kind}`}>
      <line className="dim__line" x1={bx} y1={y1} x2={bx} y2={y2} />
      <line className="dim__tick" x1={bx - 6} y1={y1} x2={bx + 6} y2={y1} />
      <line className="dim__tick" x1={bx - 6} y1={y2} x2={bx + 6} y2={y2} />
      <text className="dim__label" x={bx - 10} y={mid + 6} textAnchor="end">
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
