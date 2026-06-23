import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

describe('test environment sanity checks', () => {
  it('runs plain assertions', () => {
    expect(1 + 1).toBe(2)
  })

  it('has a jsdom DOM available', () => {
    const el = document.createElement('div')
    el.textContent = 'hello'
    expect(el.textContent).toBe('hello')
  })

  it('renders React and exposes jest-dom matchers', () => {
    render(<button>Click me</button>)
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument()
  })
})
