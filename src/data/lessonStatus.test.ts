import { describe, it, expect } from 'vitest'
import { lessons } from '../content'
import { deriveChapterStatus } from './lessonStatus'
import type { LessonProgress } from './progress'

const completed = (lessonId: string): LessonProgress => ({
  lessonId,
  status: 'completed',
  currentStepIndex: 0,
})

const find = (
  status: ReturnType<typeof deriveChapterStatus>,
  id: string,
) => status.items.find((i) => i.lesson.id === id)!

describe('deriveChapterStatus', () => {
  it('unlocks only the first real lesson when nothing is done', () => {
    const s = deriveChapterStatus(lessons, {})
    expect(find(s, 'focusing-light').unlocked).toBe(true)
    expect(find(s, 'thin-lens-equation').unlocked).toBe(false)
    expect(s.recommendedId).toBe('focusing-light')
    expect(s.completedCount).toBe(0)
    expect(s.totalCount).toBe(2) // two real lessons; placeholders excluded
  })

  it('keeps placeholders locked', () => {
    const s = deriveChapterStatus(lessons, {})
    expect(find(s, 'ray-tracing').unlocked).toBe(false)
    expect(find(s, 'lensmaker').unlocked).toBe(false)
  })

  it('unlocks the next lesson once the previous is completed', () => {
    const s = deriveChapterStatus(lessons, {
      'focusing-light': completed('focusing-light'),
    })
    expect(find(s, 'focusing-light').completed).toBe(true)
    expect(find(s, 'thin-lens-equation').unlocked).toBe(true)
    expect(s.recommendedId).toBe('thin-lens-equation')
    expect(s.completedCount).toBe(1)
  })

  it('recommends nothing once all real lessons are complete', () => {
    const s = deriveChapterStatus(lessons, {
      'focusing-light': completed('focusing-light'),
      'thin-lens-equation': completed('thin-lens-equation'),
    })
    expect(s.recommendedId).toBeNull()
    expect(s.completedCount).toBe(2)
  })
})
