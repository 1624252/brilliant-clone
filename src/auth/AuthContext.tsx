import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  onAuthStateChanged,
  reauthenticateWithCredential,
  reauthenticateWithPopup,
  sendPasswordResetEmail,
  setPersistence,
  browserLocalPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updatePassword,
  updateProfile,
  verifyBeforeUpdateEmail,
  type User,
} from 'firebase/auth'
import { auth } from '../firebase/config'
import { ensureUserDoc } from '../data/progress'

interface AuthContextValue {
  user: User | null
  loading: boolean
  signUp: (name: string, email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  /** Emails a password-reset link to the address (no-op feedback if unknown). */
  resetPassword: (email: string) => Promise<void>
  logout: () => Promise<void>
  /** True when the account can sign in with email/password. */
  hasPasswordProvider: () => boolean
  /** True when the account is linked to Google. */
  hasGoogleProvider: () => boolean
  updateDisplayName: (name: string) => Promise<void>
  /** Sends a verification link to the new address; email changes after the user confirms. */
  changeEmail: (newEmail: string, currentPassword?: string) => Promise<void>
  changePassword: (newPassword: string, currentPassword?: string) => Promise<void>
  /** Add email/password sign-in to a Google-only account (same email). */
  addPassword: (password: string) => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

/**
 * Re-authenticate before sensitive changes (email/password). Uses the password
 * when supplied, otherwise falls back to a Google popup. Firebase requires a
 * recent login for these operations.
 */
async function reauth(user: User, currentPassword?: string): Promise<void> {
  const hasPassword = user.providerData.some((p) => p.providerId === 'password')
  if (hasPassword && currentPassword && user.email) {
    const cred = EmailAuthProvider.credential(user.email, currentPassword)
    await reauthenticateWithCredential(user, cred)
    return
  }
  if (user.providerData.some((p) => p.providerId === 'google.com')) {
    await reauthenticateWithPopup(user, new GoogleAuthProvider())
    return
  }
  // No password provided for a password account: let the caller surface the
  // requires-recent-login error so they can prompt for the current password.
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  // Firebase mutates the same User instance on profile/provider changes, so its
  // reference never changes and React won't re-render. Bump this to force it.
  const [profileVersion, setProfileVersion] = useState(0)
  const refreshProfile = () => setProfileVersion((v) => v + 1)

  useEffect(() => {
    // Keep the user signed in across reloads/tabs.
    void setPersistence(auth, browserLocalPersistence)
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u)
      setLoading(false)
    })
    return unsub
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      loading,
      async signUp(name, email, password) {
        const trimmedEmail = email.trim()
        // Block making a password account for an email that already signs in with
        // Google. (The lookup can be blocked by email-enumeration protection, in
        // which case createUserWithEmailAndPassword still rejects duplicates.)
        let methods: string[] = []
        try {
          methods = await fetchSignInMethodsForEmail(auth, trimmedEmail)
        } catch {
          // Ignore lookup failures; account creation below still enforces uniqueness.
        }
        if (methods.includes('google.com') && !methods.includes('password')) {
          const err = new Error('Use Google to sign in') as Error & { code: string }
          err.code = 'auth/use-google-signin'
          throw err
        }
        const cred = await createUserWithEmailAndPassword(auth, trimmedEmail, password)
        const displayName = name.trim()
        if (displayName) await updateProfile(cred.user, { displayName })
        await ensureUserDoc(cred.user.uid, displayName, trimmedEmail)
      },
      async signIn(email, password) {
        await signInWithEmailAndPassword(auth, email, password)
      },
      async signInWithGoogle() {
        const cred = await signInWithPopup(auth, new GoogleAuthProvider())
        await ensureUserDoc(
          cred.user.uid,
          cred.user.displayName ?? '',
          cred.user.email ?? '',
        )
      },
      async resetPassword(email) {
        await sendPasswordResetEmail(auth, email.trim())
      },
      async logout() {
        await signOut(auth)
      },
      hasPasswordProvider() {
        return !!user?.providerData.some((p) => p.providerId === 'password')
      },
      hasGoogleProvider() {
        return !!user?.providerData.some((p) => p.providerId === 'google.com')
      },
      async updateDisplayName(name) {
        if (!user) throw new Error('Not signed in')
        const displayName = name.trim()
        await updateProfile(user, { displayName })
        await ensureUserDoc(user.uid, displayName, user.email ?? '')
        refreshProfile() // user.displayName mutated in place; re-render consumers
      },
      async changeEmail(newEmail, currentPassword) {
        if (!user) throw new Error('Not signed in')
        await reauth(user, currentPassword)
        // Sends a confirmation link to the new address (applied once verified).
        await verifyBeforeUpdateEmail(user, newEmail.trim())
      },
      async changePassword(newPassword, currentPassword) {
        if (!user) throw new Error('Not signed in')
        await reauth(user, currentPassword)
        await updatePassword(user, newPassword)
      },
      async addPassword(password) {
        if (!user?.email) throw new Error('Not signed in')
        const cred = EmailAuthProvider.credential(user.email, password)
        await linkWithCredential(user, cred)
        await user.reload()
        refreshProfile() // providerData changed (now has a password provider)
      },
    }),
    // profileVersion forces a new value when Firebase mutates the User in place.
    [user, loading, profileVersion],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
