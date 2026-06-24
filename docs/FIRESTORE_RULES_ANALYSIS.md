Firestore rules analysis for the practice feature.

Database: projects/brilliantclone-4d010/databases/(default)
Edition: STANDARD
Type: FIRESTORE_NATIVE
Location: nam5

Client SDK access patterns:
- `users/{uid}` is read with `onSnapshot(doc(...))` and written with `setDoc(..., { merge: true })`.
- `users/{uid}/progress/{lessonId}` is listed with `onSnapshot(collection(...))` and written with `setDoc(..., { merge: true })`.
- `users/{uid}/practice/{problemId}` is listed with `onSnapshot(collection(...))` and written with `setDoc(..., { merge: true })`.
- No `where`, `orderBy`, or `limit` Firestore queries are used.

Data model:
- `users/{uid}` contains private profile data (`displayName`, `email`), daily streak, and aggregate practice stats.
- `users/{uid}/progress/{lessonId}` contains resumable per-lesson progress.
- `users/{uid}/practice/{problemId}` contains per-problem practice attempts.

Access model:
- All data is private to the signed-in owner (`request.auth.uid == uid`).
- No public reads are required.
- Practice question content remains static TypeScript content and is not stored in Firestore.

Devil's advocate check:
- Public list/get: denied because every match requires owner auth.
- Cross-user read/write: denied by `request.auth.uid == uid`.
- Schema pollution: denied with `keys().hasOnly(...)` validators.
- Type juggling: denied by validators for strings, numbers, booleans, maps, and timestamps.
- Oversized strings: bounded for profile strings, lesson/problem IDs, and local day strings.
- Required omission on progress/practice docs: denied by `keys().hasAll(...)`.
