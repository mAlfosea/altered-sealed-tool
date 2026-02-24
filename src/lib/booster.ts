import type { Card } from "./types";
import {
  createSeededRng,
  pickRandom,
  randomBool,
} from "./rng";

const BOOSTERS_PER_DECK = 7;

/** Extensions Seed of Unity (Les Graines de l'Unité) : seuls les héros de ces sets vont dans les boosters. */
const SEED_OF_UNITY_SET_CODES = new Set(["DUSTER", "DUSTERCB", "DUSTEROP", "DUSTERTOP"]);

export const SLOT_HERO = 1;
export const SLOTS_COMMONS = [2, 3, 4, 5, 6, 7, 8, 9];
export const SLOTS_RARES = [10, 11];
export const SLOT_RARE_OR_UNIQUE = 12; // 100% rare (uniques exclus des pools "normaux")
export const SLOT_TOKEN_OR_MANA = 13; // 58.3% token, 16.7% mana

export interface CardPools {
  heroes: Card[];
  commons: Card[];
  rares: Card[];
  uniques: Card[];
  tokens: Card[];
  mana: Card[];
}

/**
 * Indique si la carte doit être prise en compte dans les tirages de boosters.
 * On ne considère que les cartes "normales" : on exclut les uniques, les arts
 * alternatifs, les promos et les récompenses d'événement / KS.
 */
export function isNormalCardForBooster(card: Card): boolean {
  const id = card.id;

  // Exclure les uniques
  if (card.rarity === "UNIQUE") return false;

  // Promos (référence contenant _P_ ou préfixe ALT_CORE_P_)
  if (id.includes("_P_") || id.startsWith("ALT_CORE_P")) return false;

  // Kickstarter / édition KS
  if (id.includes("_COREKS_")) return false;

  // Foilers (art alternatif foiler)
  if (id.includes("_FOILER_")) return false;

  // Variant numérique (art alternatif, ex. ALT_xxx_C_5002)
  if (/_[A-Z]_\d+$/.test(id)) return false;

  return true;
}

export function buildPools(cards: Card[]): CardPools {
  const heroes: Card[] = [];
  const commons: Card[] = [];
  const rares: Card[] = [];
  const uniques: Card[] = []; // gardé vide pour compatibilité, slot 12 = 100% rare
  const tokens: Card[] = [];
  const mana: Card[] = [];

  for (const c of cards) {
    if (c.type === "TOKEN") {
      tokens.push(c);
      continue;
    }
    if (c.type === "MANA") {
      mana.push(c);
      continue;
    }

    const normal = isNormalCardForBooster(c);

    if (c.type === "HERO") {
      // Seed of Unity : uniquement les héros des extensions DUSTER / DUSTERCB / DUSTEROP / DUSTERTOP
      // Exclure les héros promo (_P_ dans l'id), ex. ALT_DUSTERCB_P_YZ_01, ALT_DUSTERCB_P_AX_01
      if (
        SEED_OF_UNITY_SET_CODES.has(c.setCode) &&
        !c.id.includes("_P_")
      ) {
        heroes.push(c);
      }
      continue;
    }

    // Communes et rares : uniquement les cartes "normales"
    if (!normal) continue;

    switch (c.rarity) {
      case "COMMON":
        commons.push(c);
        break;
      case "RARE":
        rares.push(c);
        break;
      case "UNIQUE":
        // déjà exclu par isNormalCardForBooster
        break;
      default:
        break;
    }
  }

  return { heroes, commons, rares, uniques, tokens, mana };
}

export interface BoosterSlotResult {
  card: Card;
  slot: number;
}

/**
 * Génère un seul booster (13 slots) avec le RNG donné.
 */
export function generateBooster(
  rng: () => number,
  pools: CardPools
): BoosterSlotResult[] {
  const result: BoosterSlotResult[] = [];

  // SLOT 1: Héros 100%
  if (pools.heroes.length > 0) {
    result.push({
      card: pickRandom(rng, pools.heroes),
      slot: 1,
    });
  }

  // SLOTS 2-9: Communes 100%
  for (let i = 0; i < 8; i++) {
    if (pools.commons.length > 0) {
      result.push({
        card: pickRandom(rng, pools.commons),
        slot: 2 + i,
      });
    }
  }

  // SLOTS 10-11: Rares 100%
  for (let i = 0; i < 2; i++) {
    if (pools.rares.length > 0) {
      result.push({
        card: pickRandom(rng, pools.rares),
        slot: 10 + i,
      });
    }
  }

  // SLOT 12: Rare 100% (uniques exclus des pools "normaux")
  if (pools.rares.length > 0) {
    result.push({
      card: pickRandom(rng, pools.rares),
      slot: 12,
    });
  }

  // SLOT 13: Jeton 58.3% / Mana 16.7% (sinon on ne met rien ou fallback token)
  const roll = rng();
  if (roll < 0.583 && pools.tokens.length > 0) {
    result.push({
      card: pickRandom(rng, pools.tokens),
      slot: 13,
    });
  } else if (roll < 0.583 + 0.167 && pools.mana.length > 0) {
    result.push({
      card: pickRandom(rng, pools.mana),
      slot: 13,
    });
  } else if (pools.tokens.length > 0) {
    result.push({
      card: pickRandom(rng, pools.tokens),
      slot: 13,
    });
  }

  return result;
}

/**
 * Génère N boosters avec seed.
 * Retourne la liste plate de toutes les cartes ouvertes avec quantités.
 */
export function openSealedDecks(
  numBoosters: number,
  seed: string,
  pools: CardPools
): Map<string, { card: Card; qty: number }> {
  const rng = createSeededRng(seed);
  const collection = new Map<string, { card: Card; qty: number }>();

  for (let b = 0; b < numBoosters; b++) {
    const booster = generateBooster(rng, pools);
    for (const { card } of booster) {
      const entry = collection.get(card.id);
      if (entry) {
        entry.qty += 1;
      } else {
        collection.set(card.id, { card, qty: 1 });
      }
    }
  }

  return collection;
}

export function getBoostersPerDeck(): number {
  return BOOSTERS_PER_DECK;
}
