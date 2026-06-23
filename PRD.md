# Product Requirements Document — "LensLab"

An interactive, Brilliant-style learning app for **geometric optics (lenses)**.

- **Status:** Draft v1 (MVP definition)
- **Last updated:** 2026-06-23
- **Tech stack:** React (Vite + TypeScript), Firebase (Auth, Firestore, Hosting)

---

## 1. Summary

LensLab teaches one focused chapter — **lenses and image formation** — through short, hands-on lessons. Instead of multiple-choice trivia, every step gives the learner a **visual simulation they manipulate directly** (drag an object, move a screen, reshape a lens) and returns **instant, specific feedback** with a short explanation. Progress is **persisted per account** so a learner can leave mid-lesson and resume on any device, and a lightweight **habit loop** (streaks, milestones, lesson completion) keeps them coming back.

The MVP deliberately excludes AI/model calls. All feedback is computed deterministically from a physics engine and per-step rules.

---

## 2. Problem & motivation

Geometric optics is taught with **static diagrams** in textbooks. Learners memorize the thin-lens equation and "real vs. virtual image" rules without building intuition, because they never *move the object and watch the image respond*. Common misconceptions (e.g., "covering half the lens hides half the image") survive because nothing lets students test them.

LensLab fixes this with manipulable simulations and immediate, specific feedback — active learning instead of passive reading.

---

## 3. User persona & domain

### Primary persona (niche, MVP focus)

**The introductory physics student.**

- 16–19 years old, taking **AP Physics 2 / first-year college physics** (or self-studying for it).
- Comfortable with basic algebra; shaky on optics intuition.
- Studies on a **laptop at home** and sometimes reviews on a **phone** between classes.
- Motivated by grades and by "finally getting it"; responds well to streaks and visible progress.
- Frustrated by static textbook diagrams and answer keys that say *what* is right but not *why*.

### User story (primary)

> **As an** intro physics student, **I want to** manipulate lens diagrams and get instant feedback on what I tried, **so that** I build real intuition for image formation and stop memorizing rules I don't understand.

### Domain scope (the "chapter")

**Geometric optics — thin lenses and image formation.** Enough depth for 5–7 short lessons:

- Converging vs. diverging lenses; refraction basics.
- Principal rays and ray tracing.
- Image formation: real/virtual, upright/inverted, magnified/reduced.
- The thin lens equation: \( \tfrac{1}{f} = \tfrac{1}{d_o} + \tfrac{1}{d_i} \).
- Magnification: \( m = -\tfrac{d_i}{d_o} \).
- (Stretch) The lensmaker's equation, chromatic aberration, "cover half the lens."

### Personas explicitly NOT targeted (for MVP)

- Optical engineers / professionals needing aberration modeling, real glass catalogs, or precision tolerances.
- People without an algebra background.
- General "all of physics" learners — we stay niche to lenses, not mechanics/E&M/etc.
- Instructors needing a classroom dashboard, assignment management, or grading exports.

---

## 4. MVP definition

The MVP is the **smallest product that lets the user complete a real, multi-lesson optics chapter with manipulable problems, instant feedback, persistent progress, and a sense of daily momentum — on phone or laptop.**

A build is "MVP-complete" when all of these are true:

1. A learner can **create an account and sign in**.
2. There are **4–7 interactive lessons** on real lens concepts, each a short sequence of steps.
3. **At least one** problem is directly manipulated (drag / slider / plot a point); in practice most are.
4. Every interactive step has a **visual element** (diagram / simulation / responsive chart).
5. Every step gives **instant right/wrong feedback + a short explanation**, and a **hint/explanation on a wrong attempt**.
6. **Progress persists**: a learner can exit mid-lesson and resume the exact step later, on another device.
7. The UI is **responsive**: works and resizes on mobile and desktop.
8. A basic **habit loop** exists: streak counter, lesson-completion celebration, and visible chapter progress.

### Lesson plan (MVP target: 5 lessons; 2 stretch)

