import { focalLengthFrom, imageDistance, magnification } from '../../engine'
import type { Choice } from '../types'
import type {
  CalculationProblem,
  ChoicePracticeProblem,
  PracticeCategory,
  PracticeProblem,
} from './types'

type DistancePair = readonly [focalLength: number, objectDistance: number]
type HeightCase = readonly [focalLength: number, objectDistance: number, objectHeight: number]
type FindFCase = readonly [objectDistance: number, imageDistance: number]
type FindDoCase = readonly [focalLength: number, imageDistance: number]
type LandmarkCase = readonly [
  focalLength: number,
  objectDistance: number,
  zone: 'infinity' | 'beyond-2f' | 'at-2f' | 'between-f-2f' | 'inside-f' | 'at-f',
]

const round2 = (n: number) => Math.round(n * 100) / 100
const signed = (n: number) => (n > 0 ? `+${formatNumber(n)}` : formatNumber(n))
const formatNumber = (n: number) => (Number.isInteger(n) ? String(n) : String(round2(n)))
const cm = (n: number) => `${signed(n)} cm`
const positiveCm = (n: number) => `${formatNumber(n)} cm`
const templateIds = new Set<string>()

function gcd(a: number, b: number): number {
  let x = Math.abs(Math.round(a))
  let y = Math.abs(Math.round(b))
  while (y) [x, y] = [y, x % y]
  return x || 1
}

function ratioText(numerator: number, denominator: number) {
  if (denominator === 0) return 'undefined'
  const sign = numerator * denominator < 0 ? '-' : ''
  const n = Math.abs(Math.round(numerator))
  const d = Math.abs(Math.round(denominator))
  const divisor = gcd(n, d)
  const simpleN = n / divisor
  const simpleD = d / divisor
  if (simpleD === 1) return `${sign}${simpleN}`
  return `${sign}\\frac{${simpleN}}{${simpleD}}`
}

function decimalFriendly(value: number) {
  return Number.isInteger(value) ? String(value) : ratioText(Math.round(value * 100), 100)
}

function withMeta<T extends PracticeProblem>(
  problem: T,
  templateId: string,
  variantIndex: number,
  category: PracticeCategory,
): T {
  templateIds.add(templateId)
  return {
    ...problem,
    category,
    templateId,
    variantIndex,
    noCalculator: true,
  }
}

function imageHeight(objectDistance: number, focalLength: number, objectHeight: number) {
  return magnification(objectDistance, imageDistance(objectDistance, focalLength)) * objectHeight
}

const warmup: CalculationProblem = withMeta(
  {
    id: 'convex-image-distance-30-10',
    title: 'Warm-up: find the image distance',
    prompt:
      'A convex lens has focal length 10 cm. A candle is placed 30 cm from the lens. What is the image distance d_i?',
    givens: [
      { symbol: 'f', label: 'Focal length', value: '+10 cm' },
      { symbol: 'd_o', label: 'Object distance', value: '30 cm' },
    ],
    equationParts: [
      {
        id: 'f',
        label: 'f',
        prompt: 'Focal length blank',
        answer: 10,
        tolerance: 0.1,
        unit: 'cm',
        feedback: 'f = 10 cm, copied directly from the lens focal length.',
      },
      {
        id: 'do',
        label: 'd_o',
        prompt: 'Object distance blank',
        answer: 30,
        tolerance: 0.1,
        unit: 'cm',
        feedback: 'd_o = 30 cm, the distance from the candle to the lens.',
      },
      {
        id: 'di',
        label: 'd_i',
        prompt: 'Image distance blank',
        answer: 15,
        tolerance: 0.2,
        unit: 'cm',
        feedback: 'd_i = 15 cm makes \\frac{1}{10}=\\frac{1}{30}+\\frac{1}{15}.',
      },
    ],
    scene: { objectDistance: 30, focalLength: 10 },
    answer: imageDistance(30, 10),
    unit: 'cm',
    tolerance: 0.2,
    solution:
      'Use \\frac{1}{f}=\\frac{1}{d_o}+\\frac{1}{d_i}. Then \\frac{1}{d_i}=\\frac{1}{10}-\\frac{1}{30}=\\frac{2}{30}, so d_i=15 cm. The positive value means a **real** image forms on the far side of the lens.',
    solutionSteps: [
      'Write the thin-lens equation: \\frac{1}{f}=\\frac{1}{d_o}+\\frac{1}{d_i}.',
      'Substitute the givens: \\frac{1}{10}=\\frac{1}{30}+\\frac{1}{d_i}.',
      'Move the object term: \\frac{1}{d_i}=\\frac{1}{10}-\\frac{1}{30}=\\frac{2}{30}.',
      'Invert the reciprocal to get d_i=15 cm, a positive **real** image distance.',
    ],
    hint:
      'Write the equation first, then move \\frac{1}{d_o} to the other side: \\frac{1}{d_i}=\\frac{1}{f}-\\frac{1}{d_o}.',
    measures: { f: true, do: true, di: true },
  },
  'convex-di',
  0,
  'calculate',
)

