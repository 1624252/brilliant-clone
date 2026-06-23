import { describe, it, expect } from 'vitest'
import { lessons } from './index'
import { isPredictStep } from '../types'

describe('lesson roadmap integrity', () => {
  it('has unique lesson ids', () => {
    const ids = lessons.map((l) => l.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('has unique, ascending display orders', () => {
    const orders = lessons.map((l) => l.order)
    expect(new Set(orders).size).toBe(orders.length)
    expect(orders).toEqual([...orders].sort((a, b) => a - b))
  })

  it('real lessons have an intro and steps; placeholders have neither', () => {
    for (const l of lessons) {
      if (l.placeholder) {
        expect(l.steps).toHaveLength(0)
      } else {
        expect(l.steps.length).toBeGreaterThan(0)
        expect(l.intro).toBeDefined()
      }
    }
  })

  it('every step has an id and prompt; predict steps have a correct choice', () => {
    for (const l of lessons) {
      for (const step of l.steps) {
        expect(step.id).toBeTruthy()
        expect(step.prompt).toBeTruthy()
        if (isPredictStep(step)) {
          expect(step.choices.length).toBeGreaterThan(1)
          expect(step.choices.some((c) => c.correct)).toBe(true)
        }
      }
    }
  })
})
