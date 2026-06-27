import { describe, expect, it } from 'vitest'
import {
  buildSandboxDoc,
  scanForbidden,
  slugId,
  validateSimulationSpec,
  type SimulationSpec,
} from './simulationContract'

const goodSpec: SimulationSpec = {
  id: 'demo',
  title: 'Demo',
  description: 'A demo simulation.',
  prompt: 'demo',
  code: 'function Simulation() { const [n, setN] = useState(0); return <button onClick={() => setN(n + 1)}>{n}</button> }',
}

describe('validateSimulationSpec', () => {
  it('accepts a self-contained Simulation component', () => {
    expect(validateSimulationSpec(goodSpec).ok).toBe(true)
  })

  it('rejects code without a Simulation component', () => {
    const result = validateSimulationSpec({ ...goodSpec, code: 'const x = 1' })
    expect(result.ok).toBe(false)
    expect(result.errors.join(' ')).toMatch(/Simulation component/i)
  })

  it('rejects forbidden network/storage capabilities', () => {
    const result = validateSimulationSpec({
      ...goodSpec,
      code: 'function Simulation() { fetch("/x"); localStorage.getItem("y"); return null }',
    })
    expect(result.ok).toBe(false)
    expect(result.errors.join(' ')).toMatch(/forbidden/i)
  })
})

describe('scanForbidden', () => {
  it('flags fetch but not legitimate layout math like rect.top', () => {
    expect(scanForbidden('const t = el.getBoundingClientRect().top')).toEqual([])
    expect(scanForbidden('fetch("https://x")')).toContain('fetch')
  })
})

describe('buildSandboxDoc', () => {
  it('embeds the code, blocks the network, and mounts the component', () => {
    const doc = buildSandboxDoc(goodSpec)
    expect(doc).toContain("connect-src 'none'")
    expect(doc).toContain('function Simulation()')
    expect(doc).toContain('createRoot')
    expect(doc).toContain('https://unpkg.com')
  })

  it('transpiles TypeScript + JSX in the sandbox (strips types, keeps JSX)', () => {
    const doc = buildSandboxDoc(goodSpec)
    // Babel must run the typescript preset (TSX) so generated code can use types.
    expect(doc).toContain("'typescript'")
    expect(doc).toContain('isTSX')
    expect(doc).toContain("filename: 'simulation.tsx'")
  })

  it('accepts a typed Simulation component', () => {
    const tsSpec: SimulationSpec = {
      ...goodSpec,
      code: 'function Simulation(): JSX.Element { const [n, setN] = useState<number>(0); return <button onClick={() => setN(n + 1)}>{n}</button> }',
    }
    expect(validateSimulationSpec(tsSpec).ok).toBe(true)
    expect(buildSandboxDoc(tsSpec)).toContain('useState<number>(0)')
  })

  it('escapes closing script tags in generated code', () => {
    const doc = buildSandboxDoc({ ...goodSpec, code: 'function Simulation() { return null } // </script>' })
    expect(doc).not.toContain('// </script>')
    expect(doc).toContain('<\\/script>')
  })

  it('keeps the existing Lab toolkit API for backward compatibility', () => {
    const doc = buildSandboxDoc(goodSpec)
    for (const name of ['colors', 'clamp', 'thinLens', 'scene', 'principalRays']) {
      expect(doc).toContain(name)
    }
    // scene mapping helpers the exemplars rely on.
    expect(doc).toContain('poly: function')
  })

  it('exposes the new Lab helpers', () => {
    const doc = buildSandboxDoc(goodSpec)
    for (const name of ['lerp', 'lensPath', 'ticks', 'arrowPoints', 'chain', 'defs:']) {
      expect(doc).toContain(name)
    }
  })

  it('extends Lab.colors without dropping existing keys', () => {
    const doc = buildSandboxDoc(goodSpec)
    for (const key of ['axis:', 'ray:', 'object:', 'image:', 'accent:', 'flame:', 'glass:', 'grid:']) {
      expect(doc).toContain(key)
    }
  })

  it('injects the shared SVG <defs> ids referenced by url(#...)', () => {
    const doc = buildSandboxDoc(goodSpec)
    for (const id of ['labGlow', 'labGlowStrong', 'labFlame', 'labGlass']) {
      expect(doc).toContain(`id="${id}"`)
    }
    expect(doc).toContain('<defs>')
  })

  it('keeps security and mobile harness invariants', () => {
    const doc = buildSandboxDoc(goodSpec)
    // CSP / sandbox guardrails must stay intact.
    expect(doc).toContain("connect-src 'none'")
    expect(doc).toContain("default-src 'none'")
    // Clean native slider styling and preserved fade animation.
    expect(doc).toContain('accent-color: #6cc5ff')
    expect(doc).toContain('simfade')
    // Common helpers exposed as bare globals so generated code can call them
    // unprefixed without crashing (e.g. lerp/clamp), plus React bound explicitly.
    expect(doc).toContain('window.lerp = lerp')
    expect(doc).toContain('window.clamp = clamp')
    // Manual transpile-and-run so compile errors are surfaced (not a silent blank).
    expect(doc).toContain('Babel.transform')
    // Error boundary + async error capture so a throw shows a message, not a blank.
    expect(doc).toContain('getDerivedStateFromError')
    expect(doc).toContain('unhandledrejection')
  })
})

describe('slugId', () => {
  it('slugifies titles and falls back when empty', () => {
    expect(slugId('Chromatic Aberration!')).toBe('chromatic-aberration')
    expect(slugId('   ')).toBe('ai-simulation')
  })
})
