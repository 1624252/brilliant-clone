import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { SimulationStudio } from './SimulationStudio'
import { generateSimulation, suggestSimulationPrompt } from '../ai/generateSimulation'
import type { SimulationSpec } from '../ai/simulationContract'

vi.mock('../ai/generateSimulation', () => ({
  generateSimulation: vi.fn(),
  suggestSimulationPrompt: vi.fn(),
}))

const mockedGenerate = vi.mocked(generateSimulation)
const mockedSuggest = vi.mocked(suggestSimulationPrompt)

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
    mockedSuggest.mockReset()
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

  it('generates a detailed prompt from an example chip', async () => {
    mockedGenerate.mockResolvedValueOnce(spec)
    render(<SimulationStudio topicTitle="Geometric Optics: Lenses" onBack={() => {}} />)

    fireEvent.click(screen.getByRole('button', { name: /convex lens image visualizer/i }))

    expect(await screen.findByRole('heading', { name: /chromatic aberration/i })).toBeInTheDocument()
    expect(mockedGenerate).toHaveBeenCalledTimes(1)
    expect(mockedGenerate.mock.calls[0][0]).toMatch(/convex lens image visualizer with a candle/i)
  })

  it('cancels an in-progress generation', () => {
    mockedGenerate.mockReturnValueOnce(new Promise<SimulationSpec>(() => {}))
    render(<SimulationStudio topicTitle="Geometric Optics: Lenses" onBack={() => {}} />)

    fireEvent.change(screen.getByRole('textbox', { name: /what do you want to simulate/i }), {
      target: { value: 'chromatic aberration' },
    })
    fireEvent.click(screen.getByRole('button', { name: /build simulation/i }))

    const cancel = screen.getByRole('button', { name: /cancel/i })
    expect(cancel).toBeInTheDocument()
    fireEvent.click(cancel)
    expect(screen.queryByRole('button', { name: /cancel/i })).not.toBeInTheDocument()
  })

  it('fills the prompt with a generated idea', async () => {
    mockedSuggest.mockResolvedValueOnce('A draggable prism that splits sunlight into a rainbow you can steer.')
    render(<SimulationStudio topicTitle="Geometric Optics: Lenses" onBack={() => {}} />)

    fireEvent.click(screen.getByRole('button', { name: /generate prompt/i }))

    const textarea = await screen.findByRole('textbox', { name: /what do you want to simulate/i })
    expect((textarea as HTMLTextAreaElement).value).toMatch(/draggable prism that splits sunlight/i)
    expect(mockedSuggest).toHaveBeenCalledTimes(1)
  })
})
