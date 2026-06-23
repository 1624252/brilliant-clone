import { useId } from 'react'
import './Logo.css'

/**
 * The LensLab mark: a biconvex lens taking parallel rays and converging them to
 * a glowing focal point — the whole app in one glyph. Gradient ids are unique per
 * instance (useId) so multiple logos on a page don't collide.
 */
export function LogoMark({
  size = 36,
  className,
}: {
  size?: number
  className?: string
}) {
  const uid = useId().replace(/:/g, '')
  const badge = `b-${uid}`
  const sheen = `s-${uid}`
  const lens = `l-${uid}`
  const glow = `g-${uid}`
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      role="img"
      aria-label="LensLab"
      className={className}
    >
      <defs>
        <linearGradient id={badge} x1="6" y1="4" x2="58" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#5b8bff" />
          <stop offset="1" stopColor="#27c79a" />
        </linearGradient>
        <linearGradient id={sheen} x1="32" y1="3" x2="32" y2="40" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.30" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={lens} x1="21" y1="14" x2="39" y2="50" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="1" stopColor="#c4ecff" stopOpacity="0.82" />
        </linearGradient>
        <filter id={glow} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.6" />
        </filter>
      </defs>

      <rect x="3" y="3" width="58" height="58" rx="17" fill={`url(#${badge})`} />
      <rect x="3" y="3" width="58" height="58" rx="17" fill={`url(#${sheen})`} />

      {/* parallel rays entering from the left */}
      <g stroke="#ffffff" strokeOpacity="0.9" strokeWidth="2.2" strokeLinecap="round">
        <line x1="9" y1="20" x2="30" y2="20" />
        <line x1="9" y1="32" x2="30" y2="32" />
        <line x1="9" y1="44" x2="30" y2="44" />
      </g>
      {/* rays converging to the focus after the lens */}
      <g stroke="#ffe08a" strokeWidth="2.2" strokeLinecap="round">
        <line x1="30" y1="20" x2="49" y2="32" />
        <line x1="30" y1="32" x2="49" y2="32" />
        <line x1="30" y1="44" x2="49" y2="32" />
      </g>

      {/* biconvex lens */}
      <path
        d="M30 14 C 39 23 39 41 30 50 C 21 41 21 23 30 14 Z"
        fill={`url(#${lens})`}
        stroke="#eaf6ff"
        strokeOpacity="0.9"
        strokeWidth="1.5"
      />

      {/* focal point with a soft glow */}
      <circle cx="50" cy="32" r="5.5" fill="#ffd45e" opacity="0.8" filter={`url(#${glow})`} />
      <circle cx="50" cy="32" r="3" fill="#fff3cb" />
    </svg>
  )
}

/** Logo lockup: the mark beside the two-tone "LensLab" wordmark. */
export function Logo({ size = 30, className }: { size?: number; className?: string }) {
  return (
    <span className={`logo${className ? ` ${className}` : ''}`}>
      <LogoMark size={size} />
      <span className="logo__word">
        <span className="logo__word-a">Lens</span>
        <span className="logo__word-b">Lab</span>
      </span>
    </span>
  )
}
