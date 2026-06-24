import { useEffect } from 'react'
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
import { Topics } from './components/Topics'
import { LessonView } from './components/LessonView'
import { PracticeView } from './components/PracticeView'
import { Logo } from './components/Logo'
import { lessons, chapter } from './content'
import './App.css'

/** Scroll back to the top whenever the route changes (e.g., opening a lesson). */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

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

function TopicsRoute({ user, progress }: { user: User; progress: ProgressState }) {
  const navigate = useNavigate()
  const { logout } = useAuth()
  const displayName = user.displayName || user.email?.split('@')[0] || 'there'
  return (
    <Topics
      displayName={displayName}
      progress={progress}
      onOpenTopic={(id) => navigate(`/topics/${id}`)}
      // After sign-out the auth guard redirects to /login on its own.
      onSignOut={() => void logout()}
    />
  )
}

function HomeRoute({ user, progress }: { user: User; progress: ProgressState }) {
  const { topicId } = useParams()
  const navigate = useNavigate()
  const { logout } = useAuth()
  // Only the lenses topic exists today; anything else returns to the landing page.
  if (topicId !== chapter.id) return <Navigate to="/" replace />
  const displayName = user.displayName || user.email?.split('@')[0] || 'there'
  return (
    <Home
      uid={user.uid}
      displayName={displayName}
      progress={progress}
      onOpen={(id) => navigate(`/lessons/${id}`)}
      onOpenPractice={() => navigate(`/topics/${chapter.id}/practice`)}
      onBack={() => navigate('/')}
      // After sign-out the auth guard redirects to /login on its own.
      onSignOut={() => void logout()}
    />
  )
}

function PracticeRoute({ user, progress }: { user: User; progress: ProgressState }) {
  const { topicId } = useParams()
  const navigate = useNavigate()
  if (topicId !== chapter.id) return <Navigate to="/" replace />
  return (
    <PracticeView
      uid={user.uid}
      progress={progress}
      onBack={() => navigate(`/topics/${chapter.id}`)}
    />
  )
}

function LessonRoute({ user, progress }: { user: User; progress: ProgressState }) {
  const { lessonId } = useParams()
  const navigate = useNavigate()
  const lesson = lessons.find((l) => l.id === lessonId)
  // Unknown or not-yet-built lessons fall back to the topic roadmap.
  if (!lesson || lesson.placeholder) return <Navigate to={`/topics/${chapter.id}`} replace />
  return (
    <LessonView
      lesson={lesson}
      uid={user.uid}
      progress={progress}
      onBack={() => navigate(`/topics/${chapter.id}`)}
      onOpenLesson={(id) => navigate(`/lessons/${id}`)}
    />
  )
}

function App() {
  const { user, loading } = useAuth()
  const progress = useProgress(user?.uid ?? null)
  const location = useLocation()

  if (loading) return <Splash />

  return (
    <>
    <ScrollToTop />
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to={postLoginPath(location)} replace /> : <AuthScreen />}
      />
      <Route element={<RequireAuth user={user} />}>
        <Route path="/" element={<TopicsRoute user={user!} progress={progress} />} />
        <Route
          path="/topics/:topicId"
          element={<HomeRoute user={user!} progress={progress} />}
        />
        <Route
          path="/lessons/:lessonId"
          element={<LessonRoute user={user!} progress={progress} />}
        />
        <Route
          path="/topics/:topicId/practice"
          element={<PracticeRoute user={user!} progress={progress} />}
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  )
}

export default App
