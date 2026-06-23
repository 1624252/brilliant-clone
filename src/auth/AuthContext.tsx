import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  setPersistence,
  browserLocalPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
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
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

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
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        const displayName = name.trim()
        if (displayName) await updateProfile(cred.user, { displayName })
        await ensureUserDoc(cred.user.uid, displayName, email)
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
      async logout() {
        await signOut(auth)
      },
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>')
  return ctx
}
