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
  { re: /\beval\s*\(/, label: 'eval' },
  { re: /new\s+Function\b/, label: 'new Function' },
]

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function parseJson(content: string): unknown {
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

// Models sometimes wrap the code value in a markdown fence; strip it so Babel
// does not choke on the ``` lines.
function stripFences(value: unknown): unknown {
  if (typeof value !== 'string') return value
  return value
    .trim()
    .replace(/^```[a-zA-Z]*\n?/, '')
    .replace(/\n?```$/, '')
}

function validateResult(parsed: unknown) {
  // Tolerate arrays and the {result:{...}} envelope the model occasionally adds.
  const unwrapped = Array.isArray(parsed) ? parsed[0] : parsed
  const raw = (unwrapped && typeof unwrapped === 'object' ? unwrapped : {}) as Record<string, unknown>
  const spec = (raw.result && typeof raw.result === 'object' ? raw.result : raw) as Record<string, unknown>
  const title = cleanText(spec.title, 'title', 120)
  const description = cleanText(spec.description, 'description', 400)
  // Accept common alternate keys for the code payload.
  const codeRaw = spec.code ?? spec.component ?? spec.jsx ?? spec.source
  const code = cleanText(stripFences(codeRaw), 'code', 40000)
  if (!/function\s+Simulation\b/.test(code) && !/\bSimulation\s*=/.test(code)) {
    throw new Error('Generated code must define a Simulation component.')
  }
  const forbidden = forbiddenPatterns.filter(({ re }) => re.test(code)).map(({ label }) => label)
  if (forbidden.length) throw new Error(`Generated code uses forbidden capabilities: ${forbidden.join(', ')}.`)
  return { title, description, code }
}

// A complete, correct, animated few-shot template the model imitates for physics,
// structure, animation, and polish. Written without backticks or ${} so it is
// safe inside this module. This encodes the thin-lens math the lessons use, so
// generated lens sims inherit correct geometry instead of reinventing it.
const exampleComponent = [
  'function Simulation() {',
  '  const [objU, setObjU] = useState(60)',
  '  const [fU, setFU] = useState(40)',
  '  const [screenU, setScreenU] = useState(80)',
  '  const [t, setT] = useState(0)',
  '  useEffect(() => {',
  '    let raf, last = performance.now()',
  '    const tick = (now) => { setT((p) => (p + (now - last) / 1400) % 1); last = now; raf = requestAnimationFrame(tick) }',
  '    raf = requestAnimationFrame(tick)',
  '    return () => cancelAnimationFrame(raf)',
  '  }, [])',
  '  const W = 900, H = 460, axis = 230, lensX = 380, s = 3.0, ho = 26',
  '  const di = 1 / (1 / fU - 1 / objU)',
  '  const real = isFinite(di) && di > 0',
  '  const m = -di / objU',
  '  const objX = lensX - objU * s, tipY = axis - ho * s',
  '  const imgX = lensX + di * s, imgTipY = axis - m * ho * s',
  '  const screenX = lensX + screenU * s',
  '  const focus = Math.max(0, 1 - Math.abs(screenX - imgX) / 60)',
  '  const lerp = (a, b, k) => a + (b - a) * k',
  '  const farX = W - 16',
  '  const imgValid = real && isFinite(di)',
  '  const parEndX = imgValid ? imgX : farX',
  '  const parEndY = imgValid ? imgTipY : tipY + (ho / fU) * (farX - lensX)',
  '  const chiefEndX = imgValid ? imgX : farX',
  '  const chiefEndY = imgValid ? imgTipY : tipY + (ho / objU) * (farX - objX)',
  '  const phx = lerp(objX, chiefEndX, t), phy = lerp(tipY, chiefEndY, t)',
  '  return (',
  '    <div style={{display:"flex",flexDirection:"column",height:"100%",gap:10,padding:16,color:"#e6edf7",fontFamily:"Inter, system-ui, sans-serif"}}>',
  '      <h2 style={{margin:0,textAlign:"center",fontWeight:800}}>Convex Lens Image Visualizer</h2>',
  '      <div style={{display:"flex",flex:1,minHeight:0,gap:12,flexWrap:"wrap",overflow:"hidden"}}>',
  '      <svg viewBox={"0 0 " + W + " " + H} style={{flex:"2 1 380px",minWidth:0}}>',
  '        <defs>',
  '          <filter id="blur"><feGaussianBlur stdDeviation={(1 - focus) * 6} /></filter>',
  '          <radialGradient id="flame"><stop offset="0%" stopColor="#fff3b0"/><stop offset="100%" stopColor="#ffb454"/></radialGradient>',
  '        </defs>',
  '        <line x1="0" y1={axis} x2={W} y2={axis} stroke="#33405e" strokeWidth="2"/>',
  '        <ellipse cx={lensX} cy={axis} rx="16" ry="120" fill="#6cc5ff33" stroke="#6cc5ff" strokeWidth="3"/>',
  '        {[fU, -fU, 2 * fU, -2 * fU].map((d, i) => (<g key={i}><circle cx={lensX + d * s} cy={axis} r="4" fill="#9fb3d9"/><text x={lensX + d * s} y={axis + 22} fill="#9fb3d9" fontSize="13" textAnchor="middle">{Math.abs(d) === fU ? "F" : "2F"}</text></g>))}',
  '        <line x1={objX} y1={axis} x2={objX} y2={tipY} stroke="#ffb454" strokeWidth="5"/>',
  '        <circle cx={objX} cy={tipY} r="9" fill="url(#flame)"/>',
  '        <path d={"M " + objX + " " + tipY + " L " + lensX + " " + tipY + " L " + parEndX + " " + parEndY} fill="none" stroke="#6cc5ff" strokeWidth="2.5"/>',
  '        <path d={"M " + objX + " " + tipY + " L " + chiefEndX + " " + chiefEndY} fill="none" stroke="#ff77c8" strokeWidth="2.5"/>',
  '        {!imgValid && isFinite(imgX) && (<g stroke="#6cc5ff" strokeWidth="1.6" strokeDasharray="6 6" opacity="0.7"><line x1={lensX} y1={tipY} x2={imgX} y2={imgTipY}/><line x1={lensX} y1={axis} x2={imgX} y2={imgTipY}/></g>)}',
  '        {isFinite(imgX) && (<g><line x1={imgX} y1={axis} x2={imgX} y2={imgTipY} stroke={imgValid ? "#5ee6a8" : "#c792ff"} strokeWidth="5"/><circle cx={imgX} cy={imgTipY} r="8" fill={imgValid ? "#5ee6a8" : "#c792ff"}/></g>)}',
  '        <line x1={screenX} y1={axis - 130} x2={screenX} y2={axis + 130} stroke="#e6edf7" strokeWidth="4"/>',
  '        {imgValid && (<g filter="url(#blur)" opacity={0.25 + focus * 0.75}><line x1={screenX} y1={axis} x2={screenX} y2={imgTipY} stroke="#5ee6a8" strokeWidth="6"/></g>)}',
  '        <circle cx={phx} cy={phy} r="5" fill="#fff3b0"/>',
  '      </svg>',
  '      <div style={{flex:"1 1 220px",minWidth:200,display:"flex",flexDirection:"column",gap:8,border:"1px solid #2a3550",borderRadius:14,padding:12,background:"#0d1430"}}>',
  '        <div style={{textAlign:"center",fontWeight:700,color:"#bcd0ff"}}>On the screen</div>',
  '        <svg viewBox="0 0 200 260" style={{flex:1,width:"100%"}}>',
  '          <defs><filter id="b2"><feGaussianBlur stdDeviation={(1 - focus) * 5} /></filter></defs>',
  '          <rect x="6" y="6" width="188" height="248" rx="12" fill="#060a18" stroke="#2a3550"/>',
  '          {real && (<g filter="url(#b2)" opacity={0.2 + focus * 0.8} transform={"translate(100 130) scale(" + Math.max(0.3, Math.min(2, Math.abs(m))) + " " + (-Math.max(0.3, Math.min(2, Math.abs(m)))) + ")"}><rect x="-7" y="-46" width="14" height="80" rx="4" fill="#ffce6b"/><ellipse cx="0" cy="-46" rx="9" ry="14" fill="#ff9a3c"/></g>)}',
  '          {!real && (<text x="100" y="130" fill="#9fb3d9" fontSize="13" textAnchor="middle">virtual image</text>)}',
  '        </svg>',
  '        <div style={{textAlign:"center",fontSize:13,color:focus > 0.85 ? "#5ee6a8" : "#9fb3d9"}}>{focus > 0.85 ? "In focus" : "Move the screen to focus"}</div>',
  '      </div>',
  '      </div>',
  '      <div style={{display:"flex",gap:18,flexWrap:"wrap",justifyContent:"center",fontSize:14,flexShrink:0}}>',
  '        <span style={{color:"#9fb3d9"}}>Image dist: {imgValid ? di.toFixed(1) : "virtual"}</span>',
  '        <span style={{color:"#9fb3d9"}}>Magnification: {m.toFixed(2)}</span>',
  '        <span style={{color:"#9fb3d9"}}>1/f = 1/do + 1/di</span>',
  '        <span style={{color:"#9fb3d9"}}>Focus: {Math.round(focus * 100)}%</span>',
  '      </div>',
  '      <div style={{display:"flex",gap:18,flexWrap:"wrap",justifyContent:"center",flexShrink:0}}>',
  '        <label style={{color:"#bcd0ff"}}>Object distance: {objU.toFixed(0)}<input type="range" min="20" max="120" step="1" value={objU} onChange={(e)=>setObjU(+e.target.value)}/></label>',
  '        <label style={{color:"#bcd0ff"}}>Focal length: {fU.toFixed(0)}<input type="range" min="15" max="70" step="1" value={fU} onChange={(e)=>setFU(+e.target.value)}/></label>',
  '        <label style={{color:"#bcd0ff"}}>Screen distance: {screenU.toFixed(0)}<input type="range" min="20" max="160" step="1" value={screenU} onChange={(e)=>setScreenU(+e.target.value)}/></label>',
  '      </div>',
  '    </div>',
  '  )',
  '}',
].join('\n')

// Lesson 2 — Concave Lenses: a diverging (negative-f) lens. The image is ALWAYS
// virtual, upright, and reduced, on the same side as the object. Uses the toolkit
// for correct diverging rays plus dashed back-traces to the virtual image.
const exampleConcave = [
  'function Simulation() {',
  '  const [obj, setObj] = useState(46)',
  '  const [fmag, setFmag] = useState(30)',
  '  const [t, setT] = useState(0)',
  '  useEffect(() => {',
  '    let raf, last = performance.now()',
  '    const tick = (now) => { setT((p) => (p + (now - last) / 1700) % 1); last = now; raf = requestAnimationFrame(tick) }',
  '    raf = requestAnimationFrame(tick)',
  '    return () => cancelAnimationFrame(raf)',
  '  }, [])',
  '  const f = -fmag, ho = 22',
  '  const sc = scene({ width: 900, height: 480, unit: 3.2, lensX: 560, axis: 240 })',
  '  const r = principalRays({ objectDistance: obj, focalLength: f, objectHeight: ho, farX: 110 })',
  '  const info = formImage(obj, f)',
  '  const cand = (ux, h, fill, op) => { const bx = sc.x(ux), by = sc.y(0), top = sc.y(h), w = 9; return (<g opacity={op}><rect x={bx - w / 2} y={Math.min(by, top)} width={w} height={Math.abs(by - top)} rx="3" fill={fill}/><circle cx={bx} cy={top} r="7" fill="url(#labFlame)" filter="url(#labGlow)"/></g>); }',
  '  const chief = r.rays[1].solid, a = chief[0], b = chief[chief.length - 1]',
  '  const ph = [sc.x(lerp(a[0], b[0], t)), sc.y(lerp(a[1], b[1], t))]',
  '  return (',
  '    <div style={{display:"flex",flexDirection:"column",height:"100%",gap:8,padding:14,color:"#e6edf7",fontFamily:"Inter, system-ui, sans-serif"}}>',
  '      <h2 style={{margin:0,textAlign:"center",fontWeight:800,fontSize:"clamp(16px,2.4vw,22px)"}}>Concave Lens: the image is always virtual</h2>',
  '      <svg viewBox={"0 0 " + sc.width + " " + sc.height} preserveAspectRatio="xMidYMid meet" style={{flex:1,minHeight:0,width:"100%"}}>',
  '        <line x1="0" y1={sc.axis} x2={sc.width} y2={sc.axis} stroke="#33405e" strokeWidth="2"/>',
  '        {ticks(sc, f).map((tk, i) => (<g key={i}><circle cx={tk.x} cy={sc.axis} r="3" fill="#9fb3d9"/><text x={tk.x} y={sc.axis + 20} fill="#9fb3d9" fontSize="12" textAnchor="middle">{tk.label}</text></g>))}',
  '        <path d={lensPath(sc, { height: 62, bulge: 16, concave: true })} fill="url(#labGlass)" stroke="#6cc5ff" strokeWidth="3" filter="url(#labGlow)"/>',
  '        {r.rays.map((ry, i) => ry.dashed ? (<polyline key={"d" + i} points={sc.poly(ry.dashed)} fill="none" stroke="#9fb3d9" strokeWidth="1.6" strokeDasharray="6 6" opacity="0.65"/>) : null)}',
  '        {r.rays.map((ry, i) => (<polyline key={i} points={sc.poly(ry.solid)} fill="none" stroke={["#6cc5ff","#ffb454","#5ee6a8"][i]} strokeWidth="2.4"/>))}',
  '        {cand(r.image.x, r.image.y, "#c792ff", 0.6)}',
  '        <text x={sc.x(r.image.x)} y={sc.y(r.image.y) - 14} fill="#c792ff" fontSize="13" textAnchor="middle">virtual image</text>',
  '        {cand(-obj, ho, "#ffce6b", 1)}',
  '        <text x={sc.x(-obj)} y={sc.y(ho) - 14} fill="#ffce6b" fontSize="12" textAnchor="middle">candle</text>',
  '        <circle cx={ph[0]} cy={ph[1]} r="5" fill="#fff7d6"/>',
  '      </svg>',
  '      <div style={{display:"flex",gap:18,flexWrap:"wrap",justifyContent:"center",fontSize:14,flexShrink:0}}>',
  '        <span style={{color:"#9fb3d9"}}>Image distance: {info.di.toFixed(1)} (negative = same side)</span>',
  '        <span style={{color:"#9fb3d9"}}>Magnification: {info.m.toFixed(2)}</span>',
  '        <span style={{color:"#5ee6a8"}}>virtual | upright | reduced</span>',
  '      </div>',
  '      <div style={{display:"flex",gap:18,flexWrap:"wrap",justifyContent:"center",flexShrink:0}}>',
  '        <label style={{color:"#bcd0ff"}}>Object distance: {obj.toFixed(0)}<input type="range" min="12" max="80" step="1" value={obj} onChange={(e)=>setObj(+e.target.value)}/></label>',
  '        <label style={{color:"#bcd0ff"}}>Lens strength: {fmag.toFixed(0)}<input type="range" min="16" max="50" step="1" value={fmag} onChange={(e)=>setFmag(+e.target.value)}/></label>',
  '      </div>',
  '    </div>',
  '  )',
  '}',
].join('\n')

// Curvature exemplar: morphing lens with collimated rays, using the Lab toolkit.
const exampleCurvature = [
  'function Simulation() {',
  '  const [c, setC] = useState(0.5)',
  '  const flat = Math.abs(c) < 0.05',
  '  const f = flat ? Infinity : 60 / c',
  '  const sc = Lab.scene({ width: 820, height: 380, unit: 2.4 })',
  '  const hs = [-42, -28, -14, 14, 28, 42]',
  '  const b = Lab.clamp(Math.abs(c) * 11, 2, 11)',
  '  const lensD = c >= 0',
  '    ? "M " + sc.pt(0, 46) + " Q " + sc.pt(b, 0) + " " + sc.pt(0, -46) + " Q " + sc.pt(-b, 0) + " " + sc.pt(0, 46) + " Z"',
  '    : "M " + sc.pt(-b, 46) + " Q " + sc.pt(b, 0) + " " + sc.pt(-b, -46) + " L " + sc.pt(b, -46) + " Q " + sc.pt(-b, 0) + " " + sc.pt(b, 46) + " Z"',
  '  const ray = (h) => {',
  '    if (flat) return sc.poly([[-90, h], [90, h]])',
  '    if (f > 0) return sc.poly([[-90, h], [0, h], [Lab.clamp(f, 4, 90), 0]])',
  '    return sc.poly([[-90, h], [0, h], [90, h + (h / (-f)) * 90]])',
  '  }',
  '  const back = (h) => (!flat && f < 0) ? sc.poly([[0, h], [f, 0]]) : null',
  '  return (',
  '    <div style={{display:"flex",flexDirection:"column",height:"100%",gap:10,padding:16,color:"#e6edf7",fontFamily:"Inter, system-ui, sans-serif"}}>',
  '      <h2 style={{margin:0,textAlign:"center",fontWeight:800}}>Convex and Concave Lenses</h2>',
  '      <svg viewBox={"0 0 " + sc.width + " " + sc.height} style={{flex:1,minHeight:0,width:"100%"}}>',
  '        <line x1="0" y1={sc.axis} x2={sc.width} y2={sc.axis} stroke={Lab.colors.axis} strokeWidth="2"/>',
  '        <path d={lensD} fill="#6cc5ff22" stroke="#6cc5ff" strokeWidth="3"/>',
  '        {hs.map((h, i) => (<polyline key={i} points={ray(h)} fill="none" stroke={Lab.colors.ray} strokeWidth="2.5"/>))}',
  '        {hs.map((h, i) => { const d = back(h); return d ? (<polyline key={"b" + i} points={d} fill="none" stroke={Lab.colors.ray} strokeWidth="1.5" strokeDasharray="6 6" opacity="0.7"/>) : null })}',
  '        {!flat && (<circle cx={sc.x(Lab.clamp(f, -90, 90))} cy={sc.axis} r="5" fill={Lab.colors.ray3}/>)}',
  '      </svg>',
  '      <div style={{display:"flex",gap:16,flexWrap:"wrap",justifyContent:"center",alignItems:"center"}}>',
  '        <span style={{color:"#9fb3d9",fontSize:14}}>{flat ? "Flat: no focusing" : (f > 0 ? "Convex (converging)" : "Concave (diverging)")} · f = {flat ? "infinity" : f.toFixed(0)}</span>',
  '        <label style={{color:"#bcd0ff"}}>Curvature: {c.toFixed(2)}<input type="range" min="-1" max="1" step="0.01" value={c} onChange={(e)=>setC(+e.target.value)}/></label>',
  '      </div>',
  '    </div>',
  '  )',
  '}',
].join('\n')

// Lesson 4 — Ray Tracing: locate the image of a convex lens with the three
// principal rays (parallel->F, chief->center, focal->parallel), labeled in a
// legend, with real vs virtual handled via the toolkit's dashed back-traces.
const exampleRayTrace = [
  'function Simulation() {',
  '  const [obj, setObj] = useState(54)',
  '  const [f, setF] = useState(24)',
  '  const [t, setT] = useState(0)',
  '  useEffect(() => {',
  '    let raf, last = performance.now()',
  '    const tick = (now) => { setT((p) => (p + (now - last) / 1600) % 1); last = now; raf = requestAnimationFrame(tick) }',
  '    raf = requestAnimationFrame(tick)',
  '    return () => cancelAnimationFrame(raf)',
  '  }, [])',
  '  const ho = 24',
  '  const sc = scene({ width: 920, height: 480, unit: 2.9, lensX: 430, axis: 240 })',
  '  const r = principalRays({ objectDistance: obj, focalLength: f, objectHeight: ho, farX: 150 })',
  '  const info = formImage(obj, f)',
  '  const cols = ["#6cc5ff", "#ffb454", "#5ee6a8"]',
  '  const names = ["parallel -> through F", "chief -> through center", "focal -> leaves parallel"]',
  '  const cand = (ux, h, fill, op) => { const bx = sc.x(ux), by = sc.y(0), top = sc.y(h), w = 9; return (<g opacity={op}><rect x={bx - w / 2} y={Math.min(by, top)} width={w} height={Math.abs(by - top)} rx="3" fill={fill}/><circle cx={bx} cy={top} r="7" fill="url(#labFlame)" filter="url(#labGlow)"/></g>); }',
  '  const m0 = r.rays[0].solid, a = m0[0], b = m0[m0.length - 1]',
  '  const ph = [sc.x(lerp(a[0], b[0], t)), sc.y(lerp(a[1], b[1], t))]',
  '  return (',
  '    <div style={{display:"flex",flexDirection:"column",height:"100%",gap:8,padding:14,color:"#e6edf7",fontFamily:"Inter, system-ui, sans-serif"}}>',
  '      <h2 style={{margin:0,textAlign:"center",fontWeight:800,fontSize:"clamp(16px,2.4vw,22px)"}}>Ray Tracing: three rays find the image</h2>',
  '      <svg viewBox={"0 0 " + sc.width + " " + sc.height} preserveAspectRatio="xMidYMid meet" style={{flex:1,minHeight:0,width:"100%"}}>',
  '        <line x1="0" y1={sc.axis} x2={sc.width} y2={sc.axis} stroke="#33405e" strokeWidth="2"/>',
  '        {ticks(sc, f).map((tk, i) => (<g key={i}><circle cx={tk.x} cy={sc.axis} r="3" fill="#9fb3d9"/><text x={tk.x} y={sc.axis + 20} fill="#9fb3d9" fontSize="12" textAnchor="middle">{tk.label}</text></g>))}',
  '        <ellipse cx={sc.x(0)} cy={sc.axis} rx="13" ry="118" fill="url(#labGlass)" stroke="#6cc5ff" strokeWidth="3" filter="url(#labGlow)"/>',
  '        {r.rays.map((ry, i) => ry.dashed ? (<polyline key={"d" + i} points={sc.poly(ry.dashed)} fill="none" stroke={cols[i]} strokeWidth="1.5" strokeDasharray="6 6" opacity="0.6"/>) : null)}',
  '        {r.rays.map((ry, i) => (<polyline key={i} points={sc.poly(ry.solid)} fill="none" stroke={cols[i]} strokeWidth="2.6"/>))}',
  '        {cand(-obj, ho, "#ffce6b", 1)}',
  '        {isFinite(r.image.x) && (<g><line x1={sc.x(r.image.x)} y1={sc.axis} x2={sc.x(r.image.x)} y2={sc.y(r.image.y)} stroke={r.real ? "#5ee6a8" : "#c792ff"} strokeWidth="5"/><circle cx={sc.x(r.image.x)} cy={sc.y(r.image.y)} r="7" fill={r.real ? "#5ee6a8" : "#c792ff"}/></g>)}',
  '        {isFinite(r.image.x) && (<text x={sc.x(r.image.x)} y={sc.y(r.image.y) + (r.image.y >= 0 ? -14 : 22)} fill={r.real ? "#5ee6a8" : "#c792ff"} fontSize="12" textAnchor="middle">{r.real ? "real image" : "virtual image"}</text>)}',
  '        {names.map((nm, i) => (<g key={"l" + i}><rect x="16" y={14 + i * 20} width="16" height="4" rx="2" fill={cols[i]}/><text x="40" y={20 + i * 20} fill="#cdd9f2" fontSize="12">{nm}</text></g>))}',
  '        <circle cx={ph[0]} cy={ph[1]} r="5" fill="#fff7d6"/>',
  '      </svg>',
  '      <div style={{display:"flex",gap:18,flexWrap:"wrap",justifyContent:"center",fontSize:14,flexShrink:0}}>',
  '        <span style={{color:"#9fb3d9"}}>Image distance: {r.real ? r.di.toFixed(1) : "virtual"}</span>',
  '        <span style={{color:"#9fb3d9"}}>Magnification: {info.m.toFixed(2)}</span>',
  '        <span style={{color:"#9fb3d9"}}>{info.inverted ? "inverted" : "upright"} | {r.real ? "real" : "virtual"}</span>',
  '      </div>',
  '      <div style={{display:"flex",gap:18,flexWrap:"wrap",justifyContent:"center",flexShrink:0}}>',
  '        <label style={{color:"#bcd0ff"}}>Object distance: {obj.toFixed(0)}<input type="range" min="10" max="90" step="1" value={obj} onChange={(e)=>setObj(+e.target.value)}/></label>',
  '        <label style={{color:"#bcd0ff"}}>Focal length: {f.toFixed(0)}<input type="range" min="14" max="40" step="1" value={f} onChange={(e)=>setF(+e.target.value)}/></label>',
  '      </div>',
  '    </div>',
  '  )',
  '}',
].join('\n')

// Lesson 5 — The Thin Lens Equation: sliders for object distance and focal length
// with a live 1/f = 1/do + 1/di panel and m = -di/do, plus the regime label
// (magnifier / projector / reduced). Ray diagram via the toolkit.
const exampleThinLens = [
  'function Simulation() {',
  '  const [obj, setObj] = useState(50)',
  '  const [f, setF] = useState(20)',
  '  const [t, setT] = useState(0)',
  '  useEffect(() => {',
  '    let raf, last = performance.now()',
  '    const tick = (now) => { setT((p) => (p + (now - last) / 1600) % 1); last = now; raf = requestAnimationFrame(tick) }',
  '    raf = requestAnimationFrame(tick)',
  '    return () => cancelAnimationFrame(raf)',
  '  }, [])',
  '  const ho = 22',
  '  const sc = scene({ width: 920, height: 470, unit: 2.8, lensX: 430, axis: 235 })',
  '  const r = principalRays({ objectDistance: obj, focalLength: f, objectHeight: ho, farX: 150 })',
  '  const info = formImage(obj, f)',
  '  const regime = obj < f ? "magnifier: virtual, upright" : (obj < 2 * f ? "projector: real, enlarged" : "real, reduced")',
  '  const cand = (ux, h, fill, op) => { const bx = sc.x(ux), by = sc.y(0), top = sc.y(h), w = 9; return (<g opacity={op}><rect x={bx - w / 2} y={Math.min(by, top)} width={w} height={Math.abs(by - top)} rx="3" fill={fill}/><circle cx={bx} cy={top} r="7" fill="url(#labFlame)" filter="url(#labGlow)"/></g>); }',
  '  const chief = r.rays[1].solid, a = chief[0], b = chief[chief.length - 1]',
  '  const ph = [sc.x(lerp(a[0], b[0], t)), sc.y(lerp(a[1], b[1], t))]',
  '  return (',
  '    <div style={{display:"flex",flexDirection:"column",height:"100%",gap:8,padding:14,color:"#e6edf7",fontFamily:"Inter, system-ui, sans-serif"}}>',
  '      <h2 style={{margin:0,textAlign:"center",fontWeight:800,fontSize:"clamp(16px,2.4vw,22px)"}}>The Thin Lens Equation</h2>',
  '      <svg viewBox={"0 0 " + sc.width + " " + sc.height} preserveAspectRatio="xMidYMid meet" style={{flex:1,minHeight:0,width:"100%"}}>',
  '        <line x1="0" y1={sc.axis} x2={sc.width} y2={sc.axis} stroke="#33405e" strokeWidth="2"/>',
  '        {ticks(sc, f).map((tk, i) => (<g key={i}><circle cx={tk.x} cy={sc.axis} r="3" fill="#9fb3d9"/><text x={tk.x} y={sc.axis + 20} fill="#9fb3d9" fontSize="12" textAnchor="middle">{tk.label}</text></g>))}',
  '        <ellipse cx={sc.x(0)} cy={sc.axis} rx="13" ry="116" fill="url(#labGlass)" stroke="#6cc5ff" strokeWidth="3" filter="url(#labGlow)"/>',
  '        {r.rays.map((ry, i) => ry.dashed ? (<polyline key={"d" + i} points={sc.poly(ry.dashed)} fill="none" stroke="#9fb3d9" strokeWidth="1.5" strokeDasharray="6 6" opacity="0.6"/>) : null)}',
  '        {r.rays.map((ry, i) => (<polyline key={i} points={sc.poly(ry.solid)} fill="none" stroke={["#6cc5ff","#ffb454","#5ee6a8"][i]} strokeWidth="2.4"/>))}',
  '        {cand(-obj, ho, "#ffce6b", 1)}',
  '        {isFinite(r.image.x) && (<g><line x1={sc.x(r.image.x)} y1={sc.axis} x2={sc.x(r.image.x)} y2={sc.y(r.image.y)} stroke={r.real ? "#5ee6a8" : "#c792ff"} strokeWidth="5"/><circle cx={sc.x(r.image.x)} cy={sc.y(r.image.y)} r="7" fill={r.real ? "#5ee6a8" : "#c792ff"}/></g>)}',
  '        <g><rect x="14" y="12" width="240" height="80" rx="10" fill="#0d1430" stroke="#2a3550"/><text x="26" y="38" fill="#bcd0ff" fontSize="15" fontWeight="700">1/f = 1/do + 1/di</text><text x="26" y="60" fill="#9fb3d9" fontSize="13">f={f.toFixed(0)}  do={obj.toFixed(0)}  di={r.real ? r.di.toFixed(1) : "virtual"}</text><text x="26" y="80" fill="#9fb3d9" fontSize="13">m = -di/do = {info.m.toFixed(2)}</text></g>',
  '        <circle cx={ph[0]} cy={ph[1]} r="5" fill="#fff7d6"/>',
  '      </svg>',
  '      <div style={{display:"flex",gap:18,flexWrap:"wrap",justifyContent:"center",fontSize:14,flexShrink:0}}>',
  '        <span style={{color:"#5ee6a8"}}>{regime}</span>',
  '        <span style={{color:"#9fb3d9"}}>magnification {info.m.toFixed(2)}</span>',
  '      </div>',
  '      <div style={{display:"flex",gap:18,flexWrap:"wrap",justifyContent:"center",flexShrink:0}}>',
  '        <label style={{color:"#bcd0ff"}}>Object distance: {obj.toFixed(0)}<input type="range" min="8" max="90" step="1" value={obj} onChange={(e)=>setObj(+e.target.value)}/></label>',
  '        <label style={{color:"#bcd0ff"}}>Focal length: {f.toFixed(0)}<input type="range" min="12" max="38" step="1" value={f} onChange={(e)=>setF(+e.target.value)}/></label>',
  '      </div>',
  '    </div>',
  '  )',
  '}',
].join('\n')

// Appearance-effect exemplar (chromatic aberration). Shows how to render a BRIGHT,
// window-filling color effect: three colored ray bundles splitting to three foci
// (red farthest, blue nearest) plus a high-contrast RGB fringing preview.
const exampleChromatic = [
  'function Simulation() {',
  '  const [disp, setDisp] = useState(12)',
  '  const [fG, setFG] = useState(78)',
  '  const [t, setT] = useState(0)',
  '  useEffect(() => {',
  '    let raf, last = performance.now()',
  '    const tick = (now) => { setT((p) => (p + (now - last) / 2000) % 1); last = now; raf = requestAnimationFrame(tick) }',
  '    raf = requestAnimationFrame(tick)',
  '    return () => cancelAnimationFrame(raf)',
  '  }, [])',
  '  const W = 560, H = 360, axis = 180, lensX = 150, S = 3.0',
  '  const fR = fG + disp, fB = fG - disp',
  '  const heights = [-46, -23, 23, 46]',
  '  const foci = [["#ff5a5a", fR, "R"], ["#5ee66a", fG, "G"], ["#5a8cff", fB, "B"]]',
  '  const k = disp * 1.4',
  '  const layer = (dx, color) => (<g transform={"translate(" + dx + " 0)"} style={{mixBlendMode:"screen"}} fill={color}><circle cx="120" cy="92" r="56"/><rect x="36" y="168" width="248" height="28" rx="9"/><rect x="36" y="214" width="180" height="28" rx="9"/></g>)',
  '  return (',
  '    <div style={{display:"flex",flexDirection:"column",height:"100%",gap:8,padding:14,color:"#e6edf7",fontFamily:"Inter, system-ui, sans-serif"}}>',
  '      <h2 style={{margin:0,textAlign:"center",fontWeight:800,fontSize:"clamp(16px,2.4vw,22px)"}}>Chromatic Aberration</h2>',
  '      <div style={{display:"flex",flex:1,minHeight:0,gap:12,flexWrap:"wrap",overflow:"hidden"}}>',
  '        <svg viewBox={"0 0 " + W + " " + H} preserveAspectRatio="xMidYMid meet" style={{flex:"1 1 320px",minWidth:0}}>',
  '          <line x1="0" y1={axis} x2={W} y2={axis} stroke="#33405e" strokeWidth="2"/>',
  '          {heights.map((h, i) => (<line key={"w" + i} x1="6" y1={axis - h * S} x2={lensX} y2={axis - h * S} stroke="#e6edf7" strokeWidth="2"/>))}',
  '          {foci.flatMap(([c, f]) => heights.map((h, i) => (<line key={c + i} x1={lensX} y1={axis - h * S} x2={lensX + f * S} y2={axis} stroke={c} strokeWidth="2"/>)))}',
  '          <ellipse cx={lensX} cy={axis} rx="14" ry="150" fill="url(#labGlass)" stroke="#6cc5ff" strokeWidth="3" filter="url(#labGlow)"/>',
  '          {foci.map(([c, f, lab]) => (<g key={"f" + lab}><circle cx={lensX + f * S} cy={axis} r="5" fill={c}/><text x={lensX + f * S} y={axis + 22} fill={c} fontSize="13" textAnchor="middle" fontWeight="700">{lab}</text></g>))}',
  '          <text x={W / 2} y={H - 8} fill="#9fb3d9" fontSize="13" textAnchor="middle">red focuses farthest, blue nearest</text>',
  '        </svg>',
  '        <div style={{flex:"1 1 240px",minWidth:200,display:"flex",flexDirection:"column",gap:8,border:"1px solid #2a3550",borderRadius:14,padding:12,background:"#0a1124"}}>',
  '          <div style={{textAlign:"center",fontWeight:700,color:"#bcd0ff"}}>Fringing on the screen</div>',
  '          <svg viewBox="0 0 320 300" style={{flex:1,width:"100%"}}>',
  '            {layer(-k, "#ff2d2d")}',
  '            {layer(0, "#2dff5a")}',
  '            {layer(k, "#2d6bff")}',
  '          </svg>',
  '          <div style={{textAlign:"center",fontSize:13,color:disp < 2 ? "#5ee6a8" : "#9fb3d9"}}>{disp < 2 ? "Corrected: sharp" : "Colored edges from dispersion"}</div>',
  '        </div>',
  '      </div>',
  '      <div style={{display:"flex",gap:18,flexWrap:"wrap",justifyContent:"center",fontSize:14,flexShrink:0}}>',
  '        <span style={{color:"#ff8a8a"}}>fR={fR.toFixed(0)}</span>',
  '        <span style={{color:"#7cf08a"}}>fG={fG.toFixed(0)}</span>',
  '        <span style={{color:"#8ab0ff"}}>fB={fB.toFixed(0)}</span>',
  '        <span style={{color:"#9fb3d9"}}>edge shift {k.toFixed(0)} px</span>',
  '      </div>',
  '      <div style={{display:"flex",gap:18,flexWrap:"wrap",justifyContent:"center",flexShrink:0}}>',
  '        <label style={{color:"#bcd0ff"}}>Dispersion: {disp.toFixed(0)}<input type="range" min="0" max="22" step="1" value={disp} onChange={(e)=>setDisp(+e.target.value)}/></label>',
  '        <label style={{color:"#bcd0ff"}}>Focal length: {fG.toFixed(0)}<input type="range" min="60" max="96" step="1" value={fG} onChange={(e)=>setFG(+e.target.value)}/></label>',
  '      </div>',
  '    </div>',
  '  )',
  '}',
].join('\n')

// Multi-lens exemplar: a refracting telescope traced with REAL paraxial optics.
// A bundle of parallel rays from a distant star refracts at the objective, meets
// at the intermediate image, then refracts again at the eyepiece (re-collimating
// when afocal, sep = f1 + f2). This is the bar for ANY multi-lens request: draw
// every lens and the bending ray bundle, never just one image marker.
const exampleTelescope = [
  'function Simulation() {',
  '  const [f1, setF1] = useState(62)',
  '  const [f2, setF2] = useState(20)',
  '  const [sep, setSep] = useState(82)',
  '  const [t, setT] = useState(0)',
  '  useEffect(() => {',
  '    let raf, last = performance.now()',
  '    const tick = (now) => { setT((p) => (p + (now - last) / 1800) % 1); last = now; raf = requestAnimationFrame(tick) }',
  '    raf = requestAnimationFrame(tick)',
  '    return () => cancelAnimationFrame(raf)',
  '  }, [])',
  '  const W = 920, H = 560, axis = 280, S = 5.2, objPx = 130',
  '  const u0 = 0.12',
  '  const eyeX = objPx + sep * S',
  '  const xL = -(objPx - 14) / S, xR = (W - 14 - objPx) / S',
  '  const heights = [26, 13, 0, -13, -26]',
  '  const ptOf = (xo, yo) => [objPx + xo * S, axis - yo * S]',
  '  const trace = (ya) => {',
  '    const u1 = u0 - ya / f1',
  '    const yE = ya + u1 * sep',
  '    const u2 = u1 - yE / f2',
  '    const yOut = yE + u2 * (xR - sep)',
  '    return [ptOf(xL, ya + u0 * xL), ptOf(0, ya), [eyeX, axis - yE * S], ptOf(xR, yOut)]',
  '  }',
  '  const rays = heights.map(trace)',
  '  const toStr = (pts) => pts.map((p) => p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" ")',
  '  const along = (pts, k) => {',
  '    let segs = [], total = 0',
  '    for (let i = 0; i < pts.length - 1; i++) { const L = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1]); segs.push(L); total += L }',
  '    let d = k * total',
  '    for (let i = 0; i < segs.length; i++) { if (d <= segs[i] || i === segs.length - 1) { const r = segs[i] ? d / segs[i] : 0; return [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * r, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * r] } d -= segs[i] }',
  '    return pts[pts.length - 1]',
  '  }',
  '  const ph = along(trace(0), t)',
  '  const afocal = Math.abs(sep - (f1 + f2)) < 3',
  '  const M = f1 / f2',
  '  const imgX = objPx + f1 * S, imgY = axis - u0 * f1 * S',
  '  const rayCols = ["#6cc5ff", "#8ad0ff", "#5ee6a8", "#ffb454", "#ff77c8"]',
  '  return (',
  '    <div style={{display:"flex",flexDirection:"column",height:"100%",gap:8,padding:14,color:"#e6edf7",fontFamily:"Inter, system-ui, sans-serif"}}>',
  '      <h2 style={{margin:0,textAlign:"center",fontWeight:800,fontSize:"clamp(16px,2.4vw,22px)"}}>Refracting Telescope (two lenses)</h2>',
  '      <svg viewBox={"0 0 " + W + " " + H} preserveAspectRatio="xMidYMid meet" style={{flex:1,minHeight:0,width:"100%"}}>',
  '        <line x1="0" y1={axis} x2={W} y2={axis} stroke="#33405e" strokeWidth="2" strokeDasharray="2 8"/>',
  '        {rays.map((r, i) => (<polyline key={i} points={toStr(r)} fill="none" stroke={rayCols[i]} strokeWidth="2.4" opacity="0.95"/>))}',
  '        <ellipse cx={objPx} cy={axis} rx="13" ry="150" fill="url(#labGlass)" stroke="#6cc5ff" strokeWidth="3" filter="url(#labGlow)"/>',
  '        <ellipse cx={eyeX} cy={axis} rx="10" ry="96" fill="url(#labGlass)" stroke="#6cc5ff" strokeWidth="3" filter="url(#labGlow)"/>',
  '        <text x={objPx} y={axis + 174} fill="#9fb3d9" fontSize="14" textAnchor="middle">Objective f1</text>',
  '        <text x={eyeX} y={axis + 120} fill="#9fb3d9" fontSize="14" textAnchor="middle">Eyepiece f2</text>',
  '        <g><line x1={imgX} y1={axis} x2={imgX} y2={imgY} stroke="#ffce6b" strokeWidth="4"/><circle cx={imgX} cy={imgY} r="6" fill="url(#labFlame)"/><text x={imgX} y={imgY - 12} fill="#ffce6b" fontSize="12" textAnchor="middle">intermediate image</text></g>',
  '        <text x="22" y={axis - 150} fill="#9fb3d9" fontSize="13">parallel rays from a distant star</text>',
  '        <text x={W - 16} y={axis - 150} fill="#9fb3d9" fontSize="13" textAnchor="end">{afocal ? "parallel rays to the eye (in focus)" : "adjust separation to focus"}</text>',
  '        <circle cx={ph[0]} cy={ph[1]} r="5" fill="#fff7d6"/>',
  '      </svg>',
  '      <div style={{display:"flex",gap:16,flexWrap:"wrap",justifyContent:"center",fontSize:14,flexShrink:0}}>',
  '        <span style={{color:"#9fb3d9"}}>Angular magnification f1/f2: {M.toFixed(2)}x</span>',
  '        <span style={{color:afocal ? "#5ee6a8" : "#ff9a3c"}}>{afocal ? "Afocal: sharp" : "Out of focus"}</span>',
  '        <span style={{color:"#9fb3d9"}}>Best separation = f1 + f2 = {(f1 + f2).toFixed(0)}</span>',
  '      </div>',
  '      <div style={{display:"flex",gap:16,flexWrap:"wrap",justifyContent:"center",flexShrink:0}}>',
  '        <label style={{color:"#bcd0ff"}}>Objective f1: {f1.toFixed(0)}<input type="range" min="40" max="90" step="1" value={f1} onChange={(e)=>setF1(+e.target.value)}/></label>',
  '        <label style={{color:"#bcd0ff"}}>Eyepiece f2: {f2.toFixed(0)}<input type="range" min="10" max="34" step="1" value={f2} onChange={(e)=>setF2(+e.target.value)}/></label>',
  '        <label style={{color:"#bcd0ff"}}>Separation: {sep.toFixed(0)}<input type="range" min="50" max="130" step="1" value={sep} onChange={(e)=>setSep(+e.target.value)}/></label>',
  '      </div>',
  '    </div>',
  '  )',
  '}',
].join('\n')

const systemPrompt = [
  'You build ONE complete, interactive React + TypeScript (TSX) simulation about LENSES & OPTICS. Return ONLY JSON: {"title": string, "description": string, "code": string} and nothing else.',
  '',
  'CONTRACT',
  '- code defines `function Simulation() { ... }` returning JSX (TSX). Do NOT render or call ReactDOM yourself; the host mounts <Simulation/>.',
  '- Write React + TypeScript (TSX). Types are STRIPPED at runtime (Babel, no type-checking), so light annotations are welcome but optional and must never change behavior. Prefer well-typed state and helpers (e.g. useState<number>(0), type Vec = [number, number]). Use "x as T" for casts, NEVER angle-bracket <T> casts (ambiguous with JSX). NO import / export / require — React and the toolkit are already in scope.',
  '- React hooks are in scope as bare names: useState, useEffect, useRef, useMemo, useCallback, useLayoutEffect, Fragment.',
  '',
  'TOOLKIT (already in scope — use it for correct physics; do not reinvent it or reference anything not listed here)',
  '- thinLens(do, f) -> {di, m, real, inverted}. formImage(do, f) -> {di, m, real, inverted, upright, type} (type "convex"/"concave"/"flat").',
  '- principalRays({objectDistance, focalLength, objectHeight}) -> {di, m, real, image:{x,y}, object:{x,y}, rays:[{solid:[[x,y]...], dashed?:[[x,y]...]}]} in optical units (origin at the lens, +x right, +y up). Draw ray.solid as a polyline and ray.dashed (virtual back-traces) as a dashed polyline.',
  '- chain(lenses, object) traces an object {x,h} through ordered lenses [{x,f}] -> {steps, image:{x,h}, m}. Use for multi-lens systems.',
  '- scene({width,height,unit,lensX,axis}) -> sc with sc.x(ux), sc.y(uy), sc.pt(ux,uy), sc.poly(points), sc.width, sc.height, sc.axis. Maps optical units to SVG (y points down). lensPath(sc,{height,bulge,concave}) -> lens-outline path d. ticks(sc,f) -> [{x,label}] F/2F markers. arrowPoints(sc,x,h) -> arrow polyline points.',
  '- Bare math globals: lerp, clamp, map, deg, rad, dist, rand. Palette: Lab.colors. Convention: convex f>0, concave f<0.',
  '- Predefined SVG defs for instant polish (just reference them): filter="url(#labGlow)" or "url(#labGlowStrong)" for glows, fill="url(#labFlame)" for a candle flame, fill="url(#labGlass)" for lens glass. Do NOT redefine these.',
  '',
  'HARD RULES — a simulation that misses ANY of these is a failure:',
  '1. LAYOUT (fills the window, never scrolls, controls never overlapped): the root <div> is width:100% height:100%, display:flex, flexDirection:column, ~14px padding. The main visual area is flex:1, minHeight:0, overflow:hidden. The control bar(s) at the bottom (readouts + sliders) MUST have flexShrink:0 so they always keep their height and the visual area shrinks instead of covering them. Use an SVG viewBox so visuals scale; no fixed pixel heights. The drawn content must roughly FILL the viewBox in BOTH width and height — size the viewBox to the content bounding box; never leave a large empty region (e.g. a blank right half) or a tiny diagram in a huge viewBox. Side-by-side panels each use flex:1, minHeight:0, overflow:hidden and stack on narrow screens.',
  '2. ANIMATED & INTERACTIVE: animate continuously with requestAnimationFrame AND respond smoothly to controls. Provide 2-3 meaningful <input type="range"> sliders that each visibly change the scene. Sliders are already styled by the host — use plain <input type="range">.',
  '3. RENDER THE RESULT: if there is a computed outcome, DRAW it (never just hint with loose lines). For a lens, compute di & m via thinLens/formImage and draw the formed image at di, scaled by |m| and flipped when m<0. If the prompt mentions a screen / preview / "how it looks", add a SECOND panel that renders the actual projected image (sharp at the image plane, blurred/faint off it).',
  '4. CORRECT PHYSICS via the toolkit, not hand-rolled geometry. Single lens: principalRays (solid rays + dashed back-traces for virtual images). Multi-lens (telescope/microscope/eye): use chain, OR trace a BUNDLE of 4-6 rays and bend each at EVERY lens with the slope rule u_out = u_in - y/f. NEVER draw two straight chief lines through the lens centers.',
  '5. VISIBLE ON A DARK BG (#0b1020): bright colors only — light text #e6edf7; accents cyan #6cc5ff, amber #ffb454, emerald #5ee6a8, pink #ff77c8, violet #c792ff. NEVER use black, near-black, or dark-gray strokes/fills/text (invisible). Lines 2-3px. Include a title, labels (axis, F/2F via ticks, object, image), a short legend, and at least 3 live numeric readouts of COMPUTED values.',
  '6. ROBUST (no blanks): return visible JSX on the FIRST render — never null, and never hide the whole scene behind a flag that starts false or an effect that runs later. Guard every coordinate against NaN/Infinity; clamp off-screen values or switch to the virtual/back-trace form. Use safe initial state (no divide-by-zero, no undefined index). Only call helpers listed above or ones you define in the code.',
  '7. INFORMATIVE & PEDAGOGICAL: this is a LEARNING tool — design it to teach, not just to look nice. Include a clear title and a one-line explanation of the concept; label the key parts (lens, F/2F, object, image, optical axis); show the governing equation when relevant (e.g. 1/f = 1/do + 1/di, m = -di/do); and annotate what CHANGES as the learner moves a slider (real<->virtual, upright<->inverted, converging<->diverging, in/out of focus). Prefer clarity that builds intuition over decoration.',
  '',
  'SECURITY: never use fetch, XMLHttpRequest, WebSocket, EventSource, localStorage, sessionStorage, indexedDB, document.cookie, dynamic import(), window.parent/top, opener, navigator.sendBeacon, external URLs, or any network/storage. Everything is computed locally.',
  '',
  'SCOPE: stay in LENSES & OPTICS (lenses, rays, images, focal points, magnification, aberration, telescopes, microscopes, eyes, cameras, prisms). Within that, build whatever the user asks, creatively.',
  '',
  'GOLD EXAMPLES — each item is a PROMPT followed by exactly the code you should generate for it (the five course lessons, plus chromatic and multi-lens). They are written in plain JS, which is valid TypeScript; match their quality and structure and feel free to add light TypeScript types. Study how each prompt maps to complete, correct, full-bleed, animated code with labels and readouts, then produce code of this same quality for the user request (adapt to it; do not copy verbatim). For ANY multi-lens system (telescope/microscope/eye), copy the telescope approach — always draw EVERY lens and the bending ray bundle, never just a single image marker.',
  'PROMPT: "Convex lens image visualizer with a candle. Sliders for object distance, focal length, and screen position; trace the principal rays; show a real inverted image outside F and a virtual upright image inside F; project the image on a movable screen with focus blur plus a preview panel; readouts for image distance and magnification." CODE TO GENERATE:',
  exampleComponent,
  'PROMPT: "Concave (diverging) lens forming the image of a candle, with an object-distance slider and a lens-strength slider. Show that the image is always virtual, upright, and reduced on the same side as the object, using diverging rays with dashed back-traces; readouts for image distance and magnification." CODE TO GENERATE:',
  exampleConcave,
  'PROMPT: "A single curvature slider that morphs a lens from convex (converging) through flat to concave (diverging). Show collimated parallel rays converging, passing straight, or diverging, with the lens outline morphing and the signed focal length labeled." CODE TO GENERATE:',
  exampleCurvature,
  'PROMPT: "Ray tracing for a convex lens: from the object tip draw the three principal rays (parallel->through F, chief->through the center, focal->leaves parallel), color-coded with a legend, meeting at the image; label real vs virtual; sliders for object distance and focal length." CODE TO GENERATE:',
  exampleRayTrace,
  'PROMPT: "Thin lens equation explorer: object-distance and focal-length sliders, the ray diagram, a live 1/f = 1/do + 1/di panel with m = -di/do, and a label for the magnifier vs projector regime." CODE TO GENERATE:',
  exampleThinLens,
  'PROMPT: "Chromatic aberration: a convex lens splitting white light into red, green, and blue foci (red farthest, blue nearest) with a dispersion slider and a focal-length slider, plus a bright, high-contrast RGB fringing preview on a screen. Fill the window." CODE TO GENERATE:',
  exampleChromatic,
  'PROMPT: "Refracting telescope with two convex lenses (objective + eyepiece): sliders for each focal length and the separation. Trace a bundle of 4-6 parallel rays from a distant star and bend each at BOTH lenses (u_out = u_in - y/f); draw both lenses and the intermediate image; report angular magnification f1/f2; rays re-collimate to the eye when separation = f1 + f2." CODE TO GENERATE:',
  exampleTelescope,
].join('\n')

// Short, playful "Surprise me" idea generator. Returns just a one-line prompt
// the learner can build, kept in the optics domain and novel vs. an avoid list.
const ideaSystemPrompt = [
  'You are a witty physics teacher brainstorming ONE genuinely COOL, UNIQUE interactive optics simulation a learner could build. Return ONLY JSON: {"idea": string}.',
  'Requirements:',
  '- One or two concrete sentences (max ~200 chars), phrased as a build request (what to simulate), about LENSES & OPTICS.',
  '- Pick a SPECIFIC, vivid, real-world or playful scenario with a memorable object/setting — not a bland textbook phrase. Name the optical element (convex/concave lens, prism, magnifier, telescope, microscope, eye, camera, projector, raindrop, water surface, fiber, Fresnel lens), an interactive control (a slider or a draggable), AND the payoff the learner sees.',
  '- Buildable as a small React + SVG diagram with sliders and animated rays — NOT a photo or video.',
  '- Be NOVEL and surprising: choose a DIFFERENT scenario, object, and twist from anything in the AVOID list. Lean into fun, concrete hooks.',
  'NEVER produce a bland, generic idea like "virtual image of a tree" or "image formed by a lens" — those are boring. Always give it a specific, cool hook with a real object and a satisfying thing to watch happen.',
  'Examples of the vibe (do NOT copy):',
  '- "Point a backyard telescope at Saturn: drag the eyepiece focal length and watch the rings snap from blurry to razor-sharp as the two lenses align."',
  '- "A dewdrop acting as a tiny lens over an ant: slide the droplet size and watch the ant balloon up, then flip upside-down past the focus."',
  '- "Fix blurry vision: an eye that cannot focus a candle on its retina until you drag a corrective lens into place."',
  '- "A glass prism in a sunbeam: rotate it and watch white light fan into a rainbow, with violet bending the most."',
  '- "A cinema projector throwing a tiny film frame onto a huge screen: slide the screen distance to find the one sharp, inverted image."',
  '- "A lighthouse Fresnel lens turning a bare bulb into a tight beam: drag the bulb through the focus and watch the beam converge, collimate, then spread."',
  'No preamble and no markdown — just the JSON object.',
].join('\n')

// Intermediate step: the learner types a SHORT topic ("chromatic aberration").
// Act as an optics teacher + designer and produce a DETAILED, STRUCTURED PLAN for
// the simulation (covering scene, controls, physics/accuracy, visuals, layout),
// which the code model then implements. A structured plan yields nicer, more
// accurate results than a loose paragraph.
const designSystemPrompt = [
  'A learner gives you a SHORT optics TOPIC (e.g. "chromatic aberration", "prism", "convex lens", "telescope"). Act as an expert optics teacher AND interface designer and ENRICH it into a DETAILED PLAN for ONE interactive, informative React + TypeScript + SVG simulation of that topic (rays, sliders, lenses, projections, candles, screens — whatever the concept needs). Return ONLY JSON: {"brief": string}, where brief is the full plan written as labeled sections separated by " | ".',
  'The plan MUST contain ALL of these labeled sections, each concrete and specific:',
  '- Title: a short, descriptive title.',
  '- Concept: one sentence on what the learner should understand.',
  '- Scene: the objects to draw — candle/arrow object, the lens(es) as real lens shapes, the optical axis, focal markers F/2F, the light rays, and any screen / retina / preview panel.',
  '- Controls: 2-3 sliders, each with a name, a numeric range, and exactly what it changes.',
  '- Animation: what moves continuously (e.g. a photon travelling along a ray) and how the scene responds to each slider.',
  '- Physics & accuracy: the EXACT equations, sign conventions, sensible numeric ranges, and the CORRECT expected behavior so the result is scientifically and mathematically accurate. Use thin-lens 1/f = 1/do + 1/di, magnification m = -di/do, convex f>0 / concave f<0, and for multi-lens the paraxial slope rule u_out = u_in - y/f. State the right qualitative facts (object outside F -> real inverted image; inside F -> virtual upright magnified; concave lens -> always virtual upright reduced; in dispersion red focuses farther than blue).',
  '- Result & readouts: the computed result to RENDER (image position/size/orientation, focus/blur, fringing) plus the live numeric readouts, labels, and a short legend.',
  '- Visual style: make it look polished — dark background (#0b1020); bright high-contrast colors (cyan #6cc5ff, amber #ffb454, emerald #5ee6a8, pink #ff77c8, violet #c792ff, light text #e6edf7); glows/gradients via url(#labGlow), url(#labFlame) for the candle flame, url(#labGlass) for lens glass; generous spacing, clear title and legend.',
  '- Layout: fills the window via an SVG viewBox (no scrolling); the main visual is flex:1, minHeight:0, overflow:hidden; the readout/slider bar is pinned with flexShrink:0 so it is never overlapped; side-by-side panels stack on narrow/mobile screens.',
  'Stay strictly in LENSES & OPTICS, concrete and buildable. Aim for ~700-1000 characters total. No markdown, no preamble — just the JSON object.',
  'Worked example — Topic "chromatic aberration" produces this plan:',
  '"Title: Chromatic Aberration in a Convex Lens | Concept: a lens bends shorter wavelengths more, so colors focus at different points. | Scene: white collimated rays enter a convex lens and split into red/green/blue ray bundles converging to three foci on the axis, with per-color F markers and a screen-preview panel. | Controls: Dispersion 0-22 (focal spread between colors); Focal length 60-96 (base focus). | Animation: rays pulse and the foci shift live as the sliders move. | Physics & accuracy: green focal length fG; fR = fG + dispersion and fB = fG - dispersion (red focuses farther, blue nearer); draw straight rays from the lens edges to each color focus. | Result & readouts: three labeled foci R/G/B, the fR/fG/fB values and edge-shift in px; preview shows bright RGB-offset fringing that is sharp when dispersion ~ 0. | Visual style: dark bg, bright red/green/blue rays, lens via url(#labGlass), glow on the foci, light labels and legend. | Layout: two side-by-side panels (diagram + fringing preview) that fill the window and stack on mobile; the slider/readout bar pinned with flexShrink:0."',
].join('\n')

function openAiChat(apiKey: string, payload: unknown) {
  return fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
}

async function errorFromResponse(response: Response): Promise<string> {
  let message = 'The AI service is temporarily unavailable.'
  try {
    const detail = await response.json()
    if (detail?.error?.type === 'insufficient_quota') {
      message = 'The AI service is unavailable: the OpenAI account has no remaining quota.'
    }
  } catch {
    // keep the generic message
  }
  return message
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed.' }, 405)

  try {
    const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>
    const apiKey = Deno.env.get('OPENAI_API_KEY')
    if (!apiKey) return json({ error: 'OPENAI_API_KEY is not configured.' }, 500)

    // "Surprise me": return a single fresh prompt idea instead of generating code.
    if (payload.mode === 'idea') {
      const avoid = Array.isArray(payload.avoid)
        ? payload.avoid.slice(0, 14).map((a) => String(a).slice(0, 200))
        : []
      const topic = typeof payload.topic === 'string' ? payload.topic.slice(0, 120) : 'lenses and optics'
      const seed = Math.random().toString(36).slice(2, 10)
      const userMsg =
        'Topic: ' + topic +
        '\nAVOID these ideas (do not repeat or rephrase):\n' +
        (avoid.length ? avoid.map((a) => '- ' + a).join('\n') : '(none yet)') +
        '\nReturn ONE fresh idea as JSON. variety seed: ' + seed

      const ideaRes = await openAiChat(apiKey, {
        model: 'gpt-4o',
        temperature: 1.1,
        top_p: 0.95,
        max_tokens: 220,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: ideaSystemPrompt },
          { role: 'user', content: userMsg },
        ],
      })
      if (!ideaRes.ok) return json({ error: await errorFromResponse(ideaRes) }, 502)

      const ideaBody = await ideaRes.json()
      const ideaContent = ideaBody?.choices?.[0]?.message?.content
      if (typeof ideaContent !== 'string') return json({ error: 'AI returned no content.' }, 502)
      const parsed = parseJson(ideaContent)
      const obj = parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {}
      const idea = cleanText(obj.idea ?? obj.prompt ?? obj.suggestion, 'idea', 240)
      return json({ idea })
    }

    const cleanPrompt = cleanText(payload.prompt, 'prompt', 500)

    // Stage 1: expand the short topic into a detailed, build-ready design brief.
    // Fast mini model keeps the extra call cheap; the strong design prompt makes
    // its output specific and accurate.
    const briefRes = await openAiChat(apiKey, {
      model: 'gpt-4o-mini',
      temperature: 0.6,
      max_tokens: 800,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: designSystemPrompt },
        { role: 'user', content: 'Topic: ' + cleanPrompt },
      ],
    })
    if (!briefRes.ok) return json({ error: await errorFromResponse(briefRes) }, 502)

    let brief = cleanPrompt
    try {
      const briefBody = await briefRes.json()
      const briefContent = briefBody?.choices?.[0]?.message?.content
      if (typeof briefContent === 'string') {
        const parsed = parseJson(briefContent)
        const obj = parsed && typeof parsed === 'object' && !Array.isArray(parsed)
          ? (parsed as Record<string, unknown>)
          : {}
        const b = obj.brief ?? obj.idea ?? obj.description
        if (typeof b === 'string' && b.trim()) brief = b.trim().slice(0, 1600)
      }
    } catch {
      // Malformed brief: fall back to the raw topic for stage 2.
    }

    const userContent = 'Topic: ' + cleanPrompt + '\n\nDetailed simulation brief to implement:\n' + brief

    // Stage 2: generate the runnable React simulation from the detailed brief.
    const response = await openAiChat(apiKey, {
      model: 'gpt-4o',
      temperature: 0.5,
      max_tokens: 12000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
    })
    if (!response.ok) return json({ error: await errorFromResponse(response) }, 502)

    const body = await response.json()
    const content = body?.choices?.[0]?.message?.content
    if (typeof content !== 'string') return json({ error: 'AI returned no content.' }, 502)

    return json({ result: validateResult(parseJson(content)) })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Simulation generation failed.'
    return json({ error: message }, 400)
  }
})
