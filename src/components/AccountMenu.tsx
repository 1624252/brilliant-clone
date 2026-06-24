import { useState } from 'react'
import './AccountMenu.css'

interface AccountMenuProps {
  onOpenSettings: () => void
  onSignOut: () => void
}

export function AccountMenu({ onOpenSettings, onSignOut }: AccountMenuProps) {
  const [open, setOpen] = useState(false)

  function choose(action: () => void) {
    setOpen(false)
    action()
  }

  return (
    <div className="account-menu">
      <button
        type="button"
        className="account-menu__toggle"
        aria-label="Account menu"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <span />
        <span />
        <span />
      </button>
      {open && (
        <div className="account-menu__panel" role="menu">
          <button type="button" role="menuitem" onClick={() => choose(onOpenSettings)}>
            Account Settings
          </button>
          <button
            type="button"
            role="menuitem"
            className="account-menu__danger"
            onClick={() => choose(onSignOut)}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
