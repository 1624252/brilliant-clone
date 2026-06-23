import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Topics } from './Topics'
import { topics } from '../content'
import type { ProgressState } from '../data/useProgress'

const progress: ProgressState = { byLesson: {}, streak: null, loading: false }

describe('Topics landing page', () => {
  it('shows the available topics and a coming-soon hint', () => {
    render(
      <Topics
        displayName="Patrick"
        progress={progress}
        onOpenTopic={() => {}}
        onSignOut={() => {}}
      />,
    )
    expect(screen.getByText(/choose a topic/i)).toBeInTheDocument()
    for (const t of topics) {
      expect(screen.getByText(t.title)).toBeInTheDocument()
    }
    expect(screen.getByText(/more topics coming soon/i)).toBeInTheDocument()
  })

  it('opens a topic when its card is clicked', () => {
    const onOpenTopic = vi.fn()
    render(
      <Topics
        displayName="Patrick"
        progress={progress}
        onOpenTopic={onOpenTopic}
        onSignOut={() => {}}
      />,
    )
    fireEvent.click(screen.getByText(topics[0].title))
    expect(onOpenTopic).toHaveBeenCalledWith(topics[0].id)
  })
})
