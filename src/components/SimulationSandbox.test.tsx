import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SimulationSandbox } from './SimulationSandbox'
import type { SimulationSpec } from '../ai/simulationContract'

const spec: SimulationSpec = {
  id: 'demo',
  title: 'Demo Sim',
  description: 'A demo.',
  prompt: 'demo',
  code: 'function Simulation() { return <div>hi</div> }',
}

describe('SimulationSandbox', () => {
  it('renders a locked-down iframe that runs the generated code', () => {
    render(<SimulationSandbox spec={spec} />)
    const frame = screen.getByTitle(/demo sim interactive simulation/i)
    expect(frame).toHaveAttribute('sandbox', 'allow-scripts')
    expect(frame).toHaveAttribute('srcdoc', expect.stringContaining("connect-src 'none'"))
    expect(frame).toHaveAttribute('srcdoc', expect.stringContaining('function Simulation()'))
  })

  it('offers a restart control and no source display', () => {
    render(<SimulationSandbox spec={spec} />)
    expect(screen.getByRole('button', { name: /restart/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /show source/i })).not.toBeInTheDocument()
  })
})
