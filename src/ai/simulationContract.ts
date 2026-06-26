// Shared contract for AI-generated simulations. Pure and unit-testable: no React
// or DOM imports so it can run in tests and be reused by the client wrapper.

export interface SimulationSpec {
  id: string
  title: string
  description: string
  prompt: string
  /** Self-contained component source defining `function Simulation()` using JSX. */
  code: string
}

export interface SimulationValidationResult {
  ok: boolean
  errors: string[]
}

export const MAX_CODE_CHARS = 20_000

// Capabilities the sandboxed simulation must never use. The iframe sandbox + CSP
// are the real guardrails; this scan is defense-in-depth and gives clear errors.
// We deliberately avoid blocking bare `.top`/`.parent` so legitimate layout math
// (e.g. getBoundingClientRect().top) is not rejected.
const forbiddenPatterns: Array<{ re: RegExp; label: string }> = [
  { re: /\bfetch\s*\(/, label: 'fetch' },
  { re: /\bXMLHttpRequest\b/, label: 'XMLHttpRequest' },
  { re: /\bWebSocket\b/, label: 'WebSocket' },
  { re: /\bEventSource\b/, label: 'EventSource' },
  { re: /\blocalStorage\b/, label: 'localStorage' },
  { re: /\bsessionStorage\b/, label: 'sessionStorage' },
  { re: /\bindexedDB\b/, label: 'indexedDB' },
  { re: /document\s*\.\s*cookie/, label: 'document.cookie' },
  { re: /\bimport\s*\(/, label: 'dynamic import()' },
  { re: /\b(?:window|self|globalThis)\s*\.\s*(?:parent|top)\b/, label: 'parent/top frame access' },
  { re: /\bopener\b/, label: 'window.opener' },
  { re: /navigator\s*\.\s*sendBeacon/, label: 'navigator.sendBeacon' },
  { re: /\beval\s*\(/, label: 'eval' },
  { re: /new\s+Function\b/, label: 'new Function' },
]

function requireText(value: unknown, label: string, max: number, errors: string[]) {
  if (typeof value !== 'string' || !value.trim()) {
    errors.push(`${label} is required.`)
    return
  }
  if (value.length > max) errors.push(`${label} is too long.`)
}

export function scanForbidden(code: string): string[] {
  return forbiddenPatterns.filter(({ re }) => re.test(code)).map(({ label }) => label)
}

export function validateSimulationSpec(spec: SimulationSpec): SimulationValidationResult {
  const errors: string[] = []
  requireText(spec.title, 'title', 120, errors)
  requireText(spec.description, 'description', 400, errors)
  requireText(spec.code, 'code', MAX_CODE_CHARS, errors)

  if (typeof spec.code === 'string' && spec.code.trim()) {
    if (!/function\s+Simulation\b/.test(spec.code) && !/\bSimulation\s*=/.test(spec.code)) {
      errors.push('code must define a Simulation component.')
    }
    const forbidden = scanForbidden(spec.code)
    if (forbidden.length) errors.push(`code uses forbidden capabilities: ${forbidden.join(', ')}.`)
  }

  return { ok: errors.length === 0, errors }
}

/** Turn a free-form title into a safe DOM id / iframe key fragment. */
export function slugId(value: string, fallback = 'ai-simulation'): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
  return /^[a-z][a-z0-9-]*$/.test(slug) ? slug : fallback
}

function escapeForScript(code: string): string {
  // Prevent the generated code from breaking out of the <script> block.
  return code.replace(/<\/script/gi, '<\\/script>').replace(/<!--/g, '<\\!--')
}

// Pinned CDN libraries loaded inside the sandbox only. React 18 UMD is used here
// (independent of the host app's React) plus Babel standalone for JSX.
const CDN = 'https://unpkg.com'
const REACT_URL = `${CDN}/react@18.3.1/umd/react.production.min.js`
const REACT_DOM_URL = `${CDN}/react-dom@18.3.1/umd/react-dom.production.min.js`
const BABEL_URL = `${CDN}/@babel/standalone@7.25.6/babel.min.js`

/**
 * Build the full iframe srcdoc that runs the generated React component. The
 * iframe is sandboxed (allow-scripts only, opaque origin) with a CSP that blocks
 * all network/exfiltration (connect-src 'none') while still allowing rich local
 * animation, input, SVG, and Canvas.
 */
export function buildSandboxDoc(spec: SimulationSpec): string {
  const csp = [
    "default-src 'none'",
    `script-src 'unsafe-inline' 'unsafe-eval' ${CDN}`,
    "style-src 'unsafe-inline'",
    "img-src data: blob:",
    "font-src data:",
    "connect-src 'none'",
    "form-action 'none'",
    "base-uri 'none'",
    "frame-src 'none'",
  ].join('; ')

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta http-equiv="Content-Security-Policy" content="${csp}" />
<style>
  :root { color-scheme: dark; }
  * { box-sizing: border-box; }
  html, body, #root { margin: 0; height: 100%; width: 100%; }
  body { background: #0b1020; color: #eef4ff; font-family: Inter, ui-sans-serif, system-ui, sans-serif; overflow: hidden; }
  #root { display: flex; }
  .sim-error { margin: auto; padding: 18px; max-width: 90%; color: #fecaca; font-size: 14px; line-height: 1.5; text-align: center; }
  input[type="range"] { width: 100%; accent-color: #8cc8ff; touch-action: pan-y; }
  button { font: inherit; }
</style>
<script src="${REACT_URL}" crossorigin></script>
<script src="${REACT_DOM_URL}" crossorigin></script>
<script src="${BABEL_URL}" crossorigin></script>
</head>
<body>
<div id="root"></div>
<script>
  window.addEventListener('error', function (event) {
    var root = document.getElementById('root');
    if (root) root.innerHTML = '<div class="sim-error">Simulation error: ' + String(event.message || 'unknown') + '</div>';
  });
</script>
<script type="text/babel" data-presets="react" data-type="module">
  const { useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect, Fragment } = React;
  ${escapeForScript(spec.code)}
  const __root = ReactDOM.createRoot(document.getElementById('root'));
  __root.render(<Simulation />);
</script>
</body>
</html>`
}