function imageDistanceProblem([f, objectDistance]: DistancePair, index: number): CalculationProblem {
  const answer = imageDistance(objectDistance, f)
  const lensName = f > 0 ? 'convex' : 'concave'
  const isVirtual = answer < 0
  const templateId = f > 0 ? (objectDistance < f ? 'convex-virtual-di' : 'convex-real-di') : 'concave-di'
  return withMeta(
    {
      id: `${templateId}:seed-${String(index).padStart(3, '0')}`,
      title: isVirtual ? 'Find a virtual image distance' : 'Find a real image distance',
      prompt: `A ${lensName} lens has f = ${cm(f)}. The candle is at d_o = ${positiveCm(
        objectDistance,
      )}. What is d_i? Include the sign.`,
      givens: [
        { symbol: 'f', label: 'Focal length', value: cm(f) },
        { symbol: 'd_o', label: 'Object distance', value: positiveCm(objectDistance) },
      ],
      scene: { objectDistance, focalLength: f, draggable: f > 0 && objectDistance < f },
      answer: round2(answer),
      unit: 'cm',
      tolerance: 0.08,
      solution: `\\frac{1}{d_i}=\\frac{1}{${formatNumber(f)}}-\\frac{1}{${formatNumber(
        objectDistance,
      )}}, so d_i=${formatNumber(round2(answer))} cm. ${
        isVirtual ? 'The negative sign means a **virtual** image.' : 'The positive sign means a **real** image.'
      }`,
      solutionSteps: [
        'Start from \\frac{1}{d_i}=\\frac{1}{f}-\\frac{1}{d_o}.',
        `Substitute f=${formatNumber(f)} cm and d_o=${formatNumber(objectDistance)} cm.`,
        `Invert the reciprocal to get d_i=${formatNumber(round2(answer))} cm.`,
        isVirtual
          ? 'Negative d_i means the image is on the candle side: **virtual**.'
          : 'Positive d_i means the image is on the far side: **real**.',
      ],
      hint:
        f < 0
          ? 'Keep the focal length negative for a concave lens; d_i should also be negative.'
          : objectDistance < f
            ? 'Inside the focus, a convex lens gives a negative image distance.'
            : 'Move \\frac{1}{d_o} to the other side, then invert the final reciprocal.',
      measures: { f: true, do: true, di: true },
    },
    templateId,
    index,
    f > 0 && objectDistance < f ? 'signs' : 'calculate',
  )
}

function magnificationProblem([f, objectDistance]: DistancePair, index: number): CalculationProblem {
  const di = imageDistance(objectDistance, f)
  const answer = magnification(objectDistance, di)
  const templateId = answer > 0 ? 'upright-magnification' : 'inverted-magnification'
  return withMeta(
    {
      id: `${templateId}:seed-${String(index).padStart(3, '0')}`,
      title: 'Find the magnification',
      prompt: `A lens has f = ${cm(f)} and d_o = ${positiveCm(
        objectDistance,
      )}. What is the magnification m? Include the sign.`,
      givens: [
        { symbol: 'f', label: 'Focal length', value: cm(f) },
        { symbol: 'd_o', label: 'Object distance', value: positiveCm(objectDistance) },
      ],
      scene: { objectDistance, focalLength: f, draggable: f > 0 && objectDistance < f },
      answer: round2(answer),
      unit: '',
      tolerance: 0.03,
      solution: `First d_i=${formatNumber(round2(di))} cm. Then m=-\\frac{d_i}{d_o}=-\\frac{${formatNumber(
        round2(di),
      )}}{${formatNumber(objectDistance)}}=${decimalFriendly(round2(answer))}.`,
      solutionSteps: [
        `Use the lens equation to get d_i=${formatNumber(round2(di))} cm.`,
        'Use m=-\\frac{d_i}{d_o}.',
        `Compute m=${decimalFriendly(round2(answer))}.`,
        answer < 0 ? 'Negative m means inverted.' : 'Positive m means upright.',
      ],
      hint:
        'Find d_i first, then use m=-\\frac{d_i}{d_o}. The sign tells upright or inverted.',
      measures: { do: true, di: true, m: true },
    },
    templateId,
    index,
    answer > 0 ? 'signs' : 'calculate',
  )
}

