import { slugId, validateSimulationSpec, type SimulationSpec } from './simulationContract'

interface GenerateSimulationResponse {
  result?: { title?: string; description?: string; code?: string }
  error?: string
}

/**
 * Ask the server-side OpenAI proxy to generate an interactive React simulation
 * for the prompt. The OpenAI key stays in Supabase secrets; this only calls the
 * public Edge Function URL. Throws on any failure (no fallback simulation).
 */
export async function generateSimulation(prompt: string): Promise<SimulationSpec> {
  const functionUrl = import.meta.env.VITE_SUPABASE_GENERATE_SIMULATION_URL
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!functionUrl) throw new Error('VITE_SUPABASE_GENERATE_SIMULATION_URL is not configured.')

  const response = await fetch(functionUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(anonKey ? { Authorization: `Bearer ${anonKey}`, apikey: anonKey } : {}),
    },
    body: JSON.stringify({ prompt }),
  })

  const data = (await response.json().catch(() => ({}))) as GenerateSimulationResponse
  if (!response.ok) throw new Error(data.error ?? 'Simulation generation failed.')

  const result = data.result
  if (!result || typeof result.code !== 'string') {
    throw new Error('The AI did not return a simulation.')
  }

  const spec: SimulationSpec = {
    id: slugId(result.title ?? prompt),
    title: result.title ?? 'Interactive Simulation',
    description: result.description ?? 'An AI-generated interactive simulation.',
    prompt,
    code: result.code,
  }

  const validation = validateSimulationSpec(spec)
  if (!validation.ok) throw new Error(validation.errors.join(' '))

  return spec
}
