import { describe, it, expect } from "vitest";
import { validateDeck } from "./deckValidation";
import type { Card, DeckState } from "./types";

function makeCard(overrides: Partial<Card> & { id: string }): Card {
  const name = overrides.nameEn ?? overrides.nameFr ?? "Card";
  return {
    id: overrides.id,
    setCode: overrides.setCode ?? "DUSTER",
    nameEn: overrides.nameEn ?? name,
    nameFr: overrides.nameFr ?? name,
    imageUrl: overrides.imageUrl ?? "",
    rarity: (overrides.rarity ?? "COMMON") as Card["rarity"],
    faction: overrides.faction ?? "AX",
    type: (overrides.type ?? "CHARACTER") as Card["type"],
    ...(overrides.subtype != null && { subtype: overrides.subtype }),
    ...(overrides.mainCost != null && { mainCost: overrides.mainCost }),
  };
}

function cardsById(cards: Card[]): Map<string, Card> {
  return new Map(cards.map((c) => [c.id, c]));
}

describe("validateDeck", () => {
  const hero = makeCard({
    id: "hero-1",
    nameFr: "Hero",
    type: "HERO",
    faction: "AX",
  });
  const cards = [
    hero,
    ...Array.from({ length: 30 }, (_, i) =>
      makeCard({
        id: `c-${i}`,
        nameFr: `Common ${i}`,
        faction: "AX",
        type: "CHARACTER",
      })
    ),
  ];
  const byId = cardsById(cards);

  it("accepte un deck de 30 cartes, 1 faction, sans héros", () => {
    const deck: DeckState = {
      main: Object.fromEntries(
        cards.filter((c) => c.type !== "HERO").map((c) => [c.id, 1])
      ),
      tokens: {},
    };
    const r = validateDeck(deck, byId);
    expect(r.valid).toBe(true);
    expect(r.errors).toHaveLength(0);
  });

  it("refuse moins de 30 cartes", () => {
    const deck: DeckState = {
      main: Object.fromEntries(
        cards.filter((c) => c.type !== "HERO").slice(0, 29).map((c) => [c.id, 1])
      ),
      tokens: {},
    };
    const r = validateDeck(deck, byId);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes("Minimum 30"))).toBe(true);
  });

  it("refuse plus de 3 factions", () => {
    const deck: DeckState = {
      main: {
        "c-0": 10,
        "c-1": 10,
        "c-2": 10,
      },
      tokens: {},
    };
    const multiFaction = [
      makeCard({ id: "c-0", faction: "AX" }),
      makeCard({ id: "c-1", faction: "BR" }),
      makeCard({ id: "c-2", faction: "LY" }),
      makeCard({ id: "c-3", faction: "NEUTRAL" }),
    ];
    const deck4: DeckState = {
      main: Object.fromEntries(
        multiFaction.map((c, i) => [c.id, i === 0 ? 27 : 1])
      ),
      tokens: {},
    };
    const byId4 = cardsById(multiFaction);
    const r = validateDeck(deck4, byId4);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes("Maximum 3 factions"))).toBe(true);
  });

  it("refuse un héros dont la faction n'est pas dans le deck", () => {
    const deck: DeckState = {
      heroCardId: "hero-1",
      main: {
        "hero-1": 1,
        ...Object.fromEntries(
          cards.filter((c) => c.id !== "hero-1").slice(0, 29).map((c) => [c.id, 1])
        ),
      },
      tokens: {},
    };
    const badHero = makeCard({
      id: "hero-1",
      nameFr: "Hero BR",
      type: "HERO",
      faction: "BR",
    });
    const byIdBad = cardsById([
      badHero,
      ...cards.filter((c) => c.id !== "hero-1"),
    ]);
    const r = validateDeck(deck, byIdBad);
    expect(r.valid).toBe(false);
    expect(r.errors.some((e) => e.includes("héros"))).toBe(true);
  });

  it("accepte un deck avec héros de la même faction que le deck", () => {
    const deck: DeckState = {
      heroCardId: "hero-1",
      main: {
        "hero-1": 1,
        ...Object.fromEntries(
          cards.filter((c) => c.id !== "hero-1").slice(0, 29).map((c) => [c.id, 1])
        ),
      },
      tokens: {},
    };
    const r = validateDeck(deck, byId);
    expect(r.valid).toBe(true);
  });
});
