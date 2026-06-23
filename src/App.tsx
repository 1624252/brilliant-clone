import { useState } from 'react'
import { useAuth } from './auth/AuthContext'
import { useProgress } from './data/useProgress'
import { AuthScreen } from './components/AuthScreen'
import { Home } from './components/Home'
import { LessonView } from './components/LessonView'
import { lessons } from './content'
import './App.css'

function App() {
  const { user, loading, logout } = useAuth()
  const progress = useProgress(user?.uid ?? null)
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null)

  if (loading) {
    return (
      <div className="splash">
        <span className="splash__brand">LensLab</span>
        <span className="splash__hint">Loading…</span>
      </div>
    )
  }

  if (!user) return <AuthScreen />

  const displayName = user.displayName || user.email?.split('@')[0] || 'there'
  const activeLesson = lessons.find((l) => l.id === activeLessonId)

  if (activeLesson && !activeLesson.placeholder) {
    return (
      <LessonView
        lesson={activeLesson}
        uid={user.uid}
        progress={progress}
        onBack={() => setActiveLessonId(null)}
      />
    )
  }

  return (
    <Home
      displayName={displayName}
      progress={progress}
      onOpen={(id) => setActiveLessonId(id)}
      onSignOut={() => {
        setActiveLessonId(null)
        void logout()
      }}
    />
  )
}

export default App
