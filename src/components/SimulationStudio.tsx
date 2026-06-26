import { useState, type FormEvent } from 'react'
import { generateSimulation } from '../ai/generateSimulation'
import type { SimulationSpec } from '../ai/simulationContract'
import { SimulationSandbox } from './SimulationSandbox'
import './SimulationStudio.css'

interface SimulationStudioProps {
  topicTitle: string
  onBack: () => void
}

interface GeneratedState {
  spec: SimulationSpec
  key: number
}

const examples = [
  'Chromatic aberration simulation',
  'Image visualizer with a candle and a convex lens',
  'Single slit diffraction pattern you can tune',
  'Pendulum with adjustable length and gravity',
]

const abilities = ['Interactive controls', 'Live animation', 'Mobile friendly', 'Resizable window']

export function SimulationStudio({ topicTitle, onBack }: SimulationStudioProps) {
  const [prompt, setPrompt] = useState('')
  const [generated, setGenerated] = useState<GeneratedState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [generationId, setGenerationId] = useState(0)

  async function generate(nextPrompt: string) {
    const text = nextPrompt.trim()
    if (!text || loading) return
    const nextId = generationId + 1
    setGenerationId(nextId)
    setError(null)
    setLoading(true)
    try {
      const spec = await generateSimulation(text)
      setGenerated({ spec, key: nextId })
    } catch (err) {
      setGenerated(null)
      setError(err instanceof Error ? err.message : 'Simulation generation failed.')
    } finally {
      setLoading(false)
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void generate(prompt)
  }

  return (
    <div className="studio">
      <header className="studio__bar">
        <button type="button" className="btn studio__back" onClick={onBack}>
          ← Roadmap
        </button>
        <span className="studio__title">Simulation Studio</span>
      </header>

      <main className="studio__main">
        <section className="studio__hero card">
          <p className="studio__eyebrow">AI Simulation Studio · {topicTitle}</p>
          <h1>Describe a simulation. We build an interactive version you can play with.</h1>
          <p>
            Type an idea and the studio generates a live, animated, mobile-friendly simulation with
            working controls.
          </p>

          <form className="studio__form" onSubmit={handleSubmit}>
            <label htmlFor="studio-prompt">What do you want to simulate?</label>
            <textarea
              id="studio-prompt"
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Try: chromatic aberration simulation"
              rows={3}
            />
            <button type="submit" className="btn btn--primary" disabled={loading || !prompt.trim()}>
              {loading ? 'Building…' : 'Build simulation'}
            </button>
          </form>

          <div className="studio__examples" aria-label="Example simulation prompts">
            {examples.map((example) => (
              <button
                type="button"
                className="studio__example"
                key={example}
                onClick={() => {
                  setPrompt(example)
                  void generate(example)
                }}
                disabled={loading}
              >
                {example}
              </button>
            ))}
          </div>

          <div className="studio__abilities" aria-label="Simulation abilities">
            {abilities.map((ability) => (
              <span key={ability}>{ability}</span>
            ))}
          </div>
        </section>

        {error && (
          <section className="studio__panel card" aria-live="polite">
            <div className="studio__error" role="alert">
              <strong>Simulation could not be built</strong>
              <span>{error}</span>
            </div>
          </section>
        )}

        {generated && (
          <section className="studio__panel card" aria-live="polite">
            <div className="studio__panel-head">
              <h2>{generated.spec.title}</h2>
              <p>{generated.spec.description}</p>
            </div>
            <SimulationSandbox key={generated.key} spec={generated.spec} />
          </section>
        )}

        {loading && (
          <div className="studio__floating" role="status">
            Building your simulation…
          </div>
        )}
      </main>
    </div>
  )
}
