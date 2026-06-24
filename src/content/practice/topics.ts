// Practice topics — the dimension along which mastery is tracked. Each topic
// maps to a concept from the five lessons and owns a set of templates that
// generate endless variants reusing the lessons' interactions.

export type PracticeTopicId =
  | 'convex-images'
  | 'concave-images'
  | 'curvature'
  | 'ray-tracing'
  | 'thin-lens'
  | 'sign-conventions'

export interface PracticeTopic {
  id: PracticeTopicId
  label: string
  /** Short description for the mastery strip tooltip. */
  description: string
}

export const practiceTopics: PracticeTopic[] = [
  {
    id: 'convex-images',
    label: 'Convex images',
    description: 'Real, virtual, upright, and inverted images from a converging lens.',
  },
  {
    id: 'concave-images',
    label: 'Concave lenses',
    description: 'A diverging lens always makes a virtual, upright, reduced image.',
  },
  {
    id: 'curvature',
    label: 'Curvature & sign',
    description: 'Lens shape sets the sign and strength of the focal length.',
  },
  {
    id: 'ray-tracing',
    label: 'Ray tracing',
    description: 'Locate the image with the three principal rays.',
  },
  {
    id: 'thin-lens',
    label: 'Thin lens equation',
    description: 'Use f, dₒ, and dᵢ to build magnifiers and projectors.',
  },
  {
    id: 'sign-conventions',
    label: 'Sign conventions',
    description: 'Read image type straight from the signs of dᵢ and m.',
  },
]

export const practiceTopicIds: PracticeTopicId[] = practiceTopics.map((t) => t.id)

export const practiceTopicById: Record<PracticeTopicId, PracticeTopic> = Object.fromEntries(
  practiceTopics.map((t) => [t.id, t]),
) as Record<PracticeTopicId, PracticeTopic>
