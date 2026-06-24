import type { ReactNode } from 'react'

// Lightweight inline markup for lesson copy so explanations read more easily.
// Supported markers (content stays plain strings, easy to author/test):
//   **bold**        -> <strong class="rich-b">      (key terms)
//   __underline__   -> <u class="rich-u">           (key terms)
//   \frac{a}{b}     -> a stacked fraction           (LaTeX-like)
//   d_o, d_i, h_o   -> symbols with subscripts      (common optics variables)
// Anything else is rendered verbatim.
const TOKEN = /\\frac\{([^{}]*)\}\{([^{}]*)\}|\*\*([^*]+)\*\*|__([^_]+)__/g
const SUBSCRIPT_TOKEN = /\b([dh])_([io])\b/g

function renderSubscripts(text: string, keyPrefix: string): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  let key = 0
  let m: RegExpExecArray | null
  SUBSCRIPT_TOKEN.lastIndex = 0
  while ((m = SUBSCRIPT_TOKEN.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index))
    out.push(
      <span key={`${keyPrefix}-${key++}`} className="rich-var">
        {m[1]}
        <sub>{m[2]}</sub>
      </span>,
    )
    last = SUBSCRIPT_TOKEN.lastIndex
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}

export function renderRich(text: string): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  let key = 0
  let m: RegExpExecArray | null
  TOKEN.lastIndex = 0
  while ((m = TOKEN.exec(text)) !== null) {
    if (m.index > last) out.push(...renderSubscripts(text.slice(last, m.index), `t-${key++}`))
    if (m[1] !== undefined) {
      // \frac{a}{b} -> a stacked fraction (numerator over a rule over denominator).
      out.push(
        <span key={key++} className="frac frac--inline" role="math">
          <span className="frac__num">{renderSubscripts(m[1], `n-${key}`)}</span>
          <span className="frac__den">{renderSubscripts(m[2], `d-${key}`)}</span>
        </span>,
      )
    } else if (m[3] !== undefined) {
      out.push(
        <strong key={key++} className="rich-b">
          {renderSubscripts(m[3], `b-${key}`)}
        </strong>,
      )
    } else if (m[4] !== undefined) {
      out.push(
        <u key={key++} className="rich-u">
          {renderSubscripts(m[4], `u-${key}`)}
        </u>,
      )
    }
    last = TOKEN.lastIndex
  }
  if (last < text.length) out.push(...renderSubscripts(text.slice(last), `t-${key}`))
  return out
}
