import seedrandom from "seedrandom";

/**
 * Générateur aléatoire seedable pour la simulation des boosters.
 * Utilise seedrandom pour des tirages reproductibles.
 */
export function createSeededRng(seed: string): () => number {
  return seedrandom(seed);
}

/**
 * Tire un entier aléatoire dans [min, max] (inclus).
 */
export function randomInt(rng: () => number, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/**
 * Choisit un élément aléatoire dans un tableau.
 */
export function pickRandom<T>(rng: () => number, arr: T[]): T {
  if (arr.length === 0) throw new Error("pickRandom: array is empty");
  return arr[Math.floor(rng() * arr.length)]!;
}

/**
 * Tire avec probabilité: true avec proba p, false avec 1-p.
 */
export function randomBool(rng: () => number, p: number): boolean {
  return rng() < p;
}