| # | Lesson | Core interaction | Concept | MVP? |
|---|--------|------------------|---------|------|
| 1 | **Meet the Lens** | Tap/toggle lens type; drag parallel rays | Converging vs. diverging, focal point | ✅ Core |
| 2 | **Ray Tracing** | Drag object; construct/observe principal rays | Image formation, real vs. virtual | ✅ Core |
| 3 | **The Thin Lens Equation** | Drag screen until sharp ("make it focus") | \( 1/f = 1/d_o + 1/d_i \) | ✅ Core |
| 4 | **Magnification** | Drag object to hit a target magnification | \( m = -d_i/d_o \), size & orientation | ✅ Core |
| 5 | **Cover Half the Lens** | Slide a mask over the lens; predict-then-reveal | Misconception buster; image stays whole, dims | ✅ Core |
| 6 | **The Lensmaker's Equation** | Reshape glass (radii, index) to hit target *f* | \( 1/f = (n-1)(1/R_1 - 1/R_2) \) | ⏳ Stretch |
| 7 | **Chromatic Aberration** | Spread/recombine wavelengths; build a doublet | Dispersion, why colors focus differently | ⏳ Stretch |

---

## 5. In scope vs. out of scope (MVP)

### In scope

- Email/password authentication (+ optionally Google sign-in) and a display name.
- A **content model** (typed lesson/step definitions) so new lessons are added as data, not new code.
- A **shared optics engine** (pure functions) powering all simulations.
- Interactive problem types: **drag-along-axis, slider, toggle/tap, plot-a-point / make-it-focus**.
- Deterministic, rule-based feedback (correct/incorrect + explanation + one hint).
- Per-user progress: current lesson, current step, completed lessons, per-step correctness.
- Habit loop: daily streak, milestone badges (e.g., "first lesson," "chapter complete"), chapter progress bar.
- Responsive layout (mobile + desktop, resizes with window).
- Firebase Hosting deployment.

### Out of scope (MVP — explicitly deferred)

- **Any AI/LLM features** (no model calls, no generated hints, no chatbot).
- Authoring UI / CMS for non-developers (content is added by editing typed config).
- Social features: following, leaderboards, sharing, comments.
- Spaced-repetition scheduling and sophisticated mastery modeling (a *simple* "filled gaps / what's next" suggestion is allowed; adaptive algorithms are not).
- Payments, subscriptions, paywalls.
- Multi-subject catalog (only the lenses chapter exists).
- Offline mode / PWA install, push notifications, native apps.
- Instructor dashboards, classes, assignment management.
- Internationalization / localization.
- Accessibility beyond reasonable defaults (full WCAG audit deferred, though we keep semantics sane).

### User stories NOT focused on (MVP)

- *As an instructor, I want to assign lessons and see my class's scores* — out.
- *As a learner, I want an AI tutor to answer free-form questions* — out.
- *As a learner, I want to compete on a global leaderboard* — out.
- *As a power user, I want to author my own lessons in-app* — out.
- *As a learner, I want the app to schedule reviews via spaced repetition* — out.

---

## 6. Functional requirements

### 6.1 Authentication & accounts
- FR-1: User can sign up with email/password and set a display name.
- FR-2: User can sign in and stay signed in across sessions (persisted auth).
- FR-3: User can sign out.
- FR-4: Unauthenticated users can see the lesson list but must sign in to start (decision: gate progress behind auth so it can persist).

### 6.2 Lessons & interactive steps
- FR-5: The home screen lists the chapter's lessons with locked/unlocked/completed state and a progress indicator.
- FR-6: A lesson is an ordered sequence of steps; each step renders a prompt + a visual + controls.
- FR-7: Each interactive step validates the learner's manipulation against a success rule and shows **instant** correct/incorrect feedback.
- FR-8: A wrong attempt shows a **specific** explanation/hint (not just "incorrect").
- FR-9: On success, the learner advances; on lesson completion, a celebratory summary appears.

### 6.3 Progress & persistence
- FR-10: The app records current lesson, current step index, and per-step result to Firestore.
- FR-11: A learner who exits mid-lesson resumes at the same step on any device after sign-in.
- FR-12: Completed lessons are marked and contribute to chapter progress.

### 6.4 Habit loop
- FR-13: A daily streak increments when the learner completes ≥1 step/lesson on a given day; it resets after a missed day.
- FR-14: Milestone badges unlock (e.g., first lesson done, 3-day streak, chapter complete).
- FR-15: Chapter progress (e.g., "3 / 5 lessons") is visible on the home screen.

