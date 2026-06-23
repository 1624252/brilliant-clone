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
              {editing !== 'email' && (
                <EditButton label="Edit email" onClick={() => open('email')} />
              )}
            </div>
            {editing === 'email' && (
              <div className="settings__edit">
                <input
                  className="settings__input"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoFocus
                />
                {usesPassword && (
                  <input
                    className="settings__input"
                    type="password"
                    value={emailPw}
                    onChange={(e) => setEmailPw(e.target.value)}
                    placeholder="Current password (to confirm it's you)"
                    autoComplete="current-password"
                  />
                )}
                <div className="settings__actions">
                  <button
                    type="button"
                    className="btn btn--primary"
                    disabled={busy || !email.trim()}
                    onClick={() =>
                      run(
                        () => changeEmail(email, emailPw || undefined),
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
