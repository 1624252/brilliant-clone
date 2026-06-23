import type { ReactNode } from 'react'

// Lightweight inline markup for lesson copy so explanations read more easily.
// Supported markers (content stays plain strings, easy to author/test):
//   **bold**        -> <strong class="rich-b">      (key terms)
//   __underline__   -> <u class="rich-u">           (key terms)
//   \frac{a}{b}     -> a stacked fraction           (LaTeX-like)
// Anything else is rendered verbatim.
const TOKEN = /\\frac\{([^{}]*)\}\{([^{}]*)\}|\*\*([^*]+)\*\*|__([^_]+)__/g

export function renderRich(text: string): ReactNode[] {
  const out: ReactNode[] = []
  let last = 0
  let key = 0
  let m: RegExpExecArray | null
  TOKEN.lastIndex = 0
  while ((m = TOKEN.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index))
    if (m[1] !== undefined) {
      // \frac{a}{b} -> a stacked fraction (numerator over a rule over denominator).
      out.push(
        <span key={key++} className="frac frac--inline" role="math">
          <span className="frac__num">{m[1]}</span>
          <span className="frac__den">{m[2]}</span>
        </span>,
      )
    } else if (m[3] !== undefined) {
      out.push(
        <strong key={key++} className="rich-b">
          {m[3]}
        </strong>,
      )
    } else if (m[4] !== undefined) {
      out.push(
        <u key={key++} className="rich-u">
          {m[4]}
        </u>,
      )
    }
    last = TOKEN.lastIndex
  }
  if (last < text.length) out.push(text.slice(last))
  return out
}
