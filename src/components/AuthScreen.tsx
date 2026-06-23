import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthContext'
import { friendlyAuthError } from '../auth/errors'
import { RayFocusExplainer } from '../render'
import './AuthScreen.css'

type Mode = 'signin' | 'signup'

function errorCode(err: unknown): string {
  return typeof err === 'object' && err && 'code' in err ? String(err.code) : ''
}

export function AuthScreen() {
  const { signIn, signUp, signInWithGoogle } = useAuth()
  const [mode, setMode] = useState<Mode>('signup')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  // When sign-up hits an existing email, offer a one-tap switch to sign-in.
  const [suggestSignIn, setSuggestSignIn] = useState(false)
  // When the email already belongs to a Google account, point at the Google button.
  const [suggestGoogle, setSuggestGoogle] = useState(false)
  const [busy, setBusy] = useState(false)

  function switchTo(next: Mode) {
    setMode(next)
    setError('')
    setSuggestSignIn(false)
    setSuggestGoogle(false)
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setSuggestSignIn(false)
    setSuggestGoogle(false)
    setBusy(true)
    try {
      if (mode === 'signup') await signUp(name, email, password)
      else await signIn(email, password)
    } catch (err) {
      setError(friendlyAuthError(err))
      const code = errorCode(err)
      if (code === 'auth/use-google-signin') setSuggestGoogle(true)
      else if (code === 'auth/email-already-in-use') setSuggestSignIn(true)
    } finally {
      setBusy(false)
    }
  }

  async function onGoogle() {
    setError('')
    setSuggestSignIn(false)
    setSuggestGoogle(false)
    setBusy(true)
    try {
      await signInWithGoogle()
    } catch (err) {
      setError(friendlyAuthError(err))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="auth">
      <section className="auth__hero">
        <h1 className="auth__brand">
          <span className="auth__sun" aria-hidden="true">
            ☀️
          </span>
          LensLab
        </h1>
        <p className="auth__tag">
          Play with light! Drag, focus, and watch the rays bend. 🔬
        </p>
        <div className="auth__art">
          <RayFocusExplainer />
        </div>
      </section>

      <section className="auth__panel">
        <div className="auth__card">
          <div className="auth__tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signup'}
              className={`auth__tab ${mode === 'signup' ? 'is-active' : ''}`}
              onClick={() => switchTo('signup')}
            >
              Create account
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'signin'}
              className={`auth__tab ${mode === 'signin' ? 'is-active' : ''}`}
              onClick={() => switchTo('signin')}
            >
              Sign in
            </button>
          </div>

          <form className="auth__form" onSubmit={onSubmit}>
            {mode === 'signup' && (
              <label className="field">
                <span>Display name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Patrick"
                  autoComplete="name"
                  required
                />
              </label>
            )}
            <label className="field">
              <span>Email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </label>
            <label className="field">
              <span>Password</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 6 characters"
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                required
              />
            </label>

            {error && (
              <p className="auth__error" role="alert">
                {error}
                {suggestSignIn && (
                  <>
                    {' '}
                    <button
                      type="button"
                      className="linklike"
                      onClick={() => switchTo('signin')}
                    >
                      Sign in instead
                    </button>
                  </>
                )}
                {suggestGoogle && (
                  <>
                    {' '}
                    <button
                      type="button"
                      className="linklike"
                      onClick={onGoogle}
                      disabled={busy}
                    >
                      Continue with Google
                    </button>
                  </>
                )}
              </p>
            )}

            <button type="submit" className="btn btn--primary btn--block" disabled={busy}>
              {busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : 'Sign in'}
            </button>
          </form>

          <div className="auth__divider">
            <span>or</span>
          </div>

          <button
            type="button"
            className="btn btn--block auth__google"
            onClick={onGoogle}
            disabled={busy}
          >
            <GoogleMark />
            Continue with Google
          </button>

          <p className="auth__switch">
            {mode === 'signup' ? 'Already have an account?' : 'New here?'}{' '}
            <button
              type="button"
              className="linklike"
              onClick={() => switchTo(mode === 'signup' ? 'signin' : 'signup')}
            >
              {mode === 'signup' ? 'Sign in' : 'Create one'}
            </button>
          </p>
        </div>
      </section>
    </div>
  )
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 18 18" width="18" height="18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.85.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  )
}