### 6.5 Responsiveness
- FR-16: Layouts adapt from ~320px (phone) to desktop; simulations scale with the viewport and remain usable with touch and mouse.

---

## 7. Non-functional requirements

- **Performance:** simulations animate smoothly (target 60fps for drag interactions); engine functions are synchronous and cheap.
- **Reliability:** feedback is deterministic and reproducible; no reliance on network round-trips to validate an answer.
- **Cost:** stays within Firebase free/Spark-tier limits for MVP traffic.
- **Maintainability:** physics engine has zero React/DOM dependencies and is unit-testable; new lessons require only new content config.
- **Security:** Firestore rules restrict each user to reading/writing only their own progress documents.

---

## 8. Architecture overview

Four decoupled layers (dependencies point inward; the engine depends on nothing):

```
content (lesson definitions)  →  interactive (stateful React)  →  render (SVG/canvas)  →  engine (pure math)
                                                                                  firebase/ (isolated, via hooks)
```

| Layer | Responsibility | Examples |
|-------|----------------|----------|
| **engine/** | Pure optics math, no React | `thinLens()`, `magnification()`, `lensmaker()`, principal-ray geometry |
| **render/** | Draw visuals from computed props | `LensShape`, `RayBundle`, `ObjectArrow`, `ApertureMask` |
| **interactive/** | State + input wiring | `Draggable`, `Slider`, `LensScene` |
| **content/** | Typed lesson/step data + runner | `ProblemDefinition`, `ProblemRunner`, lesson configs |
| **firebase/** | Auth + persistence, accessed via hooks | `useAuth()`, `useProgress()` |

**Content model:** each step is a data object (prompt, which values are fixed, which controls are exposed, a `success(state, derived)` predicate, and feedback text). A generic `ProblemRunner` interprets any definition, so adding a lesson = adding config.

---

## 9. Tech stack

- **Frontend:** React 19 + TypeScript, built with Vite. SVG for ray diagrams (resolution-independent, easy to make responsive); canvas reserved for heavier simulations if needed.
- **Styling:** CSS (responsive via fl/grid + relative units); no heavy UI framework required for MVP.
- **Backend-as-a-service:** Firebase
  - **Authentication** — email/password (+ optional Google provider).
  - **Cloud Firestore** — user profiles, progress, streaks (NoSQL document store).
  - **Hosting** — static deploy of the built SPA.
- **Content storage decision (MVP):** lesson content ships as **typed config in the repo** (versioned with code, no read cost, easy to author). Firestore stores only **per-user data**. A future iteration can move content into a Firestore `lessons` collection without changing the content model.

---

## 10. Data schema

### 10.1 Where things live

| Data | Store | Rationale |
|------|-------|-----------|
| Lesson/step **content** | In-app TypeScript config (repo) | Static, versioned, zero read cost, dev-authored |
| User **profile & streak** | Firestore `users/{uid}` | Per-user, small, frequently read |
| Per-lesson **progress** | Firestore `users/{uid}/progress/{lessonId}` | Per-user, resumable, queryable |
| **Auth credentials** | Firebase Auth (managed) | Never stored in our DB |

### 10.2 Content model (in-app types)

```ts
type ControlType = 'drag-axis' | 'slider' | 'toggle' | 'plot-point';

interface Control {
  key: string;            // state key this control writes, e.g. "objectDistance"
  type: ControlType;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
}

interface StepDefinition {
  id: string;
  prompt: string;
  engine: 'thinLens' | 'lensmaker' | 'chromatic';
  fixed: Record<string, number>;          // values the learner can't change
  controls: Control[];                     // values the learner manipulates
  initial: Record<string, number>;         // starting control values
  success: (state: Record<string, number>, derived: EngineOutput) => boolean;
  correctFeedback: string;                 // shown on success
  hint: string;                            // shown on a wrong attempt
  reveal?: 'rays' | 'graph' | 'none';      // feedback visualization
}

interface LessonDefinition {
  id: string;                              // e.g. "thin-lens-equation"
  title: string;
  order: number;
  estMinutes: number;
  steps: StepDefinition[];
}

interface ChapterDefinition {
  id: string;                              // "geometric-optics-lenses"
  title: string;
  lessons: LessonDefinition[];
}
```

### 10.3 Firestore schema (per-user data)

```
users/{uid}
  ├─ displayName: string
  ├─ email: string
  ├─ createdAt: Timestamp
  ├─ streak: {
  │     current: number,          // consecutive active days
  │     longest: number,
  │     lastActiveDate: string    // "YYYY-MM-DD" (user's local day)
  │  }
  ├─ badges: string[]             // e.g. ["first-lesson", "chapter-complete"]
  └─ chapterProgress: {
        chapterId: string,
        lessonsCompleted: number,
        lessonsTotal: number
     }

users/{uid}/progress/{lessonId}      // one doc per lesson
  ├─ lessonId: string
  ├─ status: 'not-started' | 'in-progress' | 'completed'
  ├─ currentStepIndex: number       // for resume
  ├─ steps: {                       // keyed by stepId
  │     [stepId: string]: {
  │        attempts: number,
  │        correct: boolean,
  │        lastAttemptAt: Timestamp
  │     }
  │  }
  ├─ startedAt: Timestamp
  └─ completedAt: Timestamp | null
```

**Example `users/{uid}/progress/thin-lens-equation`:**

```json
{
  "lessonId": "thin-lens-equation",
  "status": "in-progress",
  "currentStepIndex": 2,
  "steps": {
    "intro-make-it-focus": { "attempts": 1, "correct": true,  "lastAttemptAt": "2026-06-23T13:40:00Z" },
    "solve-for-f":         { "attempts": 3, "correct": true,  "lastAttemptAt": "2026-06-23T13:43:00Z" },
    "virtual-image":       { "attempts": 1, "correct": false, "lastAttemptAt": "2026-06-23T13:45:00Z" }
  },
  "startedAt": "2026-06-23T13:39:00Z",
  "completedAt": null
}
```

### 10.4 Security rules (intent)

- A user may read/write only documents under their own `users/{uid}` path (`request.auth.uid == uid`).
- Content is not in Firestore (MVP), so no content read rules are needed.

---

## 11. "What's next / fill gaps" logic (lightweight, MVP)

No ML. A simple rule:

- Recommend the **lowest-order lesson** that is `not-started` or `in-progress`.
- If a completed lesson has any step with `correct: false` (the learner skipped past via hint reveal or got it wrong), surface it as a **"review this"** suggestion before unlocking purely new material.

This satisfies "fill gaps before moving on / recommend what's next" without adaptive modeling.

---

## 12. Success metrics (how we'd judge the MVP)

- **Activation:** % of new accounts that complete Lesson 1.
- **Completion:** % of starters who finish the chapter (≥5 lessons).
- **Retention proxy:** % of users with a streak ≥ 2 days.
- **Resume works:** % of mid-lesson exits that successfully resume at the right step.
- **Feedback quality (qualitative):** learners report the explanations told them *why* they were wrong.

---

## 13. Risks & open questions

- **Drag UX on mobile** for ray diagrams may be fiddly; mitigate with large hit targets and SVG scaling.
- **Streak timezone handling** — store the user's local "YYYY-MM-DD"; decide on a single source of "today."
- **Scope creep into more topics** — resist; lensmaker/chromatic stay as stretch lessons only.
- **Open question:** Google sign-in in addition to email/password for MVP? (Leaning optional.)
- **Open question:** Do we gate later lessons until earlier ones are complete, or allow free navigation? (Leaning: unlock sequentially, allow replay.)

---

## 14. Proposed build order

1. Scaffold the four layers + Firebase config (auth + Firestore).
2. Build the **engine** (`thinLens`, `magnification`) with unit tests.
3. Build **render** + **interactive** `LensScene` and a generic `ProblemRunner`.
4. Ship **Lesson 2 (Ray Tracing)** or **Lesson 3 (Thin Lens)** as the first end-to-end vertical slice (auth → interact → feedback → persist).
5. Add remaining core lessons (1, 4, 5) as content config.
6. Layer in the habit loop (streaks, badges, progress) + responsive polish.
7. Deploy to Firebase Hosting.
8. (Stretch) Lensmaker + chromatic aberration lessons.
