import type { Card, DeckState } from "@/lib/types";
import { openSealedDecks, buildPools, getBoostersPerDeck } from "@/lib/booster";
import { validateDeck } from "@/lib/deckValidation";
import type { ValidationResult } from "@/lib/deckValidation";
import { persist } from "zustand/middleware";
import { create } from "zustand";

const STORAGE_KEY = "altered-sealed-store";

export interface CollectionEntry {
  card: Card;
  qty: number;
}

interface SealedState {
  seed: string;
  numBoosters: number;
  boostersPerDeck: number;
  collection: Map<string, CollectionEntry>;
  deck: DeckState;
  cards: Card[];
  cardsById: Map<string, Card>;
  pools: ReturnType<typeof buildPools> | null;
  lastValidation: ValidationResult | null;
  setSeed: (seed: string) => void;
  setNumBoosters: (n: number) => void;
  openBoosters: (randomSeed?: boolean) => void;
  addToDeck: (cardId: string, isToken: boolean, qty?: number) => void;
  removeFromDeck: (cardId: string, isToken: boolean, qty?: number) => void;
  setHero: (cardId: string | undefined) => void;
  validate: () => ValidationResult;
  initCards: (cards: Card[]) => void;
  resetDeck: () => void;
  getMainCount: () => number;
  getTokenCount: () => number;
}

function randomSeed(): string {
  return Math.random().toString(36).slice(2, 12);
}

const emptyDeck: DeckState = { main: {}, tokens: {} };

export const useSealedStore = create<SealedState>()(
  persist(
    (set, get) => ({
      seed: randomSeed(),
      numBoosters: 1,
      boostersPerDeck: getBoostersPerDeck(),
      collection: new Map(),
      deck: emptyDeck,
      cards: [],
      cardsById: new Map(),
      pools: null,
      lastValidation: null,

      setSeed(s: string) {
        set({ seed: s });
      },

      setNumBoosters(n: number) {
        set({ numBoosters: Math.max(1, Math.min(50, n)) });
      },

      initCards(cards: Card[]) {
        const cardsById = new Map(cards.map((c) => [c.id, c]));
        const pools = buildPools(cards);
        set({ cards, cardsById, pools });
      },

      openBoosters(useRandomSeed = false) {
        const { numBoosters, pools, cards } = get();
        if (!pools || cards.length === 0) return;
        const newSeed = useRandomSeed ? randomSeed() : get().seed;
        if (useRandomSeed) set({ seed: newSeed });
        const collection = openSealedDecks(numBoosters, newSeed, pools);
        set({ collection, deck: emptyDeck, lastValidation: null });
      },

      addToDeck(cardId: string, isToken: boolean, qty = 1) {
        const { deck, cardsById, collection } = get();
        const card = cardsById.get(cardId);
        if (!card) return;
        const owned = collection.get(cardId)?.qty ?? 0;
        const inDeck =
          (deck.main[cardId] ?? 0) + (deck.tokens[cardId] ?? 0);
        const toAdd = qty > 0 ? Math.min(qty, Math.max(0, owned - inDeck)) : 0;
        if (toAdd <= 0 && qty > 0) return;
        if (card.type === "HERO") {
          const addQty = qty > 0 ? Math.min(1, Math.max(0, owned - inDeck)) : 0;
          if (addQty <= 0 && qty > 0) return;
          const main = { ...deck.main };
          if (deck.heroCardId && deck.heroCardId !== cardId) {
            delete main[deck.heroCardId];
          }
          main[cardId] = (main[cardId] ?? 0) + addQty;
          set({
            deck: {
              ...deck,
              heroCardId: cardId,
              main,
            },
          });
          get().validate();
          return;
        }
        if (isToken || card.type === "TOKEN" || card.type === "MANA") {
          set({
            deck: {
              ...deck,
              tokens: {
                ...deck.tokens,
                [cardId]: (deck.tokens[cardId] ?? 0) + toAdd,
              },
            },
          });
        } else {
          set({
            deck: {
              ...deck,
              main: {
                ...deck.main,
                [cardId]: (deck.main[cardId] ?? 0) + toAdd,
              },
            },
          });
        }
        get().validate();
      },

      removeFromDeck(cardId: string, isToken: boolean, qty = 1) {
        const { deck } = get();
        if (deck.heroCardId === cardId) {
          const main = { ...deck.main };
          delete main[cardId];
          set({
            deck: {
              ...deck,
              heroCardId: undefined,
              main,
            },
          });
        } else if (isToken) {
          const current = deck.tokens[cardId] ?? 0;
          const next = Math.max(0, current - qty);
          const tokens = { ...deck.tokens };
          if (next === 0) delete tokens[cardId];
          else tokens[cardId] = next;
          set({ deck: { ...deck, tokens } });
        } else {
          const current = deck.main[cardId] ?? 0;
          const next = Math.max(0, current - qty);
          const main = { ...deck.main };
          if (next === 0) delete main[cardId];
          else main[cardId] = next;
          set({ deck: { ...deck, main } });
        }
        get().validate();
      },

      setHero(cardId: string | undefined) {
        set((s) => ({
          deck: {
            ...s.deck,
            heroCardId: cardId,
          },
        }));
        get().validate();
      },

      validate(): ValidationResult {
        const { deck, cardsById } = get();
        const result = validateDeck(deck, cardsById);
        set({ lastValidation: result });
        return result;
      },

      resetDeck() {
        set({ deck: emptyDeck, lastValidation: null });
      },

      getMainCount() {
        return Object.values(get().deck.main).reduce((a, b) => a + b, 0);
      },

      getTokenCount() {
        return Object.values(get().deck.tokens).reduce((a, b) => a + b, 0);
      },
    }),
    {
      name: STORAGE_KEY,
      partialize: (s) => ({
        seed: s.seed,
        numBoosters: s.numBoosters,
        deck: s.deck,
      }),
      merge: (persisted, current) => {
        const p = persisted as { seed?: string; numBoosters?: number; numDecks?: number; deck?: DeckState };
        return {
          ...current,
          ...persisted,
          numBoosters: p.numBoosters ?? (p.numDecks != null ? p.numDecks * getBoostersPerDeck() : undefined) ?? current.numBoosters,
        };
      },
    }
  )
);
