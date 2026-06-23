import { useEffect, useRef } from 'react'
import './ConfirmDialog.css'

interface ConfirmDialogProps {
  title: string
  message?: string
  confirmLabel?: string
  cancelLabel?: string
  /** 'danger' tints the confirm button for irreversible/leaving actions. */
  tone?: 'default' | 'danger'
  onConfirm: () => void
  onCancel: () => void
}

/** A small modal that asks the user to confirm before a notable action. */
export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'default',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    confirmRef.current?.focus()
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onCancel()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onCancel])

  return (
    <div className="confirm" role="dialog" aria-modal="true" aria-label={title}>
      <div className="confirm__backdrop" onClick={onCancel} />
      <div className="confirm__panel">
        <h2 className="confirm__title">{title}</h2>
        {message && <p className="confirm__msg">{message}</p>}
        <div className="confirm__actions">
          <button type="button" className="btn" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            className={`btn ${tone === 'danger' ? 'btn--danger' : 'btn--primary'}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
