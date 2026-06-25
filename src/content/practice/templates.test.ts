import { describe, it, expect } from 'vitest'
import { makeRng } from './rng'
import { templatesByTopic } from './templates'
import { objectControl } from './templates/types'
import { practiceTopicIds, type PracticeTopicId } from './topics'
import { isPredictStep, isPlotStep, type InteractiveStep, type StepDefinition } from '../types'
import { formImage, sliderToFocalLength } from '../../engine'

function mergedFocal(step: InteractiveStep): { objectDistance: number; focalLength: number } {
  const merged = { ...(step.fixed ?? {}), ...step.initial }
  const focalLength =
    'curvature' in merged ? sliderToFocalLength(merged.curvature) : merged.focalLength
  return { objectDistance: merged.objectDistance ?? 0, focalLength }
}

/** Is there a control setting that makes this interactive step's success true? */
function isSolvable(step: InteractiveStep): boolean {
  const control = step.controls[0]
  const base = { ...(step.fixed ?? {}), ...step.initial }
  if (control.key === 'curvature') {
    for (let c = control.min; c <= control.max + 1e-9; c += 0.005) {
      const focalLength = sliderToFocalLength(c)
      const state = { ...base, curvature: c }
      if (step.success(state, formImage(base.objectDistance ?? 0, focalLength))) return true
    }
    return false
  }
  // objectDistance control: scan along the axis with a fixed focal length.
  const focalLength = base.focalLength
  for (let d = control.min; d <= 80 + 1e-9; d += 0.25) {
    const state = { ...base, objectDistance: d }
    if (step.success(state, formImage(d, focalLength))) return true
  }
  return false
}

function isInteractive(step: StepDefinition): step is InteractiveStep {
  return !isPredictStep(step) && !isPlotStep(step)
}

describe('practice templates', () => {
  it('allows concave practice object distances to reach zero', () => {
    const concaveControl = objectControl(-20)
    const convexControl = objectControl(20)

    expect(concaveControl.min).toBe(0)
    expect(concaveControl.snaps).toContain(0)
    expect(convexControl.min).toBe(5)
    expect(convexControl.snaps).not.toContain(0)
  })

  for (const topicId of practiceTopicIds) {
    it(`generates valid, solvable problems for "${topicId}"`, () => {
      for (let seed = 0; seed < 200; seed++) {
        const rng = makeRng(seed * 2654435761 + (topicId.length << 8))
        const template = rng.pick(templatesByTopic[topicId as PracticeTopicId])
        const step = template.generate(rng)
        expect(step.id).toBeTruthy()
        expect(step.prompt.length).toBeGreaterThan(0)

        if (isPredictStep(step)) {
          const correct = step.choices.filter((c) => c.correct)
          expect(correct).toHaveLength(1)
        } else if (isPlotStep(step)) {
          expect(Math.abs(step.scene.objectDistance)).toBeGreaterThan(0)
          expect(step.scene.focalLength).not.toBe(0)
          expect(step.plotHalfWidth ?? 0).toBeGreaterThanOrEqual(46)
        } else if (isInteractive(step)) {
          const { objectDistance, focalLength } = mergedFocal(step)
          const image = formImage(objectDistance, focalLength)
          // Nothing should start already solved.
          expect(step.success({ ...(step.fixed ?? {}), ...step.initial }, image)).toBe(false)
          // ...but a valid answer must exist.
          expect(isSolvable(step)).toBe(true)
        }
      }
    })
  }

  it('sign-convention answers match the engine classification', () => {
    const template = templatesByTopic['sign-conventions'][0]
    for (let seed = 0; seed < 200; seed++) {
      const step = template.generate(makeRng(seed + 1))
      if (!isPredictStep(step)) throw new Error('expected predict step')
      const image = formImage(step.scene.objectDistance, step.scene.focalLength)
      const expectedId = image.isReal
        ? 'opposite-inverted'
        : Math.abs(image.magnification) > 1
          ? 'same-upright-large'
          : 'same-upright-small'
      const correct = step.choices.find((c) => c.correct)
      expect(correct?.id).toBe(expectedId)
    }
  })
})
