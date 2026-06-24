import { imageDistance, magnification } from '../../engine'
import type { PracticeProblem } from './types'

const round1 = (n: number) => Math.round(n * 10) / 10
const imageHeight = (objectDistance: number, focalLength: number, objectHeight: number) =>
  magnification(objectDistance, imageDistance(objectDistance, focalLength)) * objectHeight

export const opticsPracticeProblems: PracticeProblem[] = [
  {
    id: 'convex-image-distance-30-10',
    title: 'Image distance from the thin-lens equation',
    prompt:
      'A converging lens has focal length 10 cm. An object is placed 30 cm from the lens. What is the image distance d_i?',
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
        feedback:
          'd_i = 15 cm makes \\frac{1}{10}=\\frac{1}{30}+\\frac{1}{15}.',
      },
    ],
    scene: { objectDistance: 30, focalLength: 10 },
    answer: round1(imageDistance(30, 10)),
    unit: 'cm',
    tolerance: 0.2,
    solution:
      'Use \\frac{1}{f}=\\frac{1}{d_o}+\\frac{1}{d_i}. Then \\frac{1}{d_i}=\\frac{1}{10}-\\frac{1}{30}=\\frac{2}{30}, so d_i=15 cm. The positive value means a real image forms on the far side of the lens.',
    hint:
      'Start from the thin-lens equation: \\frac{1}{f}=\\frac{1}{d_o}+\\frac{1}{d_i}. Substitute the two given distances, then isolate the unknown.',
    measures: { f: true, do: true, di: true },
  },
  {
    kind: 'choice',
    id: 'convex-between-focus-2focus-prediction',
    title: 'Convex lens between focus and 2 focus',
    prompt:
      'A convex lens has f = 20 cm. The object is at d_o = 30 cm, between **focus** and **2 focus**. What happens?',
    givens: [
      { symbol: 'f', label: 'Focal length', value: '+20 cm' },
      { symbol: 'd_o', label: 'Object distance', value: '30 cm' },
    ],
    scene: { objectDistance: 30, focalLength: 20, draggable: true },
    draggable: true,
    choices: [
      {
        id: 'projector',
        label: 'A **real**, inverted, enlarged image forms beyond **2 focus**',
        correct: true,
        visual: {
          scene: { objectDistance: 30, focalLength: 20 },
          caption: 'Projector region',
        },
        feedback:
          'Yes. Between **focus** and **2 focus**, a convex lens makes a projector-style real enlarged image.',
      },
      {
        id: 'same-size',
        label: 'A same-size image forms at **2 focus**',
        visual: {
          scene: { objectDistance: 40, focalLength: 20 },
          caption: '2 focus case',
        },
        feedback:
          'Same-size happens only when the object itself is at **2 focus**.',
      },
      {
        id: 'virtual',
        label: 'A **virtual**, upright, enlarged image forms',
        visual: {
          scene: { objectDistance: 12, focalLength: 20 },
          caption: 'Inside focus',
        },
        feedback:
          'That is the magnifying-glass pattern, but it happens inside the **focus**.',
      },
    ],
    hint:
      'Compare the object position to the landmarks: inside focus, at focus, between focus and 2 focus, or beyond 2 focus.',
    solution:
      'Since 30 cm is between f = 20 cm and 2f = 40 cm, the image is **real**, inverted, enlarged, and beyond **2 focus**.',
    measures: { f: true, do: true, di: true, m: true },
  },
  {
    kind: 'choice',
    id: 'convex-infinity-focus-prediction',
    title: 'Convex lens at infinity',
    prompt:
      'A very distant object sends nearly parallel light into a convex lens with f = 18 cm. Where is the image?',
    givens: [
      { symbol: 'f', label: 'Focal length', value: '+18 cm' },
      { symbol: 'd_o', label: 'Object distance', value: 'Infinity' },
    ],
    scene: { objectDistance: Infinity, focalLength: 18 },
    choices: [
      {
        id: 'focus',
        label: 'At the **focus**, 18 cm from the lens',
        correct: true,
        feedback:
          'Correct. Parallel incoming rays from infinity converge at the convex lens **focus**.',
      },
      {
        id: 'two-focus',
        label: 'At **2 focus**, 36 cm from the lens',
        feedback: '**2 focus** is the same-size case, not the infinity case.',
      },
      {
        id: 'none',
        label: 'No image forms',
        feedback: 'An image forms at the **focus** because the incoming rays are parallel.',
      },
    ],
    hint: 'For d_o = infinity, the \\frac{1}{d_o} term disappears.',
    solution:
      'The thin lens equation becomes \\frac{1}{f}=\\frac{1}{d_i}, so d_i = f = 18 cm.',
    measures: { f: true, di: true },
  },
  {
    kind: 'choice',
    id: 'concave-infinity-virtual-focus',
    title: 'Concave lens at infinity',
    prompt:
      'A very distant object shines into a concave lens with f = -20 cm. What does the diagram show?',
    givens: [
      { symbol: 'f', label: 'Focal length', value: '-20 cm' },
      { symbol: 'd_o', label: 'Object distance', value: 'Infinity' },
    ],
    scene: { objectDistance: Infinity, focalLength: -20 },
    choices: [
      {
        id: 'virtual-focus',
        label: 'A tiny **virtual** image near the **virtual focus**',
        correct: true,
        feedback:
          'Yes. The outgoing rays diverge as if they came from the candle-side **focus**.',
      },
      {
        id: 'real-focus',
        label: 'A **real** image at the far-side focus',
        feedback: 'That is convex-lens behavior. A concave lens diverges the rays.',
      },
      {
        id: 'projector',
        label: 'A projected enlarged image beyond **2 focus**',
        feedback: 'Concave lenses do not make real projected images for real objects.',
      },
    ],
    hint: 'Use the dotted back-traces: where do the diverging rays appear to come from?',
    solution:
      'For d_o = infinity, d_i = f = -20 cm. The negative sign means the image is **virtual** on the candle side.',
    measures: { f: true, di: true },
  },
  {
    id: 'convex-magnification-60-20',
    title: 'Beyond 2 focus: reduced image',
    prompt:
      'A convex lens has f = 20 cm. The object is 60 cm from the lens, beyond 2 focus. What is the lateral magnification m?',
    givens: [
      { symbol: 'f', label: 'Focal length', value: '+20 cm' },
      { symbol: 'd_o', label: 'Object distance', value: '60 cm' },
    ],
    scene: { objectDistance: 60, focalLength: 20 },
    answer: round1(magnification(60, imageDistance(60, 20))),
    unit: '',
    tolerance: 0.05,
    solution:
      'The image distance is 30 cm, so m=-\\frac{d_i}{d_o}=-\\frac{30}{60}=-0.5. The negative sign means inverted; the magnitude less than 1 means reduced.',
    hint:
      'Find d_i first, then use m=-\\frac{d_i}{d_o}. Objects beyond **2 focus** make reduced real images.',
    measures: { do: true, di: true, m: true },
  },
  {
    id: 'projector-image-height',
    title: 'Image height for a projected image',
    prompt:
      'A 4 cm tall object is 15 cm from a converging lens with f = 10 cm. What is the image height h_i? Include the sign.',
    givens: [
      { symbol: 'f', label: 'Focal length', value: '+10 cm' },
      { symbol: 'd_o', label: 'Object distance', value: '15 cm' },
      { symbol: 'h_o', label: 'Object height', value: '+4 cm' },
    ],
    scene: { objectDistance: 15, focalLength: 10, objectHeight: 16, draggable: true },
    answer: round1(imageHeight(15, 10, 4)),
    unit: 'cm',
    tolerance: 0.2,
    solution:
      'First find d_i = 30 cm. Then m=-\\frac{30}{15}=-2, so h_i=m h_o=(-2)(4 cm)=-8 cm. The image is inverted and enlarged.',
    hint:
      'Use \\frac{1}{f}=\\frac{1}{d_o}+\\frac{1}{d_i} first, then connect magnification to image height. The sign tells you the orientation.',
    measures: { f: true, do: true, di: true, m: true },
  },
  {
    kind: 'choice',
    id: 'concave-2focus-prediction',
    title: 'Concave lens at 2 focus',
    prompt:
      'A concave lens has f = -15 cm. The object is at 30 cm, which is 2 focus from the lens. What image forms?',
    givens: [
      { symbol: 'f', label: 'Focal length', value: '-15 cm' },
      { symbol: 'd_o', label: 'Object distance', value: '30 cm' },
    ],
    scene: { objectDistance: 30, focalLength: -15, draggable: true },
    draggable: true,
    choices: [
      {
        id: 'virtual-reduced',
        label: '**Virtual**, **upright**, and **reduced**, between lens and **focus**',
        correct: true,
        feedback:
          'Correct. Concave lenses keep real-object images virtual, upright, and reduced.',
      },
      {
        id: 'same-size',
        label: 'Same size at **2 focus**',
        feedback: 'That is the convex-lens 2 focus pattern, not concave behavior.',
      },
      {
        id: 'projector',
        label: '**Real**, inverted, and enlarged',
        feedback: 'A concave lens does not make a real projector image for a real object.',
      },
    ],
    hint:
      'Concave lenses always spread real-object rays out; the image is found with dotted back-traces.',
    solution:
      'The image remains **virtual**, **upright**, and **reduced**. It lies between the lens and the virtual **focus**.',
    measures: { f: true, do: true, di: true, m: true },
  },
  {
    id: 'inside-f-virtual-distance',
    title: 'Virtual image inside the focal length',
    prompt:
      'A converging lens has f = 20 cm. An object is placed 12 cm from the lens. What is d_i? Include the sign.',
    givens: [
      { symbol: 'f', label: 'Focal length', value: '+20 cm' },
      { symbol: 'd_o', label: 'Object distance', value: '12 cm' },
    ],
    scene: { objectDistance: 12, focalLength: 20, draggable: true },
    answer: round1(imageDistance(12, 20)),
    unit: 'cm',
    tolerance: 0.3,
    solution:
      '\\frac{1}{d_i}=\\frac{1}{20}-\\frac{1}{12}=-\\frac{1}{30}, so d_i=-30 cm. The negative image distance means the image is virtual and appears on the object side.',
    hint:
      'Use \\frac{1}{f}=\\frac{1}{d_o}+\\frac{1}{d_i}. Watch the sign of the image distance when the object distance is less than f.',
    measures: { f: true, do: true, di: true },
  },
  {
    id: 'diverging-lens-image-distance',
    title: 'Diverging lens image distance',
    prompt:
      'A diverging lens has focal length -15 cm. An object is 30 cm from the lens. What is d_i? Include the sign.',
    givens: [
      { symbol: 'f', label: 'Focal length', value: '-15 cm' },
      { symbol: 'd_o', label: 'Object distance', value: '30 cm' },
    ],
    scene: { objectDistance: 30, focalLength: -15 },
    answer: round1(imageDistance(30, -15)),
    unit: 'cm',
    tolerance: 0.2,
    solution:
      '\\frac{1}{d_i}=\\frac{1}{-15}-\\frac{1}{30}=-\\frac{3}{30}, so d_i=-10 cm. A diverging lens forms a virtual image for a real object.',
    hint:
      'Start with \\frac{1}{f}=\\frac{1}{d_o}+\\frac{1}{d_i}, and remember that a diverging lens has a negative focal length.',
    measures: { f: true, do: true, di: true },
  },
  {
    id: 'diverging-lens-height',
    title: 'Diverging lens image height',
    prompt:
      'For f = -15 cm and d_o = 30 cm, a 6 cm object is in front of the lens. What is h_i?',
    givens: [
      { symbol: 'f', label: 'Focal length', value: '-15 cm' },
      { symbol: 'd_o', label: 'Object distance', value: '30 cm' },
      { symbol: 'h_o', label: 'Object height', value: '+6 cm' },
    ],
    scene: { objectDistance: 30, focalLength: -15, objectHeight: 18 },
    answer: round1(imageHeight(30, -15, 6)),
    unit: 'cm',
    tolerance: 0.2,
    solution:
      'The image distance is -10 cm, so m=-\\frac{-10}{30}=+0.33. Then h_i=(0.33)(6 cm)=+2 cm. The positive height means upright.',
    hint:
      'Use the thin-lens equation to find the signed image distance, then apply the magnification relationship to the object height.',
    measures: { do: true, di: true, m: true },
  },
  {
    id: 'far-object-focal-plane',
    title: 'Far object limit',
    prompt:
      'Light from a very distant object enters a converging lens with f = 18 cm. Approximately where does the image form?',
    givens: [
      { symbol: 'f', label: 'Focal length', value: '+18 cm' },
      { symbol: 'd_o', label: 'Object distance', value: 'Very large' },
    ],
    scene: { objectDistance: Infinity, focalLength: 18 },
    answer: 18,
    unit: 'cm',
    tolerance: 0.2,
    solution:
      'For a distant object, \\frac{1}{d_o} is nearly zero. The lens equation becomes \\frac{1}{f}=\\frac{1}{d_i}, so d_i \\approx f = 18 cm.',
    hint:
      'Use \\frac{1}{f}=\\frac{1}{d_o}+\\frac{1}{d_i}. For a very distant object, think about what happens to the \\frac{1}{d_o} term.',
    measures: { f: true, di: true },
  },
  {
    id: 'find-focal-length-from-distances',
    title: 'Find the focal length',
    prompt:
      'A real object is 40 cm from a lens and its real image forms 40 cm on the other side. What is the focal length?',
    givens: [
      { symbol: 'd_o', label: 'Object distance', value: '40 cm' },
      { symbol: 'd_i', label: 'Image distance', value: '+40 cm' },
    ],
    scene: { objectDistance: 40, focalLength: 20 },
    answer: 20,
    unit: 'cm',
    tolerance: 0.2,
    solution:
      '\\frac{1}{f}=\\frac{1}{40}+\\frac{1}{40}=\\frac{2}{40}=\\frac{1}{20}, so f = 20 cm. Equal object and image distances mean both are at 2F.',
    hint:
      'Use \\frac{1}{f}=\\frac{1}{d_o}+\\frac{1}{d_i}. Both distances are given, so solve the equation for f.',
    measures: { f: true, do: true, di: true },
  },
  {
    id: 'solve-object-distance',
    title: 'Solve for object distance',
    prompt:
      'A converging lens has f = 8 cm and makes a real image at d_i = 24 cm. What is d_o?',
    givens: [
      { symbol: 'f', label: 'Focal length', value: '+8 cm' },
      { symbol: 'd_i', label: 'Image distance', value: '+24 cm' },
    ],
    scene: { objectDistance: 12, focalLength: 8, draggable: true },
    answer: 12,
    unit: 'cm',
    tolerance: 0.2,
    solution:
      '\\frac{1}{d_o}=\\frac{1}{f}-\\frac{1}{d_i}=\\frac{1}{8}-\\frac{1}{24}=\\frac{2}{24}=\\frac{1}{12}, so d_o = 12 cm.',
    hint:
      'Use \\frac{1}{f}=\\frac{1}{d_o}+\\frac{1}{d_i}. Substitute f and d_i, then isolate the remaining distance.',
    measures: { f: true, do: true, di: true },
  },
]
