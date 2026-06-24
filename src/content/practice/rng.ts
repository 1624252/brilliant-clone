// Tiny seeded PRNG (mulberry32) so practice problems are deterministic given a
// seed — important for reproducible tests and for generating endless, varied
// problems without any AI or network calls.

export interface Rng {
  /** Next float in [0, 1). */
  next(): number
  /** Integer in [min, max] inclusive. */
  int(min: number, max: number): number
  /** Pick a random element from a non-empty array. */
  pick<T>(items: readonly T[]): T
  /** True with probability p (default 0.5). */
  bool(p?: number): boolean
}

/** Create a deterministic RNG from a 32-bit seed. */
export function makeRng(seed: number): Rng {
  let a = seed >>> 0
  const next = () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    int: (min, max) => min + Math.floor(next() * (max - min + 1)),
    pick: (items) => items[Math.floor(next() * items.length)],
    bool: (p = 0.5) => next() < p,
  }
}

/** A fresh, time-seeded RNG for live (non-test) generation. */
export const liveRng = (): Rng => makeRng((Date.now() ^ (Math.random() * 0xffffffff)) >>> 0)
