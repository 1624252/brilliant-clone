import type { LessonProgress, Streak } from './progress'

export type AvatarId = 'initial' | 'candle' | 'lens' | 'prism' | 'rainbow' | 'star'
export type BackgroundId = 'aurora' | 'prism'

export interface AppearancePreferences {
  avatarId: AvatarId
  backgroundId: BackgroundId
}

export interface AvatarOption {
  id: AvatarId
  label: string
  glyph: string
  unlock: 'default' | 'firstLesson' | 'halfway' | 'courseComplete' | 'weekStreak'
}

export interface BackgroundOption {
  id: BackgroundId
  label: string
  description: string
}

export const defaultAppearance: AppearancePreferences = {
  avatarId: 'initial',
  backgroundId: 'aurora',
}

export const avatarOptions: AvatarOption[] = [
  { id: 'initial', label: 'Initial', glyph: 'A', unlock: 'default' },
  { id: 'candle', label: 'Candle', glyph: '', unlock: 'firstLesson' },
  { id: 'lens', label: 'Lens', glyph: '', unlock: 'firstLesson' },
  { id: 'prism', label: 'Prism', glyph: '', unlock: 'halfway' },
  { id: 'rainbow', label: 'Rainbow', glyph: '', unlock: 'courseComplete' },
  { id: 'star', label: 'Star', glyph: '✦', unlock: 'weekStreak' },
]

export const backgroundOptions: BackgroundOption[] = [
  {
    id: 'aurora',
    label: 'Aurora glow',
    description: 'Soft lens-lab glow.',
  },
  {
    id: 'prism',
    label: 'Prism beams',
    description: 'Rainbow beams bend around your pointer.',
  },
]

export function normalizeAppearance(value: Partial<AppearancePreferences> | undefined): AppearancePreferences {
  const avatarId = value?.avatarId
  const backgroundId = value?.backgroundId
  return {
    avatarId: avatarOptions.some((option) => option.id === avatarId)
      ? avatarId!
      : defaultAppearance.avatarId,
    backgroundId: backgroundOptions.some((option) => option.id === backgroundId)
      ? backgroundId!
      : defaultAppearance.backgroundId,
  }
}

export function avatarGlyph(avatarId: AvatarId, fallbackInitial: string) {
  if (avatarId === 'initial') return fallbackInitial
  return avatarOptions.find((option) => option.id === avatarId)?.glyph ?? fallbackInitial
}

export function completedLessonCount(byLesson: Record<string, LessonProgress>) {
  return Object.values(byLesson).filter((lesson) => lesson.status === 'completed').length
}

export function avatarUnlocked(
  option: AvatarOption,
  byLesson: Record<string, LessonProgress>,
  streak: Streak | null,
) {
  const completed = completedLessonCount(byLesson)
  if (option.unlock === 'default') return true
  if (option.unlock === 'firstLesson') return completed >= 1
  if (option.unlock === 'halfway') return completed >= 3
  if (option.unlock === 'courseComplete') return completed >= 5
  return (streak?.longest ?? 0) >= 7
}

export function avatarUnlockText(option: AvatarOption, unlocked: boolean) {
  if (option.unlock === 'default') return 'Available by default.'
  if (option.unlock === 'firstLesson') {
    return unlocked ? 'Unlocked by finishing your first lesson.' : 'Unlock by finishing any lesson.'
  }
  if (option.unlock === 'halfway') {
    return unlocked ? 'Unlocked by reaching halfway.' : 'Unlock by completing 3 lessons.'
  }
  if (option.unlock === 'courseComplete') {
    return unlocked ? 'Unlocked by completing the course.' : 'Unlock by completing all 5 lens lessons.'
  }
  return unlocked ? 'Unlocked by earning a week-long streak.' : 'Unlock with a 7-day streak.'
}
