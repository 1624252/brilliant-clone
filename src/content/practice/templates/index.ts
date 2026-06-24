import type { Rng } from '../rng'
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

/** Pick a template within a topic and generate one concrete problem variant. */
export function generateProblem(topicId: PracticeTopicId, rng: Rng): GeneratedProblem {
  const list = templatesByTopic[topicId]
  const template = rng.pick(list)
  return { topicId, templateId: template.id, step: template.generate(rng) }
}
