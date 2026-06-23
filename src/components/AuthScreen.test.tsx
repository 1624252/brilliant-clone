import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

const resetPassword = vi.fn().mockResolvedValue(undefined)

// Stub the auth context and the heavy animation so we can render in isolation.
vi.mock('../auth/AuthContext', () => ({
  useAuth: () => ({
    signIn: vi.fn(),
    signUp: vi.fn(),
    signInWithGoogle: vi.fn(),
    resetPassword,
  }),
}))
vi.mock('../render', () => ({ RayFocusExplainer: () => null }))

import { AuthScreen } from './AuthScreen'

describe('AuthScreen password recovery', () => {
  beforeEach(() => resetPassword.mockClear())

  it('opens the reset view from the sign-in form', () => {
    render(<AuthScreen />)
    fireEvent.click(screen.getByRole('tab', { name: /sign in/i }))
    fireEvent.click(screen.getByRole('button', { name: /forgot password/i }))
    expect(screen.getByText(/reset your password/i)).toBeInTheDocument()
  })

  it('sends a reset link and confirms', async () => {
    render(<AuthScreen />)
    fireEvent.click(screen.getByRole('tab', { name: /sign in/i }))
    fireEvent.click(screen.getByRole('button', { name: /forgot password/i }))

    const email = screen.getByPlaceholderText(/you@example\.com/i)
    fireEvent.change(email, { target: { value: 'patrick@example.com' } })
    fireEvent.click(screen.getByRole('button', { name: /send reset link/i }))

    expect(resetPassword).toHaveBeenCalledWith('patrick@example.com')
    expect(await screen.findByRole('status')).toHaveTextContent(/we’ve sent a link/i)
  })
})
