// Shared contract for AI-generated simulations. Pure and unit-testable: no React
// or DOM imports so it can run in tests and be reused by the client wrapper.
//
// SANDBOX TOOLKIT (window.Lab) — see buildSandboxDoc below. Generated sims may use:
//   Lab.colors  { axis, ray, ray2, ray3, object, image, text, dim, bg,
//                 accent, flame, glass, grid }
//   Lab.clamp(v,a,b)            Lab.lerp(a,b,t)
//   Lab.thinLens(do,f) -> { di, m, real, inverted, atInfinity }
//   Lab.scene({...}) -> { width,height,unit,lensX,axis, x(ux), y(uy), pt, poly }
//   Lab.principalRays({...}) -> { di, m, hi, real, image, object, rays }
//   Lab.lensPath(sc,{height,bulge,concave}) -> SVG path "d" string
//   Lab.ticks(sc,f) -> [{ ux, x, label }] F/2F markers on both sides
//   Lab.arrowPoints(sc,x,h) -> polyline points string for an arrow object/image
//   Lab.chain([{x,f}], {x,h}) -> { steps, image:{x,h}, m } multi-lens tracing
//   Lab.defs() -> filter/gradient markup string (children of <defs>)
//
// SHARED <defs> (injected once into the sandbox body, reference by url(#id)):
//   #labGlow        soft glow (feGaussianBlur stdDeviation 3 + merge)
//   #labGlowStrong  stronger glow (stdDeviation 6, double-merged)
//   #labFlame       radial gradient white->yellow->orange->transparent (candle flame)
//   #labGlass       horizontal translucent blue gradient (lens glass body)

export interface SimulationSpec {
  id: string
  title: string
  description: string
  prompt: string
  /** Self-contained component source defining `function Simulation()` in React + TSX. */
  code: string
}

export interface SimulationValidationResult {
  ok: boolean
  errors: string[]
}

