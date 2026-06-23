import { useState } from 'react'
import { ProblemRunner, lessons } from './content'
import './App.css'

function App() {
  const [activeId, setActiveId] = useState(lessons[0].id)
  const active = lessons.find((l) => l.id === activeId) ?? lessons[0]

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">LensLab</h1>
        <p className="app__subtitle">Interactive geometric optics</p>
      </header>

      <main className="app__main">
        <nav className="lesson-tabs" aria-label="Lessons">
          {lessons.map((l, i) => (
            <button
              key={l.id}
              type="button"
              className={`lesson-tab ${l.id === activeId ? 'lesson-tab--active' : ''}`}
              aria-current={l.id === activeId}
              onClick={() => setActiveId(l.id)}
            >
              <span className="lesson-tab__num">{i + 1}</span>
              {l.title}
            </button>
          ))}
        </nav>

        <section className="card">
          <h2 className="card__title">{active.title}</h2>
          {/* key resets ProblemRunner state when switching lessons */}
          <ProblemRunner key={active.id} lesson={active} />
        </section>
      </main>
    </div>
  )
}

export default App
