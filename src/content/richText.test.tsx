import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { renderRich } from './richText'

describe('renderRich', () => {
  it('bolds **text**', () => {
    render(<p>{renderRich('go to **focus** now')}</p>)
    const el = screen.getByText('focus')
    expect(el.tagName).toBe('STRONG')
    expect(el).toHaveClass('rich-b')
  })

  it('underlines __text__', () => {
    render(<p>{renderRich('this is __key__')}</p>)
    const el = screen.getByText('key')
    expect(el.tagName).toBe('U')
  })

  it('renders \\frac{a}{b} as a stacked fraction', () => {
    const { container } = render(<p>{renderRich('ratio \\frac{1}{f} here')}</p>)
    const frac = container.querySelector('.frac--inline')
    expect(frac).not.toBeNull()
    expect(frac?.querySelector('.frac__num')?.textContent).toBe('1')
    expect(frac?.querySelector('.frac__den')?.textContent).toBe('f')
  })

  it('keeps surrounding plain text intact', () => {
    render(<p data-testid="line">{renderRich('a \\frac{1}{f} = \\frac{1}{dₒ} b')}</p>)
    expect(screen.getByTestId('line').textContent).toContain('a')
    expect(screen.getByTestId('line').textContent).toContain('=')
    expect(screen.getByTestId('line').textContent).toContain('b')
  })
})
