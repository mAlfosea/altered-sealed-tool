import type { Card, DeckState } from "./types";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const MIN_MAIN_CARDS = 30;
const MAX_FACTIONS = 3;

export function validateDeck(
  deck: DeckState,
  cardsById: Map<string, Card>
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  const mainCount = Object.values(deck.main).reduce((a, b) => a + b, 0);
  const tokenCount = Object.values(deck.tokens).reduce((a, b) => a + b, 0);

  if (mainCount < MIN_MAIN_CARDS) {
    errors.push(`Minimum 30 cartes (hors tokens). Actuel : ${mainCount}.`);
  }

  const factions = new Set<string>();
  for (const [cardId, qty] of Object.entries(deck.main)) {
    if (qty <= 0) continue;
    if (cardId === deck.heroCardId) continue;
    const card = cardsById.get(cardId);
    if (card) factions.add(card.faction);
  }

  if (deck.heroCardId) {
    const hero = cardsById.get(deck.heroCardId);
    if (hero) {
      if (hero.type !== "HERO") {
        errors.push("Le héros doit être une carte de type Héros.");
      } else if (!factions.has(hero.faction)) {
        errors.push(
          "Le héros doit appartenir à une des factions du deck."
        );
      }
      factions.add(hero.faction);
    }
  }

  if (factions.size > MAX_FACTIONS) {
    errors.push(`Maximum 3 factions. Actuel : ${factions.size}.`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function getDeckFactions(
  deck: DeckState,
  cardsById: Map<string, Card>
): string[] {
  const factions = new Set<string>();
  for (const [cardId, qty] of Object.entries(deck.main)) {
    if (qty <= 0) continue;
    const card = cardsById.get(cardId);
    if (card) factions.add(card.faction);
  }
  if (deck.heroCardId) {
    const hero = cardsById.get(deck.heroCardId);
    if (hero) factions.add(hero.faction);
  }
  return Array.from(factions);
}
