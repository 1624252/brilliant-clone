import type { ChapterStatus } from './lessonStatus'
import type { Streak } from './progress'

// Milestones are derived entirely from existing progress + streak data (no extra
// Firestore writes). They give the habit loop a sense of achievement alongside
// the daily streak.

export interface Milestone {
  id: string
  label: string
  description: string
  earned: boolean
}

/** How many completed lessons counts as "halfway" through the course. */
const HALFWAY = 3

/**
 * Derive the milestone badges from chapter progress and the streak. Streak
 * badges use the *longest* streak so they stay earned even after a reset.
 */
export function deriveMilestones(
  status: Pick<ChapterStatus, 'completedCount' | 'totalCount'>,
  streak: Streak | null,
): Milestone[] {
  const done = status.completedCount
  const total = status.totalCount
  const best = streak?.longest ?? 0

  return [
    {
      id: 'first-lesson',
      label: 'First light',
      description: 'Finish your first lesson',
      earned: done >= 1,
    },
    {
      id: 'halfway',
      label: 'Halfway there',
      description: `Finish ${HALFWAY} lessons`,
      earned: done >= HALFWAY,
    },
    {
      id: 'course-complete',
      label: 'Course complete',
      description: 'Finish every lesson',
      earned: total > 0 && done >= total,
    },
    {
      id: 'streak-2',
      label: 'Two-day streak',
      description: 'Learn 2 days in a row',
      earned: best >= 2,
    },
    {
      id: 'streak-7',
      label: 'Week-long streak',
      description: 'Learn 7 days in a row',
      earned: best >= 7,
    },
  ]
}

/** IDs of the earned milestones (handy for diffing against last-seen state). */
export const earnedMilestoneIds = (milestones: Milestone[]): string[] =>
  milestones.filter((m) => m.earned).map((m) => m.id)
