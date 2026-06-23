import { ProblemRunner, thinLensLesson } from './content'
import './App.css'

function App() {
  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">LensLab</h1>
        <p className="app__subtitle">Interactive geometric optics</p>
      </header>

      <main className="app__main">
        <section className="card">
          <h2 className="card__title">{thinLensLesson.title}</h2>
          <ProblemRunner lesson={thinLensLesson} />
        </section>
      </main>
    </div>
  )
}

export default App
