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

// The five-lesson roadmap, in display order.
const ALL_LESSON_IDS = [
  'focusing-light',
  'concave-lenses',
  'convex-concave',
  'ray-tracing',
  'thin-lens-equation',
]

describe('deriveChapterStatus', () => {
  it('unlocks only the first real lesson when nothing is done', () => {
    const s = deriveChapterStatus(lessons, {})
    expect(find(s, 'focusing-light').unlocked).toBe(true)
    expect(find(s, 'concave-lenses').unlocked).toBe(false)
    expect(s.recommendedId).toBe('focusing-light')
    expect(s.completedCount).toBe(0)
    expect(s.totalCount).toBe(5) // five real lessons
  })

  it('locks later lessons until earlier ones are completed', () => {
    const s = deriveChapterStatus(lessons, {})
    expect(find(s, 'convex-concave').unlocked).toBe(false)
    expect(find(s, 'ray-tracing').unlocked).toBe(false)
    expect(find(s, 'thin-lens-equation').unlocked).toBe(false)
  })

  it('unlocks the next lesson once the previous is completed', () => {
    const s = deriveChapterStatus(lessons, {
      'focusing-light': completed('focusing-light'),
    })
    expect(find(s, 'focusing-light').completed).toBe(true)
    expect(find(s, 'concave-lenses').unlocked).toBe(true)
    // The lesson two steps ahead stays locked until its predecessor is done.
    expect(find(s, 'convex-concave').unlocked).toBe(false)
    expect(s.recommendedId).toBe('concave-lenses')
    expect(s.completedCount).toBe(1)
  })

  it('recommends nothing once all real lessons are complete', () => {
    const all = Object.fromEntries(
      ALL_LESSON_IDS.map((id) => [id, completed(id)]),
    )
    const s = deriveChapterStatus(lessons, all)
    expect(s.recommendedId).toBeNull()
    expect(s.completedCount).toBe(5)
  })
})
