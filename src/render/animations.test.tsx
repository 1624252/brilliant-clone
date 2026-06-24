import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import {
  RayFocusExplainer,
  RaySourceExplainer,
  ConvexLensExplainer,
  ConcaveLensExplainer,
  CurvatureExplainer,
} from './index'

// Each explainer renders an <svg role="img"> plus a Replay button. These guard
// against regressions in the replay wiring: the SVG must render, and clicking
// Replay must remount it without throwing.
const explainers = {
  RayFocusExplainer,
  RaySourceExplainer,
  ConvexLensExplainer,
  ConcaveLensExplainer,
  CurvatureExplainer,
}

describe('replayable explainers', () => {
  for (const [name, Explainer] of Object.entries(explainers)) {
    it(`${name} renders and replays`, () => {
      render(<Explainer />)
      expect(screen.getByRole('img')).toBeInTheDocument()
      const replay = screen.getByRole('button', { name: /replay/i })
      fireEvent.click(replay)
      // Still exactly one diagram after remounting.
      expect(screen.getByRole('img')).toBeInTheDocument()
    })
  }
})
