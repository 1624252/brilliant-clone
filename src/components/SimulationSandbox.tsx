import { useState } from 'react'
import { buildSandboxDoc, type SimulationSpec } from '../ai/simulationContract'
import './SimulationSandbox.css'

interface SimulationSandboxProps {
  spec: SimulationSpec
}

// Runs the generated React component inside a locked-down iframe. The iframe gets
// only `allow-scripts` (opaque origin: no access to the app, cookies, or storage)
// and its CSP blocks all network, so the simulation can animate and handle input
// freely but cannot reach out anywhere.
export function SimulationSandbox({ spec }: SimulationSandboxProps) {
  const [reloadKey, setReloadKey] = useState(0)
  const [expanded, setExpanded] = useState(false)
  const srcDoc = buildSandboxDoc(spec)

  return (
    <div className={`sim-sandbox${expanded ? ' sim-sandbox--expanded' : ''}`}>
      <div className="sim-sandbox__bar">
        <span className="sim-sandbox__label">Interactive simulation</span>
        <div className="sim-sandbox__controls">
          <button
            type="button"
            className="btn"
            onClick={() => setExpanded((value) => !value)}
            aria-pressed={expanded}
          >
            {expanded ? 'Collapse' : 'Expand'}
          </button>
          <button type="button" className="btn" onClick={() => setReloadKey((key) => key + 1)}>
            Restart
          </button>
        </div>
      </div>
      <div className="sim-sandbox__window">
        <iframe
          key={reloadKey}
          title={`${spec.title} interactive simulation`}
          className="sim-sandbox__frame"
          sandbox="allow-scripts"
          srcDoc={srcDoc}
          loading="lazy"
        />
      </div>
    </div>
  )
}