function heightProblem([f, objectDistance, objectHeight]: HeightCase, index: number): CalculationProblem {
  const di = imageDistance(objectDistance, f)
  const m = magnification(objectDistance, di)
  const answer = imageHeight(objectDistance, f, objectHeight)
  const templateId = answer > 0 ? 'upright-height' : 'inverted-height'
  return withMeta(
    {
      id: `${templateId}:seed-${String(index).padStart(3, '0')}`,
      title: 'Find the image height',
      prompt: `A ${positiveCm(objectHeight)} tall candle sits at d_o = ${positiveCm(
        objectDistance,
      )} from a lens with f = ${cm(f)}. What is h_i? Include the sign.`,
      givens: [
        { symbol: 'f', label: 'Focal length', value: cm(f) },
        { symbol: 'd_o', label: 'Object distance', value: positiveCm(objectDistance) },
        { symbol: 'h_o', label: 'Object height', value: cm(objectHeight) },
      ],
      scene: { objectDistance, focalLength: f, objectHeight: objectHeight * 4, draggable: f > 0 },
      answer: round2(answer),
      unit: 'cm',
      tolerance: 0.08,
      solution: `Here d_i=${formatNumber(round2(di))} cm and m=${decimalFriendly(
        round2(m),
      )}. So h_i=m h_o=${formatNumber(round2(answer))} cm.`,
      solutionSteps: [
        `Find d_i=${formatNumber(round2(di))} cm.`,
        `Compute m=-\\frac{d_i}{d_o}=${decimalFriendly(round2(m))}.`,
        `Multiply by h_o=${formatNumber(objectHeight)} cm.`,
        `So h_i=${formatNumber(round2(answer))} cm.`,
      ],
      hint: 'Height uses the same sign as magnification: h_i=m h_o.',
      measures: { f: true, do: true, di: true, m: true },
    },
    templateId,
    index,
    'calculate',
  )
}

function focalLengthProblem([objectDistance, di]: FindFCase, index: number): CalculationProblem {
  const f = focalLengthFrom(objectDistance, di)
  return withMeta(
    {
      id: `find-f:seed-${String(index).padStart(3, '0')}`,
      title: 'Find the focal length',
      prompt: `A candle is ${positiveCm(objectDistance)} from a lens and its image forms at d_i = ${cm(
        di,
      )}. What is f?`,
      givens: [
        { symbol: 'd_o', label: 'Object distance', value: positiveCm(objectDistance) },
        { symbol: 'd_i', label: 'Image distance', value: cm(di) },
      ],
      scene: { objectDistance, focalLength: f },
      answer: round2(f),
      unit: 'cm',
      tolerance: 0.08,
      solution: `\\frac{1}{f}=\\frac{1}{${formatNumber(objectDistance)}}+\\frac{1}{${formatNumber(
        di,
      )}}, so f=${formatNumber(round2(f))} cm.`,
      solutionSteps: [
        'Use \\frac{1}{f}=\\frac{1}{d_o}+\\frac{1}{d_i}.',
        'Substitute both distances with their signs.',
        `Invert the result to get f=${formatNumber(round2(f))} cm.`,
        f > 0 ? 'Positive f means convex.' : 'Negative f means concave.',
      ],
      hint: 'When solving for f, add the two reciprocal distances first.',
      measures: { f: true, do: true, di: true },
    },
    'find-f',
    index,
    'calculate',
  )
}

function objectDistanceProblem([f, di]: FindDoCase, index: number): CalculationProblem {
  const objectDistance = 1 / (1 / f - 1 / di)
  return withMeta(
    {
      id: `find-do:seed-${String(index).padStart(3, '0')}`,
      title: 'Find the candle position',
      prompt: `A lens has f = ${cm(f)} and forms an image at d_i = ${cm(
        di,
      )}. What object distance d_o makes that happen?`,
      givens: [
        { symbol: 'f', label: 'Focal length', value: cm(f) },
        { symbol: 'd_i', label: 'Image distance', value: cm(di) },
      ],
      scene: { objectDistance, focalLength: f, draggable: true },
      answer: round2(objectDistance),
      unit: 'cm',
      tolerance: 0.08,
      solution: `\\frac{1}{d_o}=\\frac{1}{${formatNumber(f)}}-\\frac{1}{${formatNumber(
        di,
      )}}, so d_o=${formatNumber(round2(objectDistance))} cm.`,
      solutionSteps: [
        'Rearrange to \\frac{1}{d_o}=\\frac{1}{f}-\\frac{1}{d_i}.',
        'Substitute f and d_i with their signs.',
        `Invert to get d_o=${formatNumber(round2(objectDistance))} cm.`,
      ],
      hint: 'Keep image distance signs: real images use positive d_i, virtual images use negative d_i.',
      measures: { f: true, do: true, di: true },
    },
    'find-do',
    index,
    'calculate',
  )
}