export const MAX_CODE_CHARS = 40_000

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
  body {
    background: radial-gradient(1200px 600px at 50% -8%, #16224a, #0b1020 62%);
    color: #e6edf7;
    font-family: Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
    overflow: hidden;
  }
  /* Force the generated component to fill the window so it never hugs one side. */
  #root {
    display: flex; flex-direction: column; animation: simfade .35s ease both;
    /* Subtle lift so even a minimal sim reads as a polished card, not "sad". */
    filter: drop-shadow(0 6px 24px rgba(3, 8, 24, .45));
  }
  #root > * { flex: 1 1 auto; width: 100%; min-width: 0; }
  @keyframes simfade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
  h1, h2, h3 { letter-spacing: .2px; }
  /* Labels stack their text over the control and share a consistent width so rows
     of sliders line up instead of each one sizing to its own text. */
  label { display: inline-flex; flex-direction: column; gap: 6px; font-size: 13px; font-weight: 700; color: #bcd0ff; line-height: 1.4; white-space: normal; overflow-wrap: anywhere; min-width: 190px; max-width: 300px; }
  /* Light, readable defaults for SVG text — only when a sim hasn't set its own
     fill/weight, so per-sim styling still wins. */
  svg text:not([fill]) { fill: #dce6f7; }
  svg text:not([font-weight]) { font-weight: 600; }
  /* Clean, smooth, native range sliders: accent-color gives a tidy filled-left
     track and thumb consistently across browsers (no odd full-width bright bar). */
  input[type="range"] {
    accent-color: #6cc5ff;
    width: 100%; min-width: 150px; height: 22px; margin: 0;
    cursor: pointer; touch-action: pan-y; vertical-align: middle;
  }
  button { font: inherit; min-height: 40px; touch-action: manipulation; }
  .sim-error { margin: auto; padding: 18px; max-width: 90%; color: #fecaca; font-size: 14px; line-height: 1.5; text-align: center; }
  /* Shown until the generated component mounts (covers React/Babel boot). */
  .sim-loading { margin: auto; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 12px; color: #9fb3d9; font-size: 14px; }
  .sim-loading__spin { width: 30px; height: 30px; border-radius: 50%; border: 3px solid rgba(108,197,255,.25); border-top-color: #6cc5ff; animation: simspin .8s linear infinite; }
  @keyframes simspin { to { transform: rotate(360deg); } }
  @media (prefers-reduced-motion: reduce) { #root { animation: none; } }
</style>
<script src="${REACT_URL}" crossorigin></script>
<script src="${REACT_DOM_URL}" crossorigin></script>
<script src="${BABEL_URL}" crossorigin></script>
</head>
<body>
<div id="root"><div class="sim-loading"><div class="sim-loading__spin"></div><div>Loading simulation…</div></div></div>
<script>
  (function () {
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
    // Linear interpolation; handy for animations and slider mapping.
    function lerp(a, b, t) { return a + (b - a) * t; }
    function thinLens(doDist, f) {
      var di = 1 / (1 / f - 1 / doDist);
      var real = isFinite(di) && di > 0;
      var m = -di / doDist;
      return { di: di, m: m, real: real, inverted: m < 0, atInfinity: !isFinite(di) };
    }
    // Convenience bundle the lessons use: image distance, magnification, whether
    // it is real/virtual, its orientation, and the lens type. Mirrors formImage.
    function formImage(doDist, f) {
      var t = thinLens(doDist, f);
      return {
        di: t.di, m: t.m, real: t.real,
        inverted: t.m < 0, upright: t.m > 0,
        type: f > 0 ? 'convex' : (f < 0 ? 'concave' : 'flat')
      };
    }
    function scene(opts) {
      opts = opts || {};
      var width = opts.width || 820, height = opts.height || 380, unit = opts.unit || 2.6;
      var lensX = opts.lensX == null ? width * 0.5 : opts.lensX;
      var axis = opts.axis == null ? height * 0.5 : opts.axis;
      return {
        width: width, height: height, unit: unit, lensX: lensX, axis: axis,
        x: function (ux) { return lensX + ux * unit; },
        y: function (uy) { return axis - uy * unit; },
        pt: function (ux, uy) { return (lensX + ux * unit) + ',' + (axis - uy * unit); },
        poly: function (pts) { return pts.map(function (p) { return (lensX + p[0] * unit) + ',' + (axis - p[1] * unit); }).join(' '); }
      };
    }
    function principalRays(o) {
      o = o || {};
      var doD = o.objectDistance, f = o.focalLength, ho = o.objectHeight || 18, fx = o.farX || 170;
      var di = 1 / (1 / f - 1 / doD), m = -di / doD, hi = m * ho;
      var real = isFinite(di) && di > 0, xo = -doD, xi = di, yi = hi;
      function at(px, py, qx, qy, X) { var t = (X - px) / (qx - px); return [X, py + (qy - py) * t]; }
      var rays = [];
      var p = { solid: [[xo, ho], [0, ho]] };
      p.solid.push(real ? [xi, yi] : at(0, ho, f, 0, fx));
      if (!real) p.dashed = [[0, ho], [xi, yi]];
      rays.push(p);
      var c = { solid: [[xo, ho], [0, 0]] };
      c.solid.push(real ? [xi, yi] : at(xo, ho, 0, 0, fx));
      if (!real) c.dashed = [[0, 0], [xi, yi]];
      rays.push(c);
      var yl = at(xo, ho, -f, 0, 0)[1];
      var fr = { solid: [[xo, ho], [0, yl]] };
      fr.solid.push(real ? [xi, yi] : [fx, yl]);
      if (!real) fr.dashed = [[0, yl], [xi, yi]];
      rays.push(fr);
      return { di: di, m: m, hi: hi, real: real, image: { x: xi, y: yi }, object: { x: xo, y: ho }, rays: rays };
    }
    // SVG path "d" string for a thin-lens outline centered on the optical axis.
    // opts: height (full height, optical units), bulge (curvature, units), concave.
    // Convex (biconvex vesica) by default; concave draws a slab with inward edges.
    function lensPath(sc, opts) {
      opts = opts || {};
      var h = opts.height || 70, bulge = opts.bulge || 10, concave = !!opts.concave;
      var cx = sc.x(0), topY = sc.y(h / 2), botY = sc.y(-h / 2), ay = sc.axis;
      var b = bulge * sc.unit;
      if (concave) {
        var L = cx - b, R = cx + b;
        return 'M' + L + ',' + topY +
          ' Q' + (L + b) + ',' + ay + ' ' + L + ',' + botY +
          ' L' + R + ',' + botY +
          ' Q' + (R - b) + ',' + ay + ' ' + R + ',' + topY + ' Z';
      }
      return 'M' + cx + ',' + topY +
        ' Q' + (cx + b) + ',' + ay + ' ' + cx + ',' + botY +
        ' Q' + (cx - b) + ',' + ay + ' ' + cx + ',' + topY + ' Z';
    }
    // F and 2F marker positions on both sides of the lens, for axis labeling.
    function ticks(sc, f) {
      var a = Math.abs(f);
      return [
        { ux: -2 * a, x: sc.x(-2 * a), label: '2F' },
        { ux: -a, x: sc.x(-a), label: 'F' },
        { ux: a, x: sc.x(a), label: "F'" },
        { ux: 2 * a, x: sc.x(2 * a), label: "2F'" }
      ];
    }
    // Polyline points string for an arrow at optical x with signed height h
    // (h > 0 points up). Shaft from axis to tip plus two arrowhead barbs.
    function arrowPoints(sc, x, h) {
      var bx = sc.x(x), base = sc.y(0), tip = sc.y(h);
      var dir = h >= 0 ? 1 : -1, off = dir * 8;
      return bx + ',' + base + ' ' + bx + ',' + tip + ' ' +
        (bx - 5) + ',' + (tip + off) + ' ' + bx + ',' + tip + ' ' + (bx + 5) + ',' + (tip + off);
    }
    // Trace an object {x,h} through ordered lenses [{x,f}]; each image becomes the
    // next object. Positions are in optical units. Returns per-lens steps, the
    // final image, and total magnification (product of step magnifications).
    function chain(lenses, object) {
      lenses = lenses || [];
      var ox = object.x, oh = object.h == null ? 1 : object.h, mTotal = 1, steps = [];
      for (var i = 0; i < lenses.length; i++) {
        var lx = lenses[i].x, f = lenses[i].f;
        var doD = lx - ox;            // object distance (positive if object is left of lens)
        var r = thinLens(doD, f);
        var imageX = lx + r.di, imageH = r.m * oh;
        mTotal = mTotal * r.m;
        steps.push({ x: lx, f: f, doDist: doD, di: r.di, m: r.m, real: r.real, imageX: imageX, imageH: imageH });
        ox = imageX; oh = imageH;     // image of this lens is the object for the next
      }
      return { steps: steps, image: { x: ox, h: oh }, m: mTotal };
    }
    // Reusable filter/gradient markup (children of <defs>). The same nodes are
    // injected once into the document below so url(#labGlow) etc. resolve for free.
    var DEFS =
      '<filter id="labGlow" x="-50%" y="-50%" width="200%" height="200%">' +
        '<feGaussianBlur stdDeviation="3" result="b" />' +
        '<feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>' +
      '</filter>' +
      '<filter id="labGlowStrong" x="-80%" y="-80%" width="260%" height="260%">' +
        '<feGaussianBlur stdDeviation="6" result="b" />' +
        '<feMerge><feMergeNode in="b" /><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>' +
      '</filter>' +
      '<radialGradient id="labFlame" cx="50%" cy="60%" r="60%">' +
        '<stop offset="0%" stop-color="#fff7d6" />' +
        '<stop offset="35%" stop-color="#ffd36b" />' +
        '<stop offset="70%" stop-color="#ff8a3d" />' +
        '<stop offset="100%" stop-color="#ff5a2c" stop-opacity="0" />' +
      '</radialGradient>' +
      '<linearGradient id="labGlass" x1="0" y1="0" x2="1" y2="0">' +
        '<stop offset="0%" stop-color="#bfe6ff" stop-opacity="0.10" />' +
        '<stop offset="50%" stop-color="#bfe6ff" stop-opacity="0.40" />' +
        '<stop offset="100%" stop-color="#bfe6ff" stop-opacity="0.10" />' +
      '</linearGradient>';
    window.Lab = {
      colors: { axis: '#33405e', ray: '#6cc5ff', ray2: '#ffb454', ray3: '#5ee6a8', object: '#ffce6b', image: '#5ee6a8', text: '#e6edf7', dim: '#9fb3d9', bg: '#0a1124', accent: '#c792ff', flame: '#ffd36b', glass: '#bfe6ff', grid: '#1b2747' },
      clamp: clamp,
      lerp: lerp,
      thinLens: thinLens,
      formImage: formImage,
      scene: scene,
      principalRays: principalRays,
      lensPath: lensPath,
      ticks: ticks,
      arrowPoints: arrowPoints,
      chain: chain,
      defs: function () { return DEFS; }
    };
    // Also expose the most common helpers as BARE globals so generated code can
    // call them unprefixed (e.g. lerp(), clamp(), thinLens()). These are window
    // properties, not lexical consts, so a simulation that declares its own
    // local lerp/clamp safely shadows them with no redeclaration error.
    window.lerp = lerp;
    window.clamp = clamp;
    window.map = function (v, a, b, c, d) { return c + (d - c) * ((v - a) / (b - a)); };
    window.deg = function (r) { return r * 180 / Math.PI; };
    window.rad = function (d) { return d * Math.PI / 180; };
    window.dist = function (ax, ay, bx, by) { return Math.hypot(bx - ax, by - ay); };
    window.rand = function (a, b) { return a + Math.random() * (b - a); };
    window.thinLens = thinLens;
    window.formImage = formImage;
    window.scene = scene;
    window.principalRays = principalRays;
    window.lensPath = lensPath;
    window.ticks = ticks;
    window.arrowPoints = arrowPoints;
    window.chain = chain;
    // Inject a hidden, zero-size <svg> holding the shared <defs> before #root so
    // any generated filter="url(#labGlow)" / fill="url(#labFlame)" resolves.
    (function () {
      var ns = 'http://www.w3.org/2000/svg';
      var svg = document.createElementNS(ns, 'svg');
      svg.setAttribute('width', '0');
      svg.setAttribute('height', '0');
      svg.setAttribute('aria-hidden', 'true');
      svg.style.position = 'absolute';
      svg.innerHTML = '<defs>' + DEFS + '</defs>';
      document.body.insertBefore(svg, document.body.firstChild);
    })();
    function showError(message) {
      var root = document.getElementById('root');
      if (root) root.innerHTML = '<div class="sim-error">Simulation error: ' + String(message || 'unknown') + '</div>';
    }
    window.__simShowError = showError;
    window.addEventListener('error', function (event) { showError(event.message); });
    window.addEventListener('unhandledrejection', function (event) {
      var reason = event.reason;
      showError((reason && reason.message) || reason);
    });
    // If nothing rendered after a beat (component returned null / collapsed),
    // surface a hint instead of leaving a confusing blank window.
    setTimeout(function () {
      var root = document.getElementById('root');
      if (root && root.children.length === 0 && !root.textContent.trim()) {
        showError('the simulation produced no visible output. Try regenerating or rephrasing your prompt.');
      }
    }, 1600);
  })();
</script>
<script id="sim-src" type="text/plain">${escapeForScript(spec.code)}</script>
<script>
  (function () {
    var R = window.React, RD = window.ReactDOM;
    // Error boundary so a render-time throw shows a message instead of a blank
    // window (production React unmounts the whole tree on an uncaught error).
    class Boundary extends R.Component {
      constructor(props) { super(props); this.state = { error: null }; }
      static getDerivedStateFromError(error) { return { error: error }; }
      render() {
        if (this.state.error) {
          var m = (this.state.error && this.state.error.message) || String(this.state.error);
          return R.createElement('div', { className: 'sim-error' }, 'Simulation error: ' + m);
        }
        return this.props.children;
      }
    }
    try {
      var src = document.getElementById('sim-src').textContent;
      // Transpile TypeScript + JSX -> JS HERE so a syntax error (typo, import,
      // bad type, etc.) is caught and shown clearly instead of failing silently.
      // preset-typescript only STRIPS types (no type-checking), so loose/imperfect
      // annotations still run. isTSX keeps JSX parsing on; use "as" not <T> casts.
      var out = Babel.transform(src, {
        presets: [['typescript', { isTSX: true, allExtensions: true }], 'react'],
        sourceType: 'unambiguous',
        filename: 'simulation.tsx'
      }).code;
      // Evaluate with React, the hooks, and the Lab toolkit in scope. Other bare
      // helpers (lerp, clamp, scene, ...) resolve via window globals.
      var factory = new Function(
        'React', 'ReactDOM', 'Lab',
        'useState', 'useEffect', 'useRef', 'useMemo', 'useCallback', 'useLayoutEffect', 'Fragment',
        out + '\\n;return typeof Simulation === "function" ? Simulation : null;'
      );
      var Simulation = factory(
        R, RD, window.Lab,
        R.useState, R.useEffect, R.useRef, R.useMemo, R.useCallback, R.useLayoutEffect, R.Fragment
      );
      if (typeof Simulation !== 'function') {
        window.__simShowError('the code did not define a Simulation component.');
        return;
      }
      RD.createRoot(document.getElementById('root')).render(
        R.createElement(Boundary, null, R.createElement(Simulation))
      );
    } catch (err) {
      window.__simShowError((err && err.message) || String(err));
    }
  })();
</script>
</body>
</html>`
}
