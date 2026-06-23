import { useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { friendlyAuthError } from '../auth/errors'
import './Settings.css'

type Note = { kind: 'ok' | 'err'; text: string } | null
type Section = 'name' | 'email' | 'password' | null

export function Settings({ onClose }: { onClose: () => void }) {
  const {
    user,
    hasPasswordProvider,
    hasGoogleProvider,
    updateDisplayName,
    changeEmail,
    changePassword,
    addPassword,
  } = useAuth()

  const usesPassword = hasPasswordProvider()
  const usesGoogle = hasGoogleProvider()
  // Email changes need re-authentication; with a password we require it inline.
  const emailEditable = usesPassword

  // Only one field is open for editing at a time (cleaner, less cluttered).
  const [editing, setEditing] = useState<Section>(null)

  const [name, setName] = useState(user?.displayName ?? '')
  const [nameNote, setNameNote] = useState<Note>(null)

  const [email, setEmail] = useState(user?.email ?? '')
  const [emailPw, setEmailPw] = useState('')
  const [emailNote, setEmailNote] = useState<Note>(null)

  const [curPw, setCurPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [pwNote, setPwNote] = useState<Note>(null)

  const [busy, setBusy] = useState(false)

  function open(section: Section) {
    setEditing(section)
    setNameNote(null)
    setEmailNote(null)
    setPwNote(null)
    // Reset inputs to current values when (re)opening.
    setName(user?.displayName ?? '')
    setEmail(user?.email ?? '')
    setEmailPw('')
    setCurPw('')
    setNewPw('')
  }

  async function run(
    fn: () => Promise<void>,
    setNote: (n: Note) => void,
    ok: string,
    closeOnDone = true,
  ) {
    setBusy(true)
    setNote(null)
    try {
      await fn()
      setNote({ kind: 'ok', text: ok })
      if (closeOnDone) setEditing(null)
    } catch (err) {
      setNote({ kind: 'err', text: friendlyAuthError(err) })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="Account settings">
      <div className="modal__backdrop" onClick={onClose} />
      <div className="modal__panel">
        <div className="modal__head">
          <h2 className="modal__title">Account settings</h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="modal__body">
          {/* Sign-in method (read-only): which provider(s) this account uses. */}
          <section className="settings__section">
            <div className="settings__info">
              <span className="settings__label">Sign-in method</span>
              <div className="settings__methods">
                {usesPassword && (
                  <span className="method-badge">
                    <KeyIcon />
                    Email &amp; password
                  </span>
                )}
                {usesGoogle && (
                  <span className="method-badge">
                    <GoogleIcon />
                    Google
                  </span>
                )}
                {!usesPassword && !usesGoogle && (
                  <span className="settings__value">—</span>
                )}
              </div>
            </div>
          </section>

          {/* Display name */}
          <section className="settings__section">
            <div className="settings__line">
              <div className="settings__info">
                <span className="settings__label">Display name</span>
                <span className="settings__value">{user?.displayName || '—'}</span>
              </div>
              {editing !== 'name' && (
                <EditButton label="Edit name" onClick={() => open('name')} />
              )}
            </div>
            {editing === 'name' && (
              <div className="settings__edit">
                <input
                  className="settings__input"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  autoFocus
                />
                <div className="settings__actions">
                  <button
                    type="button"
                    className="btn btn--primary"
                    disabled={busy || !name.trim()}
                    onClick={() =>
                      run(() => updateDisplayName(name), setNameNote, 'Name updated! 🎉')
                    }
                  >
                    Save
                  </button>
                  <button type="button" className="btn" onClick={() => setEditing(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
            <NoteLine note={nameNote} />
          </section>

          {/* Email */}
          <section className="settings__section">
            <div className="settings__line">
              <div className="settings__info">
                <span className="settings__label">Email</span>
                <span className="settings__value">{user?.email || '—'}</span>
              </div>
              {emailEditable && editing !== 'email' && (
                <EditButton label="Edit email" onClick={() => open('email')} />
              )}
            </div>
            {/* Google-only accounts get their email from Google; not editable here. */}
            {!emailEditable && usesGoogle && (
              <p className="settings__hint">
                Your email comes from your Google account. Add a password below to
                manage it here.
              </p>
            )}
            {emailEditable && editing === 'email' && (
              <div className="settings__edit">
                <input
                  className="settings__input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoFocus
                />
                <input
                  className="settings__input"
                  type="password"
                  value={emailPw}
                  onChange={(e) => setEmailPw(e.target.value)}
                  placeholder="Current password (required)"
                  autoComplete="current-password"
                />
                <div className="settings__actions">
                  <button
                    type="button"
                    className="btn btn--primary"
                    disabled={busy || !email.trim() || !emailPw}
                    onClick={() =>
                      run(
                        () => changeEmail(email, emailPw),
                        setEmailNote,
                        'Check your new inbox for a confirmation link to finish the change.',
                        false,
                      )
                    }
                  >
                    Update email
                  </button>
                  <button type="button" className="btn" onClick={() => setEditing(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
            <NoteLine note={emailNote} />
          </section>

          {/* Password */}
          <section className="settings__section">
            <div className="settings__line">
              <div className="settings__info">
                <span className="settings__label">Password</span>
                <span className="settings__value">
                  {usesPassword ? '••••••••' : 'Not set up'}
                </span>
              </div>
              {editing !== 'password' && (
                <EditButton
                  label={usesPassword ? 'Change password' : 'Add password'}
                  onClick={() => open('password')}
                />
              )}
            </div>
            {editing === 'password' && (
              <div className="settings__edit">
                {!usesPassword && usesGoogle && (
                  <p className="settings__hint">
                    You sign in with Google. Add a password to also sign in with your
                    email ({user?.email}).
                  </p>
                )}
                {usesPassword && (
                  <input
                    className="settings__input"
                    type="password"
                    value={curPw}
                    onChange={(e) => setCurPw(e.target.value)}
                    placeholder="Current password"
                    autoComplete="current-password"
                    autoFocus
                  />
                )}
                <input
                  className="settings__input"
                  type="password"
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  placeholder="New password (at least 6 characters)"
                  autoComplete="new-password"
                />
                <div className="settings__actions">
                  <button
                    type="button"
                    className="btn btn--primary"
                    disabled={busy || newPw.length < 6}
                    onClick={() =>
                      usesPassword
                        ? run(
                            () => changePassword(newPw, curPw || undefined),
                            setPwNote,
                            'Password changed! 🔒',
                          )
                        : run(
                            () => addPassword(newPw),
                            setPwNote,
                            'Password added — you can now sign in with your email too! 🎉',
                          )
                    }
                  >
                    {usesPassword ? 'Change password' : 'Add password'}
                  </button>
                  <button type="button" className="btn" onClick={() => setEditing(null)}>
                    Cancel
                  </button>
                </div>
              </div>
            )}
            <NoteLine note={pwNote} />
          </section>
        </div>
      </div>
    </div>
  )
}

function EditButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="settings__edit-btn" onClick={onClick} title={label}>
      <PencilIcon />
      <span>Edit</span>
    </button>
  )
}

function KeyIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 2l-5.5 5.5M15.5 7.5l2 2M11 8a5 5 0 1 0-3 4.6L13 16h2v2h2v2h3v-3l-3.4-3.4A5 5 0 0 0 11 8z"
      />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" width="15" height="15" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"
      />
      <path
        fill="#34A853"
        d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"
      />
      <path
        fill="#FBBC05"
        d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34A21.99 21.99 0 0 0 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7z"
      />
      <path
        fill="#EA4335"
        d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"
      />
    </svg>
  )
}

function PencilIcon() {
  return (
    <svg viewBox="0 0 24 24" width="15" height="15" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4 20h4L18.5 9.5a2.12 2.12 0 0 0-3-3L5 17v3zM13.5 6.5l3 3"
      />
    </svg>
  )
}

function NoteLine({ note }: { note: Note }) {
  if (!note) return null
  return <p className={`settings__note settings__note--${note.kind}`}>{note.text}</p>
}
