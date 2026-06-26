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
    expect(doc).toContain('ReactDOM.createRoot')
    expect(doc).toContain('https://unpkg.com')
  })

  it('escapes closing script tags in generated code', () => {
    const doc = buildSandboxDoc({ ...goodSpec, code: 'function Simulation() { return null } // </script>' })
    expect(doc).not.toContain('// </script>')
    expect(doc).toContain('<\\/script>')
  })
})

describe('slugId', () => {
  it('slugifies titles and falls back when empty', () => {
    expect(slugId('Chromatic Aberration!')).toBe('chromatic-aberration')
    expect(slugId('   ')).toBe('ai-simulation')
  })
})
