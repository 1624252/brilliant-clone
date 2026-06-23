# Architecture

LensLab is a single-page React app (Vite + TypeScript) backed by Firebase. The
code is organized into clear layers so each concern can be developed and tested
in isolation. The dependency direction always points "downward": UI depends on
content/data, which depend on the pure optics engine — never the reverse.

```
components / App (routing)        UI shell, screens, navigation
        │
content (lessons + ProblemRunner) data-driven lessons, the player
        │
interactive (LensScene)           drag/keyboard wrapper over the diagram
        │
render (LensDiagram, animations)  presentational SVG + scene geometry
        │
engine (optics math)              pure functions, no React/DOM
```

Cross-cutting: `auth/` (authentication), `data/` (Firestore persistence),
`firebase/` (SDK initialization).

## Layers

### `engine/` — optics math (pure)

Pure, framework-free functions that implement the physics:

- `thinLens.ts` — the thin lens equation (`1/f = 1/dₒ + 1/dᵢ`), hardened for the
  extremes (object at the lens → `0`, object at infinity → `f`).
- `magnification.ts` — `m = −dᵢ/dₒ`, with sensible limits at `0`/∞.
- `imageFormation.ts` — combines the above into a classified result
  (real/virtual, upright/inverted, enlarged/reduced, at-infinity).
- `rays.ts` — traces the three principal rays for the diagram, including the
  parallel-beam case for an object at infinity.

Because this layer has no React or DOM dependency, its tests assert known
textbook results directly. This is the most heavily tested part of the app.

### `render/` — presentational SVG

Stateless components that draw what they're told:

- `LensDiagram.tsx` — the labeled optics diagram (lens, candle, rays, image,
  optional measurement overlays).
- `sceneGeometry.ts` — maps optical units (cm) to SVG coordinates.
- `RayFocusAnimation.tsx` / `ConvexLensAnimation.tsx` — the intro explainers.

### `interactive/` — input handling

- `LensScene.tsx` wraps `LensDiagram` and adds pointer-drag and keyboard control
  of the object distance, including drag-to-infinity at the scene edge.
- `snap.ts` snaps values to key points (0, f, 2f, 3f) for easy targeting.

### `content/` — the lessons and the player

- `types.ts` — the lesson content model: `LessonDefinition`, `StepDefinition`
  (an interactive step or a predict-then-reveal step), `Control`, etc.
- `lessons/` — one file per real lesson plus `placeholders.ts` for "coming soon"
  cards. `lessons/index.ts` assembles and orders them; this is the single place
  to register a new lesson.
- `ProblemRunner.tsx` — renders a lesson: intro → steps → completion. It reads
  controls from the step, computes the image via the engine, and gives instant
  feedback. `richText.tsx` renders `**bold**`, `__underline__`, and
  `\frac{a}{b}` markers in lesson copy.

### `data/` — persistence and progress

- `progress.ts` — Firestore reads/writes (`ensureUserDoc`, `saveStepProgress`,
  `completeLesson`, `bumpStreak`).
- `useProgress.ts` — a hook that subscribes to a user's progress in real time.
- `lessonStatus.ts` — derives per-lesson status (locked / unlocked / completed /
  recommended). Real lessons unlock sequentially; placeholders stay locked.

### `auth/` — authentication

- `AuthContext.tsx` — `AuthProvider` + `useAuth`. Wraps Firebase Auth
  (email/password, Google, profile edits, account linking, re-auth).
- `errors.ts` — maps Firebase error codes to friendly messages.

### `components/` + `App.tsx` — UI shell and routing

- `App.tsx` defines the client-side routes with `react-router-dom`:
  - `/login` — `AuthScreen` (redirects home if already signed in)
  - `/` — `Home` roadmap (auth-gated)
  - `/lessons/:lessonId` — `LessonView` → `ProblemRunner` (auth-gated)
  - `/settings` — `Home` with the settings modal open
  - unknown paths redirect to `/`
- An auth guard redirects signed-out users to `/login` and remembers the intended
  page so deep links resume after sign-in. Firebase Hosting rewrites all paths to
  `index.html`, so deep links and refreshes work in production.

## Data flow

1. `AuthProvider` exposes the current user.
2. `useProgress(uid)` subscribes to `users/{uid}/progress/*` in Firestore.
3. `Home` derives the roadmap via `lessonStatus.ts` and links into lessons.
4. `ProblemRunner` plays a lesson, computing outcomes with the `engine` and
   persisting step/lesson progress through `data/progress.ts`.

## Adding a new lesson

1. Create `src/content/lessons/yourLesson.ts` exporting a `LessonDefinition`
   (give it a unique `id`, an `order`, an intro, and steps).
2. Register it in `src/content/lessons/index.ts`.
3. If it needs new interactions or visuals, extend `interactive/`/`render/`.
4. Add tests (engine rules and/or a `ProblemRunner` flow). See
   [`TESTING.md`](./TESTING.md).
