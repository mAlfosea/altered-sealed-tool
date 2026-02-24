import { describe, it, expect } from "vitest";
import {
  buildPools,
  generateBooster,
  openSealedDecks,
  getBoostersPerDeck,
  isNormalCardForBooster,
} from "./booster";
import type { Card } from "./types";

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

describe("isNormalCardForBooster", () => {
  it("exclut les uniques, promos, COREKS, foilers et variants", () => {
    expect(isNormalCardForBooster(makeCard({ id: "ALT_DUSTER_B_AX_01_C", rarity: "COMMON" }))).toBe(true);
    expect(isNormalCardForBooster(makeCard({ id: "ALT_DUSTER_B_AX_01_U", rarity: "UNIQUE" }))).toBe(false);
    expect(isNormalCardForBooster(makeCard({ id: "ALT_CORE_P_SOME_PROMO", rarity: "COMMON" }))).toBe(false);
    expect(isNormalCardForBooster(makeCard({ id: "ALT_COREKS_B_LY_10_C", rarity: "COMMON" }))).toBe(false);
    expect(isNormalCardForBooster(makeCard({ id: "ALT_DUSTER_B_AX_01_FOILER_ABC", rarity: "RARE" }))).toBe(false);
    expect(isNormalCardForBooster(makeCard({ id: "ALT_DUSTER_B_AX_01_C_5002", rarity: "COMMON" }))).toBe(false);
  });
});

describe("buildPools", () => {
  it("répartit les cartes normales dans les bons pools (uniques exclus)", () => {
    const cards: Card[] = [
      makeCard({ id: "h1", type: "HERO" }),
      makeCard({ id: "c1", rarity: "COMMON" }),
      makeCard({ id: "r1", rarity: "RARE" }),
      makeCard({ id: "u1", rarity: "UNIQUE" }),
      makeCard({ id: "t1", type: "TOKEN" }),
      makeCard({ id: "m1", type: "MANA" }),
    ];
    const pools = buildPools(cards);
    expect(pools.heroes).toHaveLength(1);
    expect(pools.heroes[0]!.id).toBe("h1");
    expect(pools.commons).toHaveLength(1);
    expect(pools.rares).toHaveLength(1);
    expect(pools.uniques).toHaveLength(0); // uniques exclus des pools boosters
    expect(pools.tokens).toHaveLength(1);
    expect(pools.mana).toHaveLength(1);
  });

  it("n’inclut que les héros Seed of Unity (DUSTER, DUSTERCB, DUSTEROP, DUSTERTOP)", () => {
    const cards: Card[] = [
      makeCard({ id: "ALT_EOLE_B_YZ_105_C", setCode: "EOLE", type: "HERO" }),
      makeCard({ id: "ALT_CORE_A_AX_01_C", setCode: "CORE", type: "HERO" }),
      makeCard({ id: "ALT_DUSTERCB_P_AX_01", setCode: "DUSTERCB", type: "HERO" }),
      makeCard({ id: "ALT_DUSTER_A_YZ_01_C", setCode: "DUSTER", type: "HERO" }),
    ];
    const pools = buildPools(cards);
    expect(pools.heroes).toHaveLength(1);
    expect(pools.heroes[0]!.id).toBe("ALT_DUSTER_A_YZ_01_C");
  });
});

describe("generateBooster", () => {
  it("produit un booster avec seed fixe reproductible", () => {
    const cards: Card[] = [
      makeCard({ id: "h1", type: "HERO" }),
      ...Array.from({ length: 10 }, (_, i) =>
        makeCard({ id: `c${i}`, rarity: "COMMON" })
      ),
      ...Array.from({ length: 5 }, (_, i) =>
        makeCard({ id: `r${i}`, rarity: "RARE" })
      ),
      makeCard({ id: "t1", type: "TOKEN" }),
      makeCard({ id: "m1", type: "MANA" }),
    ];
    const pools = buildPools(cards);
    const rng1 = (() => {
      let s = 0.5;
      return () => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
      };
    })();
    const booster1 = generateBooster(rng1, pools);
    const rng2 = (() => {
      let s = 0.5;
      return () => {
        s = (s * 9301 + 49297) % 233280;
        return s / 233280;
      };
    })();
    const booster2 = generateBooster(rng2, pools);
    expect(booster1.length).toBeGreaterThanOrEqual(1);
    expect(booster2.length).toBe(booster1.length);
    const ids1 = booster1.map((b) => b.card.id).sort();
    const ids2 = booster2.map((b) => b.card.id).sort();
    expect(ids1).toEqual(ids2);
  });
});

describe("openSealedDecks", () => {
  it("même seed donne la même collection", () => {
    const cards: Card[] = [
      makeCard({ id: "h1", type: "HERO" }),
      ...Array.from({ length: 20 }, (_, i) =>
        makeCard({ id: `c${i}`, rarity: "COMMON" })
      ),
      ...Array.from({ length: 10 }, (_, i) =>
        makeCard({ id: `r${i}`, rarity: "RARE" })
      ),
      makeCard({ id: "t1", type: "TOKEN" }),
      makeCard({ id: "m1", type: "MANA" }),
    ];
    const pools = buildPools(cards);
    const col1 = openSealedDecks(1, "test-seed-42", pools); // 1 booster
    const col2 = openSealedDecks(1, "test-seed-42", pools);
    expect(col1.size).toBe(col2.size);
    for (const [id, entry] of col1) {
      const e2 = col2.get(id);
      expect(e2).toBeDefined();
      expect(e2!.qty).toBe(entry.qty);
    }
  });

  it("nombre de boosters ouverts = premier argument", () => {
    const cards: Card[] = [
      makeCard({ id: "h1", type: "HERO" }),
      ...Array.from({ length: 20 }, (_, i) => makeCard({ id: `c${i}`, rarity: "COMMON" })),
      ...Array.from({ length: 10 }, (_, i) => makeCard({ id: `r${i}`, rarity: "RARE" })),
      makeCard({ id: "t1", type: "TOKEN" }),
      makeCard({ id: "m1", type: "MANA" }),
    ];
    const pools = buildPools(cards);
    const col3 = openSealedDecks(3, "seed-fix", pools);
    const totalCards = Array.from(col3.values()).reduce((s, e) => s + e.qty, 0);
    expect(totalCards).toBe(3 * 13); // 3 boosters × 13 cartes
  });

  it("boostersPerDeck est 7", () => {
    expect(getBoostersPerDeck()).toBe(7);
  });
});