function convexLandmarkChoice([f, objectDistance, zone]: LandmarkCase, index: number): ChoicePracticeProblem {
  const zoneCopy = {
    infinity: 'a faraway object',
    'beyond-2f': `d_o = ${positiveCm(objectDistance)}, beyond **2 focus**`,
    'at-2f': `d_o = ${positiveCm(objectDistance)}, at **2 focus**`,
    'between-f-2f': `d_o = ${positiveCm(objectDistance)}, between **focus** and **2 focus**`,
    'inside-f': `d_o = ${positiveCm(objectDistance)}, inside **focus**`,
    'at-f': `d_o = ${positiveCm(objectDistance)}, exactly at **focus**`,
  }[zone]
  const correct = {
    infinity: 'At the **focus**',
    'beyond-2f': '**Real**, inverted, reduced, between **focus** and **2 focus**',
    'at-2f': '**Real**, inverted, same size, at **2 focus**',
    'between-f-2f': '**Real**, inverted, enlarged, beyond **2 focus**',
    'inside-f': '**Virtual**, upright, enlarged',
    'at-f': 'No finite image; outgoing rays are parallel',
  }[zone]
  const choices: Choice[] = [
    {
      id: 'correct',
      label: correct,
      correct: true,
      feedback: 'Yes. Match the object position to the convex-lens landmark pattern.',
    },
    {
      id: 'concave-rule',
      label: '**Virtual**, upright, reduced',
      feedback: 'That is the concave-lens rule, not this convex setup.',
    },
    {
      id: 'wrong-landmark',
      label: '**Real**, inverted, same size, at **2 focus**',
      feedback: 'Same-size only happens when the object itself is at **2 focus**.',
    },
  ]
  return withMeta(
    {
      kind: 'choice',
      id: `convex-landmark:seed-${String(index).padStart(3, '0')}`,
      title: 'Predict the convex image',
      prompt: `A convex lens has f = ${positiveCm(f)}. The object is ${zoneCopy}. What image should you expect?`,
      givens: [
        { symbol: 'f', label: 'Focal length', value: cm(f) },
        {
          symbol: 'd_o',
          label: 'Object distance',
          value: Number.isFinite(objectDistance) ? positiveCm(objectDistance) : 'Infinity',
        },
      ],
      scene: { objectDistance, focalLength: f, draggable: Number.isFinite(objectDistance) },
      draggable: Number.isFinite(objectDistance),
      choices,
      hint: 'First place the object relative to F and 2F, then recall the matching image pattern.',
      solution: `This is the ${zone.replaceAll('-', ' ')} case, so the image is: ${correct}.`,
      solutionSteps: [
        `Mark F=${formatNumber(f)} cm and 2F=${formatNumber(2 * f)} cm.`,
        'Compare the object distance to those landmarks.',
        `Choose the matching convex-lens pattern: ${correct}.`,
      ],
      measures: { f: true, do: true, di: true, m: true },
    },
    'convex-landmark',
    index,
    'predict',
  )
}

function concaveChoice(f: number, objectDistance: number, index: number): ChoicePracticeProblem {
  return withMeta(
    {
      kind: 'choice',
      id: `concave-invariant:seed-${String(index).padStart(3, '0')}`,
      title: 'Concave lens invariant',
      prompt: `A concave lens has f = ${cm(f)} and a candle at d_o = ${positiveCm(
        objectDistance,
      )}. Which description is always true for this real object?`,
      givens: [
        { symbol: 'f', label: 'Focal length', value: cm(f) },
        { symbol: 'd_o', label: 'Object distance', value: positiveCm(objectDistance) },
      ],
      scene: { objectDistance, focalLength: f, draggable: true },
      draggable: true,
      choices: [
        {
          id: 'virtual-upright-reduced',
          label: '**Virtual**, upright, reduced',
          correct: true,
          feedback: 'Correct. Concave lenses spread real-object rays, so only back-traces meet.',
        },
        {
          id: 'real-inverted',
          label: '**Real**, inverted, enlarged',
          feedback: 'That is a convex projector pattern. Concave lenses do not project real images of real objects.',
        },
        {
          id: 'same-size',
          label: 'Same size at **2 focus**',
          feedback: 'The 2F same-size rule belongs to convex lenses.',
        },
      ],
      hint: 'For every real object, a concave lens gives the same kind of image.',
      solution: 'A concave lens makes a **virtual**, upright, reduced image for every real object.',
      solutionSteps: [
        'Negative f means the lens is concave.',
        'Concave lenses diverge the outgoing rays.',
        'The dotted back-traces meet on the candle side.',
        'That makes the image **virtual**, upright, and reduced.',
      ],
      measures: { f: true, do: true, di: true, m: true },
    },
    'concave-invariant',
    index,
    'predict',
  )
}

