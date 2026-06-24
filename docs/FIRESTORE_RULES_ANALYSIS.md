Firestore rules analysis.

Database: projects/brilliantclone-4d010/databases/(default)
Edition: STANDARD
Type: FIRESTORE_NATIVE
Location: nam5

Client SDK access patterns:
- `users/{uid}` is read with `onSnapshot(doc(...))` and written with `setDoc(..., { merge: true })`.
- `users/{uid}/progress/{lessonId}` is listed with `onSnapshot(collection(...))` and written with `setDoc(..., { merge: true })`.
- No `where`, `orderBy`, or `limit` Firestore queries are used.

Data model:
- `users/{uid}` contains private profile data (`displayName`, `email`), the daily lesson streak, and appearance preferences (`avatarId`, `backgroundId`).
- `users/{uid}/progress/{lessonId}` contains resumable per-lesson progress.

Access model:
- All data is private to the signed-in owner (`request.auth.uid == uid`).
- No public reads are required.

Devil's advocate check:
- Public list/get: denied because every match requires owner auth.
- Cross-user read/write: denied by `request.auth.uid == uid`.
- Schema pollution: denied with `keys().hasOnly(...)` validators.
- Type juggling: denied by validators for strings, numbers, maps, and timestamps.
- Oversized strings: bounded for profile strings, lesson IDs, and local day strings; appearance fields are enum-limited.
- Required omission on progress docs: denied by `keys().hasAll(...)`.
