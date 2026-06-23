# LensLab

An interactive, Brilliant-style learning app for **geometric optics (lenses)**.
Learners manipulate visual simulations (drag an object, move a screen, reshape a
lens), get instant specific feedback, and build real intuition for image
formation. See [`PRD.md`](./PRD.md) for the full product spec.

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
  engine/        Pure optics math (no React). Image formation, magnification.
  test/          Test setup and environment sanity checks.
  App.tsx        App shell (currently the starter template; replaced soon).
PRD.md           Product requirements and data schema.
```

More layers (`render/`, `interactive/`, `content/`, `firebase/`) are added in
later phases as described in the PRD.
