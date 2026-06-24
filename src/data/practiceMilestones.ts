import type { PracticeStats } from './practice'

// Practice milestones, derived client-side from aggregate practice stats (no
// extra Firestore writes), mirroring the lesson milestone pattern.

export interface PracticeMilestone {
  id: string
  label: string
  description: string
  earned: boolean
}

export function derivePracticeMilestones(stats: PracticeStats | null): PracticeMilestone[] {
  const correct = stats?.totalCorrect ?? 0
  const bestStreak = stats?.questionStreak?.longest ?? 0
  return [
    { id: 'correct-10', label: 'Sharp eye', description: 'Answer 10 questions correctly', earned: correct >= 10 },
    { id: 'correct-50', label: 'Lens master', description: 'Answer 50 questions correctly', earned: correct >= 50 },
    { id: 'correct-100', label: 'Optics ace', description: 'Answer 100 questions correctly', earned: correct >= 100 },
    { id: 'streak-5', label: 'On a roll', description: '5 correct answers in a row', earned: bestStreak >= 5 },
    { id: 'streak-10', label: 'Unstoppable', description: '10 correct answers in a row', earned: bestStreak >= 10 },
  ]
}

export const earnedPracticeMilestoneIds = (milestones: PracticeMilestone[]): string[] =>
  milestones.filter((m) => m.earned).map((m) => m.id)
