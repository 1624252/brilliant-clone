const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Capabilities the generated simulation may never use. The iframe sandbox + CSP
// are the real guardrails; this is server-side defense in depth.
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
]

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function parseJson(content: string) {
  try {
    return JSON.parse(content)
  } catch {
    const match = content.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Model returned non-JSON content.')
    return JSON.parse(match[0])
  }
}

function cleanText(value: unknown, label: string, max: number): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`${label} is missing.`)
  return value.trim().slice(0, max)
}

function validateResult(raw: Record<string, unknown>) {
  const spec = (raw.result && typeof raw.result === 'object' ? raw.result : raw) as Record<string, unknown>
  const title = cleanText(spec.title, 'title', 120)
  const description = cleanText(spec.description, 'description', 400)
  const code = cleanText(spec.code, 'code', 20000)
  if (!/function\s+Simulation\b/.test(code) && !/\bSimulation\s*=/.test(code)) {
    throw new Error('Generated code must define a Simulation component.')
  }
  const forbidden = forbiddenPatterns.filter(({ re }) => re.test(code)).map(({ label }) => label)
  if (forbidden.length) throw new Error(`Generated code uses forbidden capabilities: ${forbidden.join(', ')}.`)
  return { title, description, code }
}

const systemPrompt = [
  'You generate a single, complete, interactive React simulation. Return ONE JSON object only:',
  '{"title": string, "description": string, "code": string}.',
  '',
  'CODE CONTRACT (critical):',
  '- code must define `function Simulation() { ... }` returning JSX. No other top-level rendering.',
  '- No imports, no exports, no modules, no require. React and ReactDOM are provided as globals.',
  '- Hooks are available as bare names already in scope: useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect, Fragment. Use them directly.',
  '- The host mounts your component automatically; do NOT call ReactDOM yourself.',
  '- Plain JSX/JavaScript only (no TypeScript types).',
  '',
  'QUALITY:',
  '- Make it genuinely interactive, animated, and visually cool. Use range <input type="range"> sliders that actually update state, requestAnimationFrame for motion when helpful, and SVG or Canvas for visuals.',
  '- It must fit a fixed-size window and be mobile friendly and resizable: the root should fill 100% width/height, use a responsive flex/grid layout, and SVG should use viewBox so it scales. No fixed pixel widths that overflow.',
  '- Show clear labels and live readouts. Prefer fine slider steps (e.g. 0.1).',
  '',
  'SECURITY: never use fetch, XMLHttpRequest, WebSocket, EventSource, localStorage, sessionStorage, indexedDB, document.cookie, dynamic import(), window.parent/top, opener, navigator.sendBeacon, external URLs, or network/storage of any kind. Everything must be self-contained and computed locally.',
  '',
  'EXAMPLES of the kind of output expected (adapt to the user request):',
  '- "chromatic aberration simulation" -> a control with a slider to adjust the aberration intensity, and a preview window beside the diagram showing how an edge would look on a screen with red/blue fringing.',
  '- "image visualizer with a candle and a convex lens" -> a ray diagram with a candle whose distance is set by a slider, a convex lens, principal rays bending through it, a movable screen whose distance is set by a slider, and an image-preview window on the right showing the formed (possibly inverted) image.',
].join('\n')

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405)

  try {
    const { prompt } = await req.json()
    const cleanPrompt = cleanText(prompt, 'prompt', 500)
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) return json({ error: 'OPENAI_API_KEY is not configured.' }, 500)

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-4o',
        temperature: 0.4,
        max_tokens: 4000,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: cleanPrompt },
        ],
      }),
    })

    if (!response.ok) {
      let message = 'The AI service is temporarily unavailable.'
      try {
        const detail = await response.json()
        if (detail?.error?.type === 'insufficient_quota') {
          message = 'The AI service is unavailable: the OpenAI account has no remaining quota.'
        }
      } catch {
        // keep the generic message
      }
      return json({ error: message }, 502)
    }

    const body = await response.json()
    const content = body?.choices?.[0]?.message?.content
    if (typeof content !== 'string') return json({ error: 'AI returned no content.' }, 502)

    return json({ result: validateResult(parseJson(content)) })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Simulation generation failed.'
    return json({ error: message }, 400)
  }
})
