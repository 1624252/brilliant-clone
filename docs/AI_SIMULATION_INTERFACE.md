# AI Simulation Studio Interface

The Simulation Studio lets a learner describe a simulation in plain language. A
server-side OpenAI proxy returns a single, self-contained interactive React
component, and the app runs it live inside a locked-down sandbox window that is
interactive, animated, and mobile/resizable friendly.

## Flow

1. The learner enters a prompt in `SimulationStudio` ([src/components/SimulationStudio.tsx](../src/components/SimulationStudio.tsx)).
2. `generateSimulation` ([src/ai/generateSimulation.ts](../src/ai/generateSimulation.ts)) POSTs the prompt to the Supabase Edge Function URL in `VITE_SUPABASE_GENERATE_SIMULATION_URL`.
3. The Edge Function ([supabase/functions/generate-simulation/index.ts](../supabase/functions/generate-simulation/index.ts)) runs two OpenAI calls: **(1)** expand the short topic into a detailed, structured **plan** with labeled sections — Title, Concept, Scene, Controls, Animation, Physics & accuracy, Result & readouts, Visual style, Layout (fast `gpt-4o-mini`), then **(2)** generate the runnable React simulation from that plan (`gpt-4o`, lean system prompt + prompt→code gold exemplars). It validates the result and returns `{ result: { title, description, code } }`. (If the plan is malformed it falls back to the raw topic for stage 2.)
4. The client re-validates with `validateSimulationSpec` and renders `SimulationSandbox` ([src/components/SimulationSandbox.tsx](../src/components/SimulationSandbox.tsx)).
5. The sandbox builds an iframe document with `buildSandboxDoc` and runs the component.
6. On any failure the Studio shows the error. There is no fallback simulation.

## "Surprise me" (idea mode)

The same Edge Function also serves a lightweight idea generator. The **Surprise me**
button in the Studio calls `suggestSimulationPrompt` ([src/ai/generateSimulation.ts](../src/ai/generateSimulation.ts)),
which POSTs `{ mode: 'idea', topic, avoid }` instead of a prompt. The function asks
OpenAI (higher temperature, ~220 tokens) for a single novel, optics-themed prompt and
returns `{ idea: string }`. The client sends the example chip labels plus recently
suggested ideas in `avoid` so suggestions stay fresh and don't repeat. The returned
idea is dropped into the prompt box for the learner to build (or tweak first).

## Result Contract

OpenAI returns one JSON object:

```json
{
  "title": "Chromatic Aberration",
  "description": "Adjust the dispersion intensity and see the fringing on a screen.",
  "code": "function Simulation() { /* JSX using hooks; no imports */ }"
}
```

### Code rules

- `code` must define `function Simulation() { ... }` returning JSX.
- No imports, exports, modules, or `require`. `React` and `ReactDOM` are globals.
- Hooks are pre-destructured and in scope: `useState`, `useEffect`, `useRef`,
  `useMemo`, `useCallback`, `useLayoutEffect`, `Fragment`.
- The host mounts the component; generated code must not call `ReactDOM` itself.
- Plain JSX/JavaScript only (no TypeScript types).
- Must fill 100% of the window, be responsive (flex/grid, SVG `viewBox`), and use
  real `<input type="range">` sliders, `requestAnimationFrame` for motion, and
  SVG/Canvas for visuals.

## Sandbox Runtime

`buildSandboxDoc` ([src/ai/simulationContract.ts](../src/ai/simulationContract.ts))
returns the iframe `srcdoc`. The iframe uses `sandbox="allow-scripts"` only, so it
has an opaque origin and cannot touch the app DOM, cookies, or storage. Its CSP is:

```
default-src 'none';
script-src 'unsafe-inline' 'unsafe-eval' https://unpkg.com;
style-src 'unsafe-inline';
img-src data: blob:;
font-src data:;
connect-src 'none';
form-action 'none';
base-uri 'none';
frame-src 'none';
```

`connect-src 'none'` blocks all network/exfiltration while still allowing rich
local animation and input. React 18 (UMD) and Babel standalone load from a pinned
CDN (`unpkg.com`); Babel transpiles the JSX at runtime. The window is a fixed,
responsive size (`width: min(100%, 960px)`, `height: clamp(420px, 72vh, 760px)`).

## Security Model

- The OpenAI key stays in Supabase secrets and is never exposed to the browser.
- Generated code runs only inside the opaque-origin, network-blocked iframe.
- Both the server and `validateSimulationSpec` scan generated code for forbidden
  capabilities: `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`,
  `localStorage`, `sessionStorage`, `indexedDB`, `document.cookie`, dynamic
  `import()`, `window.parent`/`window.top`, `opener`, and `navigator.sendBeacon`.
- Code size is capped (40k chars) and the component shape is required.
- On any validation or generation failure the Studio shows the error; it never
  substitutes a canned simulation.

## Example Prompts

- "chromatic aberration simulation" -> a simulation with a slider that adjusts the
  intensity of the aberration, plus a preview window beside it showing how an edge
  would look on a screen with color fringing.
- "image visualizer with a candle, convex lens" -> an image-visualizer window on
  the right showing the formed image, a screen whose distance is set by a slider, a
  candle whose distance is set by a slider, and rays showing how the light bends.

## Learning-Science Rationale

See PRD section 22 for how the Studio supports learning: active manipulation,
inquiry-driven exploration, dual coding across representations, hypothesis testing
through variable control, and a tight immediate-feedback loop.