const convexDistanceCases: DistancePair[] = [
  [6, 12],
  [6, 18],
  [8, 12],
  [8, 16],
  [8, 24],
  [10, 15],
  [10, 20],
  [10, 30],
  [12, 18],
  [12, 24],
  [12, 36],
  [15, 30],
  [15, 45],
  [18, 27],
  [18, 36],
  [20, 30],
  [20, 40],
  [20, 60],
  [8, 4],
  [10, 6],
  [12, 8],
  [15, 9],
  [18, 12],
  [20, 12],
]

const concaveDistanceCases: DistancePair[] = [
  [-6, 6],
  [-6, 12],
  [-8, 8],
  [-8, 16],
  [-10, 10],
  [-10, 20],
  [-12, 12],
  [-12, 24],
  [-15, 15],
  [-15, 30],
  [-18, 18],
  [-18, 36],
  [-20, 20],
  [-20, 40],
]

const heightCases: HeightCase[] = [
  [10, 15, 4],
  [12, 18, 3],
  [8, 12, 5],
  [15, 30, 6],
  [20, 60, 8],
  [10, 6, 2],
  [12, 8, 3],
  [20, 12, 4],
  [-10, 20, 6],
  [-12, 24, 9],
  [-15, 30, 6],
  [-18, 36, 12],
]

const findFCases: FindFCase[] = [
  [12, 12],
  [16, 16],
  [20, 20],
  [24, 24],
  [30, 30],
  [12, 24],
  [18, 36],
  [20, 60],
  [30, 15],
  [24, -12],
  [30, -15],
  [40, -20],
]

const findDoCases: FindDoCase[] = [
  [8, 24],
  [10, 20],
  [10, 30],
  [12, 24],
  [12, 36],
  [15, 30],
  [20, 60],
  [20, -30],
  [-10, -5],
  [-12, -6],
  [-15, -10],
  [-20, -10],
]

const landmarkCases: LandmarkCase[] = [
  [8, Infinity, 'infinity'],
  [10, Infinity, 'infinity'],
  [12, 36, 'beyond-2f'],
  [15, 45, 'beyond-2f'],
  [10, 20, 'at-2f'],
  [12, 24, 'at-2f'],
  [10, 15, 'between-f-2f'],
  [20, 30, 'between-f-2f'],
  [10, 6, 'inside-f'],
  [20, 12, 'inside-f'],
  [8, 8, 'at-f'],
  [15, 15, 'at-f'],
]

const generatedProblems: PracticeProblem[] = [
  ...convexDistanceCases.map(imageDistanceProblem),
  ...concaveDistanceCases.map((entry, index) => imageDistanceProblem(entry, index)),
  ...[...convexDistanceCases.slice(0, 18), ...concaveDistanceCases.slice(0, 8)].map(
    magnificationProblem,
  ),
  ...heightCases.map(heightProblem),
  ...findFCases.map(focalLengthProblem),
  ...findDoCases.map(objectDistanceProblem),
  ...landmarkCases.map(convexLandmarkChoice),
  ...concaveDistanceCases.slice(0, 10).map(([f, objectDistance], index) =>
    concaveChoice(f, objectDistance, index),
  ),
]

export const opticsPracticeProblems: PracticeProblem[] = [warmup, ...generatedProblems]

export const opticsPracticeTemplateIds = Array.from(templateIds)

export function getSiblingPracticeProblem(problem: PracticeProblem, offset = 1): PracticeProblem {
  const sameTemplate = opticsPracticeProblems.filter((candidate) => candidate.templateId === problem.templateId)
  if (sameTemplate.length <= 1) return problem
  const current = sameTemplate.findIndex((candidate) => candidate.id === problem.id)
  const next = current < 0 ? 0 : (current + offset + sameTemplate.length) % sameTemplate.length
  return sameTemplate[next]
}
