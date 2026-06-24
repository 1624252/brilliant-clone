// Public surface of the practice content layer.
export {
  practiceTopics,
  practiceTopicIds,
  practiceTopicById,
  type PracticeTopic,
  type PracticeTopicId,
} from './topics'
export { makeRng, liveRng, type Rng } from './rng'
export {
  selectNextTopic,
  topicWeight,
  type MasteryLike,
  type TopicMasteryLike,
} from './select'
export { generateProblem, templatesByTopic, allTemplates } from './templates'
export type { PracticeTemplate, GeneratedProblem } from './templates/types'
