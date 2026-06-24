import {
  collection,
  doc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  type FirestoreError,
} from 'firebase/firestore'
import { db } from '../firebase/config'

// Public leaderboard: one doc per user holding only a display name and the
// total number of correct practice answers. Readable by any signed-in user.

export interface LeaderboardEntry {
  uid: string
  displayName: string
  totalCorrect: number
}

const DEFAULT_LIMIT = 50

/** Live-subscribe to the top entries ranked by total correct answers. */
export function subscribeLeaderboard(
  onChange: (entries: LeaderboardEntry[]) => void,
  onError?: (error: FirestoreError) => void,
  max = DEFAULT_LIMIT,
): () => void {
  const q = query(collection(db, 'leaderboard'), orderBy('totalCorrect', 'desc'), limit(max))
  return onSnapshot(
    q,
    (snap) => {
      onChange(
        snap.docs.map((d) => ({
          uid: d.id,
          displayName: (d.data().displayName as string | undefined) ?? 'Learner',
          totalCorrect: (d.data().totalCorrect as number | undefined) ?? 0,
        })),
      )
    },
    onError,
  )
}

/** Keep the user's public name/score in sync (e.g., after a rename). */
export async function upsertLeaderboardEntry(
  uid: string,
  displayName: string,
  totalCorrect: number,
): Promise<void> {
  await setDoc(
    doc(db, 'leaderboard', uid),
    { displayName, totalCorrect, updatedAt: serverTimestamp() },
    { merge: true },
  )
}
