import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { SimulationStudio } from './SimulationStudio'
import { generateSimulation } from '../ai/generateSimulation'
import type { SimulationSpec } from '../ai/simulationContract'

vi.mock('../ai/generateSimulation', () => ({
  generateSimulation: vi.fn(),
}))

const mockedGenerate = vi.mocked(generateSimulation)

const spec: SimulationSpec = {
  id: 'chromatic-aberration',
  title: 'Chromatic Aberration',
  description: 'Adjust the intensity and see the fringing.',
  prompt: 'chromatic aberration simulation',
  code: 'function Simulation() { return <div>sim</div> }',
}

describe('SimulationStudio', () => {
  beforeEach(() => {
    mockedGenerate.mockReset()
  })

  it('renders a generated simulation on success', async () => {
    mockedGenerate.mockResolvedValueOnce(spec)
    render(<SimulationStudio topicTitle="Geometric Optics: Lenses" onBack={() => {}} />)

    fireEvent.change(screen.getByRole('textbox', { name: /what do you want to simulate/i }), {
      target: { value: 'chromatic aberration simulation' },
    })
    fireEvent.click(screen.getByRole('button', { name: /build simulation/i }))

    expect(await screen.findByRole('heading', { name: /chromatic aberration/i })).toBeInTheDocument()
    expect(screen.getByTitle(/chromatic aberration interactive simulation/i)).toBeInTheDocument()
  })

  it('shows the error and no simulation when generation fails', async () => {
    mockedGenerate.mockRejectedValueOnce(new Error('OPENAI_API_KEY is not configured.'))
    render(<SimulationStudio topicTitle="Geometric Optics: Lenses" onBack={() => {}} />)

    fireEvent.change(screen.getByRole('textbox', { name: /what do you want to simulate/i }), {
      target: { value: 'pendulum' },
    })
    fireEvent.click(screen.getByRole('button', { name: /build simulation/i }))

    expect(await screen.findByText(/simulation could not be built/i)).toBeInTheDocument()
    expect(screen.getByText(/openai_api_key is not configured/i)).toBeInTheDocument()
    expect(screen.queryByTitle(/interactive simulation/i)).not.toBeInTheDocument()
  })

  it('generates from an example chip', async () => {
    mockedGenerate.mockResolvedValueOnce(spec)
    render(<SimulationStudio topicTitle="Geometric Optics: Lenses" onBack={() => {}} />)

    fireEvent.click(screen.getByRole('button', { name: /chromatic aberration simulation/i }))

    expect(await screen.findByRole('heading', { name: /chromatic aberration/i })).toBeInTheDocument()
    expect(mockedGenerate).toHaveBeenCalledWith('Chromatic aberration simulation')
  })
})
