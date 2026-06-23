import { chapter } from './lessons'

// Top-level subjects shown on the landing page. Today there's a single available
// topic (the lenses chapter); more can be added here as the course grows.
export interface Topic {
  id: string
  title: string
  blurb: string
  available: boolean
}

export const topics: Topic[] = [
  {
    id: chapter.id,
    title: chapter.title,
    blurb:
      'Discover how lenses bend light to form images — focal points, ray tracing, and the thin lens equation.',
    available: true,
  },
]
