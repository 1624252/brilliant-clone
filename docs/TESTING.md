# Testing

Tests use [Vitest](https://vitest.dev/) with
[React Testing Library](https://testing-library.com/) and
[`@testing-library/jest-dom`](https://github.com/testing-library/jest-dom)
matchers. The runner is configured in `vite.config.ts` (the `test` block) using a
`jsdom` environment, and global setup lives in `src/test/setup.ts`.

## Running tests

```bash
npm run test:run    # run the whole suite once (CI-style)
npm test            # watch mode while developing
npm run test:ui     # interactive Vitest UI in the browser
npm run coverage    # run once and print a coverage report
```

> **Windows + PowerShell:** run these in native PowerShell. If `npm` is blocked by
> the execution policy, allow local scripts once with
> `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`.

## Conventions

- Tests sit **next to the code** they cover: `*.test.ts` for plain logic and
  `*.test.tsx` for anything that renders React.
- Prefer asserting **behavior**, not implementation. Component tests query the
  DOM the way a user would (roles, labels, visible text) via Testing Library.
- The optics engine is pure math, so its tests assert **known textbook results**
  (e.g. an object at `2f` forms an equal-size, inverted, real image).
- When emphasized copy splits text across elements (from `richText`), match on a
  stable substring within a single text node rather than the full phrase.

## What's covered

| Area | Files | Focus |
|------|-------|-------|
| Optics engine | `src/engine/*.test.ts` | Thin lens equation, magnification, image classification, ray tracing, and the `0`/∞ extremes. |
| Scene geometry | `src/render/sceneGeometry.test.ts` | Optical-unit → SVG coordinate mapping. |
| Interactions | `src/interactive/snap.test.ts` | Snapping values to key points (0, f, 2f, 3f). |
| Lesson player | `src/content/ProblemRunner.test.tsx` | Intro/steps/feedback flow, infinity handling, predict-then-reveal. |
| Rich text | `src/content/richText.test.tsx` | `**bold**`, `__underline__`, and `\frac{a}{b}` rendering. |
| Lesson content | `src/content/lessons/lessons.test.ts` | Roadmap integrity (unique ids/orders, real lessons have steps). |
| Auth errors | `src/auth/errors.test.ts` | Firebase error code → friendly message mapping. |
| Progress/data | `src/data/*.test.{ts,tsx}` | Firestore read/write helpers, `useProgress` hook, unlock logic. |
| Environment | `src/test/sanity.test.tsx` | jsdom + jest-dom + React render sanity. |

## Adding tests

- **New engine rule:** add cases to the matching `src/engine/*.test.ts`, asserting
  the expected physical result for representative and edge inputs.
- **New lesson:** add a `ProblemRunner` flow test (render, drive the controls,
  assert the feedback and that "Next"/"Finish" appears) and, if the lesson relies
  on a new success rule, an engine test for that rule.
- **New pure helper:** colocate a `*.test.ts` next to it and cover the happy path
  plus boundaries (empty input, out-of-range, infinity/zero).

Firebase is **not** contacted in tests — the `data/` tests use in-memory fakes of
the Firestore API, so the suite runs offline and deterministically.
