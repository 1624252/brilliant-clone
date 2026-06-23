import {
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  type Location,
} from 'react-router-dom'
import type { User } from 'firebase/auth'
import { useAuth } from './auth/AuthContext'
import { useProgress, type ProgressState } from './data/useProgress'
import { AuthScreen } from './components/AuthScreen'
import { Home } from './components/Home'
import { LessonView } from './components/LessonView'
import { Logo } from './components/Logo'
import { lessons } from './content'
import './App.css'

function Splash() {
  return (
    <div className="splash">
      <Logo size={44} className="splash__brand" />
      <span className="splash__hint">Loading…</span>
    </div>
  )
}

/** Where to send a freshly signed-in user: back to the page they first asked for. */
function postLoginPath(location: Location): string {
  const from = (location.state as { from?: Location } | null)?.from
  return from?.pathname && from.pathname !== '/login' ? from.pathname : '/'
}

/** Gate for authed-only routes: bounce to /login and remember the intended page. */
function RequireAuth({ user }: { user: User | null }) {
  const location = useLocation()
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}

function HomeRoute({
  user,
  progress,
  settingsOpen = false,
}: {
  user: User
  progress: ProgressState
  settingsOpen?: boolean
}) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const displayName = user.displayName || user.email?.split('@')[0] || 'there'
  return (
    <Home
      displayName={displayName}
      progress={progress}
      settingsOpen={settingsOpen}
      onOpenSettings={() => navigate('/settings')}
      onCloseSettings={() => navigate('/')}
      onOpen={(id) => navigate(`/lessons/${id}`)}
      // After sign-out the auth guard redirects to /login on its own.
      onSignOut={() => void logout()}
    />
  )
}

function LessonRoute({ user, progress }: { user: User; progress: ProgressState }) {
  const { lessonId } = useParams()
  const navigate = useNavigate()
  const lesson = lessons.find((l) => l.id === lessonId)
  // Unknown or not-yet-built lessons fall back to the roadmap.
  if (!lesson || lesson.placeholder) return <Navigate to="/" replace />
  return (
    <LessonView
      lesson={lesson}
      uid={user.uid}
      progress={progress}
      onBack={() => navigate('/')}
    />
  )
}

function App() {
  const { user, loading } = useAuth()
  const progress = useProgress(user?.uid ?? null)
  const location = useLocation()

  if (loading) return <Splash />

  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to={postLoginPath(location)} replace /> : <AuthScreen />}
      />
      <Route element={<RequireAuth user={user} />}>
        <Route path="/" element={<HomeRoute user={user!} progress={progress} />} />
        <Route
          path="/settings"
          element={<HomeRoute user={user!} progress={progress} settingsOpen />}
        />
        <Route
          path="/lessons/:lessonId"
          element={<LessonRoute user={user!} progress={progress} />}
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
