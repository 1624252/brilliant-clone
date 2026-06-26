import { useEffect, useRef, useState, type FormEvent } from 'react'
import { generateSimulation, suggestSimulationPrompt } from '../ai/generateSimulation'
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

// Lens-focused starter prompts. The `label` is the short chip text; the richer
// `prompt` is what we actually send so the AI has enough detail to do well.
const examples = [
  {
    label: 'Convex lens image visualizer',
    prompt:
      'Convex lens image visualizer with a candle. Sliders for object distance, focal length, and screen position. Show the ray diagram with the principal rays, and a separate preview panel that displays the projected, inverted image on the screen — sharp when the screen is at the image plane and blurred otherwise. Include live readouts for image distance and magnification.',
  },
  {
    label: 'Chromatic aberration through a lens',
    prompt:
      'Chromatic aberration simulation: a convex lens splitting white light into red, green, and blue foci at slightly different points, with a slider for dispersion intensity, and a preview panel showing the colored edge fringing on a screen.',
  },
  {
    label: 'Two-lens telescope',
    prompt:
      'Refracting telescope with TWO convex lenses on one optical axis: a long-focal-length objective and a shorter-focal-length eyepiece, with a slider for each focal length and one for the lens separation. Trace a BUNDLE of 4-6 parallel rays coming from a distant star and bend each ray realistically at BOTH lenses (use the thin-lens slope rule u_out = u_in - y/f) so the light visibly refracts at the objective, converges to the intermediate image, then refracts again at the eyepiece and comes out parallel when in focus (separation = f1 + f2). Make the lenses large and let the ray bundle span the full width so it FILLS the window. Label both lenses and the intermediate image, and show the angular magnification f1/f2.',
  },
  {
    label: 'Magnifying glass (virtual image)',
    prompt:
      'Magnifying glass: a convex lens with a candle placed INSIDE the focal length, so the image is virtual, upright, and enlarged. Sliders for object distance and focal length (keep the object inside F). Trace the diverging principal rays with dashed back-traces, and render the actual large upright ghost candle where the back-traces meet, with a live magnification readout. Make the lens and image large so the diagram fills the window and reads on mobile.',
  },
]

const abilities = ['Interactive controls', 'Live animation', 'Mobile friendly', 'Resizable window']

export function SimulationStudio({ topicTitle, onBack }: SimulationStudioProps) {
  const [prompt, setPrompt] = useState('')
  const [generated, setGenerated] = useState<GeneratedState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [generationId, setGenerationId] = useState(0)
  const [suggesting, setSuggesting] = useState(false)
  const [recentIdeas, setRecentIdeas] = useState<string[]>([])
  const [loadStep, setLoadStep] = useState(0)
  const abortRef = useRef<AbortController | null>(null)

  // Advance the loader copy through the two pipeline stages so the wait reads as
  // progress (the stages run server-side, so this is time-based, not exact).
  useEffect(() => {
    if (!loading) return
    const a = setTimeout(() => setLoadStep(1), 4500)
    const b = setTimeout(() => setLoadStep(2), 12000)
    return () => {
      clearTimeout(a)
      clearTimeout(b)
    }
  }, [loading])

  const loadSteps = [
    'Designing the simulation…',
    'Building the interactive version…',
    'Polishing the details…',
  ]

  async function handleSurprise() {
    if (loading || suggesting) return
    setSuggesting(true)
    setError(null)
    try {
      // Steer away from the starter chips and anything we've already suggested.
      const avoid = [...examples.map((example) => example.label), ...recentIdeas]
      const idea = await suggestSimulationPrompt(topicTitle, avoid)
      setPrompt(idea)
      setRecentIdeas((prev) => [idea, ...prev].slice(0, 10))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not suggest an idea.')
    } finally {
      setSuggesting(false)
    }
  }

  async function generate(nextPrompt: string) {
    const text = nextPrompt.trim()
    if (!text || loading) return
    const controller = new AbortController()
    abortRef.current = controller
    const nextId = generationId + 1
    setGenerationId(nextId)
    setError(null)
    setLoadStep(0)
    setLoading(true)
    try {
      const spec = await generateSimulation(text, controller.signal)
      if (controller.signal.aborted) return
      setGenerated({ spec, key: nextId })
    } catch (err) {
      // Cancellation is intentional — don't surface it as an error.
      if (controller.signal.aborted || (err as Error)?.name === 'AbortError') return
      setGenerated(null)
      setError(err instanceof Error ? err.message : 'Simulation generation failed.')
    } finally {
      // Only the active request clears loading (a cancel already cleared it).
      if (abortRef.current === controller) {
        abortRef.current = null
        setLoading(false)
      }
    }
  }

  function handleCancel() {
    abortRef.current?.abort()
    abortRef.current = null
    setLoading(false)
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
          <p className="studio__eyebrow">
            AI Simulation Studio · {topicTitle}
            <span className="studio__beta">Experimental</span>
          </p>
          <h1>Describe a simulation. We build an interactive version you can play with.</h1>
          <p>
            Type an idea and the studio generates a live, animated, mobile-friendly simulation with
            working controls.
          </p>
          <p className="studio__disclaimer" role="note">
            Heads up: this is an experimental feature that is still under active development.
            Generated simulations are AI-made and may be imperfect, look rough, or occasionally fail
            — they are for exploration, not a guaranteed-accurate reference.
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
            <div className="studio__actions">
              <button type="submit" className="btn btn--primary" disabled={loading || !prompt.trim()}>
                {loading ? 'Building…' : 'Build simulation'}
              </button>
              <button
                type="button"
                className="btn studio__surprise"
                onClick={handleSurprise}
                disabled={loading || suggesting}
                title="Generate a fresh optics simulation prompt"
              >
                {suggesting ? 'Generating…' : '✨ Generate prompt'}
              </button>
            </div>
          </form>

          <p className="studio__examples-hint">Or start from one of these:</p>
          <div className="studio__examples" aria-label="Example simulation prompts">
            {examples.map((example) => (
              <button
                type="button"
                className="studio__example"
                key={example.label}
                onClick={() => {
                  setPrompt(example.prompt)
                  void generate(example.prompt)
                }}
                disabled={loading}
              >
                {example.label}
              </button>
            ))}
          </div>

          <div className="studio__abilities" aria-label="Simulation abilities">
            {abilities.map((ability) => (
              <span key={ability}>{ability}</span>
            ))}
          </div>
        </section>

        {loading && (
          <section className="studio__panel card studio__loading" role="status" aria-live="polite">
            <div className="studio__loading-head">
              <span className="studio__spinner" aria-hidden="true" />
              <strong>{loadSteps[loadStep]}</strong>
              <button type="button" className="btn studio__cancel" onClick={handleCancel}>
                Cancel
              </button>
            </div>
            <div className="studio__skeleton" aria-hidden="true" />
            <p className="studio__loading-hint">
              Generating an interactive, animated simulation — this can take up to a minute.
            </p>
          </section>
        )}

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

      </main>
    </div>
  )
}
