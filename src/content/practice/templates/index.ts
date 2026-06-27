import type { Rng } from '../rng'
import type { Difficulty } from '../scheduling'
import type { PracticeTopicId } from '../topics'
import type { GeneratedProblem, PracticeTemplate } from './types'
import { convexTemplates } from './convex'
import { concaveTemplates } from './concave'
import { curvatureTemplates } from './curvature'
import { rayTracingTemplates } from './rayTracing'
import { thinLensTemplates } from './thinLens'
import { signTemplates } from './signs'

export const templatesByTopic: Record<PracticeTopicId, PracticeTemplate[]> = {
  'convex-images': convexTemplates,
  'concave-images': concaveTemplates,
  curvature: curvatureTemplates,
  'ray-tracing': rayTracingTemplates,
  'thin-lens': thinLensTemplates,
  'sign-conventions': signTemplates,
}

export const allTemplates: PracticeTemplate[] = Object.values(templatesByTopic).flat()

const difficultyOf = (t: PracticeTemplate): Difficulty => t.difficulty ?? 2

/** Templates in a topic whose difficulty is closest to the target. */
function nearestDifficulty(
  list: PracticeTemplate[],
  target: Difficulty,
): PracticeTemplate[] {
  const distances = list.map((t) => Math.abs(difficultyOf(t) - target))
  const min = Math.min(...distances)
  return list.filter((_, i) => distances[i] === min)
}

/**
 * Pick a template within a topic and generate one concrete problem variant.
 * When `target` is given, templates nearest that difficulty are preferred so
 * the scaffold fades (easy → hard) as the learner's mastery box climbs.
 */
export function generateProblem(
  topicId: PracticeTopicId,
  rng: Rng,
  target?: Difficulty,
): GeneratedProblem {
  const list = templatesByTopic[topicId]
  const pool = target ? nearestDifficulty(list, target) : list
  const template = rng.pick(pool)
  return { topicId, templateId: template.id, step: template.generate(rng) }
}
