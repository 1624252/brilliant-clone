# LensLab

An interactive, Brilliant-style learning app for **geometric optics (lenses)**.
Learners manipulate visual simulations (drag an object, move a screen, reshape a
lens), get instant specific feedback, and build real intuition for image
formation. See the [`docs/`](./docs) folder for the full product spec
([`PRD.md`](./docs/PRD.md)), [architecture](./docs/ARCHITECTURE.md), and
[testing guide](./docs/TESTING.md).

- **Stack:** React + TypeScript (Vite) on the front end; Firebase (Auth,
  Firestore, Hosting) for accounts and persistence.
- **Status:** in active development, built in phases.

## Prerequisites

- [Node.js](https://nodejs.org/) 20+ and npm (developed on Node 22 / npm 10).

> **Windows + PowerShell note:** if `npm` fails with "running scripts is
> disabled on this system", allow local scripts once with:
> `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`.

## Getting started

```bash
npm install      # install dependencies
npm run dev      # start the dev server, then open the printed localhost URL
```

## Firebase setup (required for accounts & saved progress)

The web config lives in a git-ignored `.env` (see `.env.example` for the
variable names). To make sign-in and progress-saving work end to end, configure
the Firebase project once in the [console](https://console.firebase.google.com/):

1. **Authentication → Sign-in method:** enable **Email/Password** and **Google**.
   (For Google, pick a support email when prompted.)
2. **Authentication → Settings → Authorized domains:** make sure `localhost` is
   listed (it is by default) so local sign-in works; add your Hosting domain when
   you deploy.
3. **Firestore Database:** create a database (production mode is fine — the rules
   below lock it down per user).
4. **Security rules:** deploy [`firestore.rules`](./firestore.rules). Either paste
   its contents into **Firestore → Rules** in the console, or with the
   [Firebase CLI](https://firebase.google.com/docs/cli):

   ```bash
   npm install -g firebase-tools
   firebase login
   firebase deploy --only firestore:rules --project brilliantclone-4d010
   ```

Each user can read/write only their own `users/{uid}` document and
`users/{uid}/progress/{lessonId}` docs. Lesson content is in the app, not the DB.
The **leaderboard** (`leaderboard/{uid}`) is the one shared collection: any
signed-in user can read it, but each user can only write their own entry, which
holds nothing but a display name and a total correct-answer count.

## Practice problems

Beyond the guided lessons, **Practice** (reached from the roadmap card or a
lesson's finish screen, route `/topics/:topicId/practice`) is an endless,
adaptive question bank that reuses the same interactions as the lessons (drag,
draw-the-rays, predict, curvature):

- **Unlimited & no totals.** Problems are generated from hand-authored,
  deterministic templates (`src/content/practice/`) that randomize friendly
  numbers — there is no AI and no fixed count, so the stream never "runs out"
  and no question total is shown.
- **Adaptive + interleaved.** Per-topic mastery (right/wrong counts) is tracked
  in `users/{uid}.mastery`; weaker topics are surfaced more often, and the same
  topic never repeats back-to-back (`selectNextTopic`).
- **Streak & milestones.** A correct-answer streak plus milestone badges (10/50/
  100 correct, 5/10 in a row) keep the habit loop going; a correct answer also
  advances the daily streak.
- **Leaderboard.** A global ranking of all users by total correct answers.

> **Testing the leaderboard locally:** the dev server talks to the real Firebase
> project (no emulator), so leaderboard reads/writes only work once the updated
> [`firestore.rules`](./firestore.rules) are deployed (`npm run deploy:rules`).
> Everything else (practice problems, mastery, streak, milestones) works locally
> without deploying.

### Deploying

After the one-time console setup above, deploy with the Firebase CLI:

```bash
npm install -g firebase-tools   # if not already installed
firebase login                  # one-time, interactive (opens a browser)
npm run deploy                  # builds, then deploys Hosting + Firestore rules
```

The live site is served at **https://brilliantclone-4d010.web.app** (and the
mirror `https://brilliantclone-4d010.firebaseapp.com`). Both are authorized auth
domains by default, so Google sign-in works there with no extra setup.

### Data model (Firestore)

```
users/{uid}                      displayName, email, createdAt, streak{current,longest,lastActiveDate},
                                 practiceStats{totalAttempts,totalCorrect,questionStreak{...}},
                                 mastery{ [topicId]: {attempts,correct,wrong,lastSeenAt} }
users/{uid}/progress/{lessonId}  status, currentStepIndex, completedAt, updatedAt
leaderboard/{uid}                displayName, totalCorrect, updatedAt   (public read, owner write)
```

## Available scripts

| Script | What it does |
|--------|--------------|
| `npm run dev` | Start the Vite dev server with hot reload. |
| `npm run build` | Type-check (`tsc -b`) and build for production. |
| `npm run preview` | Serve the production build locally. |
| `npm run lint` | Run ESLint over the project. |
| `npm test` | Run the test suite in watch mode. |
| `npm run test:run` | Run the test suite once (CI-style). |
| `npm run test:ui` | Open the Vitest UI in a browser. |
| `npm run coverage` | Run tests and print a coverage report. |
| `npm run deploy` | Build, then deploy Hosting + Firestore rules (needs `firebase login`). |
| `npm run deploy:hosting` | Build and deploy only Hosting. |
| `npm run deploy:rules` | Deploy only the Firestore security rules. |

## Testing

Tests use [Vitest](https://vitest.dev/) with
[React Testing Library](https://testing-library.com/). The setup lives in
`vite.config.ts` (the `test` block) and `src/test/setup.ts`.

- **Run everything once:** `npm run test:run`
- **Watch while developing:** `npm test`
- **Coverage report:** `npm run coverage`

Conventions:

- Unit tests sit next to the code they cover as `*.test.ts` (e.g.
  `src/engine/thinLens.test.ts`).
- Component tests use `*.test.tsx` and render via React Testing Library.
- The optics engine (`src/engine/`) is pure math with no React/DOM
  dependencies, so its tests assert known textbook results directly (for
  example, an object at twice the focal length forms an image of equal size).

## Project structure

```
src/
  engine/        Pure optics math (no React). Image formation, magnification, rays.
  render/        Presentational SVG (LensDiagram, RayFocusAnimation) + scene mapping.
  interactive/   Draggable wrapper around the diagram (LensScene, DrawRaysScene).
  content/       Data-driven lessons, StepView + ProblemRunner, and practice/ templates.
  firebase/      Firebase app/auth/firestore initialization.
  auth/          AuthProvider + useAuth (email/password, Google, persistence).
  data/          Firestore progress/streak/practice/leaderboard read-write + useProgress hook.
  components/    AuthScreen, Home (dashboard), LessonView, PracticeView, Leaderboard.
  test/          Test setup and environment sanity checks.
  App.tsx        Routing: auth → home → lesson.
firestore.rules  Per-user security rules.
firebase.json    Firestore rules + Hosting config.
docs/            Product spec (PRD), architecture, and testing guide.
```

For a deeper dive into how the layers fit together, see
[`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md); for testing details and what's
covered, see [`docs/TESTING.md`](./docs/TESTING.md).
