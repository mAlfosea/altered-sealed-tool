"use client";

import { useMemo } from "react";
import type { Card } from "@/lib/types";
import { useSealedStore } from "@/store/useSealedStore";
import { getDeckFactions } from "@/lib/deckValidation";
import { getFactionBorderClass } from "@/lib/factionColors";
import { Button } from "@/components/ui/button";
import { Card as CardUi } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, Trash2 } from "lucide-react";

const MAX_FACTIONS = 3;
const MIN_MAIN = 30;

/** Ordre d’affichage des types : héros, personnages, sorts, repères. */
const TYPE_ORDER: Array<{ type: string; label: string }> = [
  { type: "CHARACTER", label: "Personnages" },
  { type: "SPELL", label: "Sorts" },
  { type: "EXPEDITION", label: "Permanents d'expédition" },
  { type: "LANDMARK", label: "Repères" },
];

export function DeckPanel() {
  const deck = useSealedStore((s) => s.deck);
  const cardsById = useSealedStore((s) => s.cardsById);
  const lastValidation = useSealedStore((s) => s.lastValidation);
  const addToDeck = useSealedStore((s) => s.addToDeck);
  const removeFromDeck = useSealedStore((s) => s.removeFromDeck);
  const setHero = useSealedStore((s) => s.setHero);
  const resetDeck = useSealedStore((s) => s.resetDeck);
  const getMainCount = useSealedStore((s) => s.getMainCount);
  const getTokenCount = useSealedStore((s) => s.getTokenCount);
  const validate = useSealedStore((s) => s.validate);

  const mainCount = getMainCount();
  const tokenCount = getTokenCount();
  const factions = useMemo(
    () => getDeckFactions(deck, cardsById),
    [deck, cardsById]
  );
  const isValid = lastValidation?.valid ?? false;
  const heroCard = deck.heroCardId ? cardsById.get(deck.heroCardId) : null;

  const mainEntriesByType = useMemo(() => {
    const entries = Object.entries(deck.main).filter(
      ([id, qty]) => qty > 0 && id !== deck.heroCardId
    );
    const byType: Record<string, Array<[string, number]>> = {};
    for (const entry of entries) {
      const card = cardsById.get(entry[0]);
      const t = card?.type ?? "CHARACTER";
      if (!byType[t]) byType[t] = [];
      byType[t].push(entry);
    }
    return byType;
  }, [deck.main, deck.heroCardId, cardsById]);

  const tokenEntries = useMemo(() => {
    return Object.entries(deck.tokens).filter(([, qty]) => qty > 0);
  }, [deck.tokens]);

  return (
    <CardUi className="flex h-full min-h-[320px] flex-col border-l bg-card">
      <div className="border-b p-3">
        <h3 className="font-semibold">Mon deck</h3>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge variant={mainCount >= MIN_MAIN ? "success" : "destructive"}>
            {mainCount} / {MIN_MAIN} cartes
          </Badge>
          {tokenCount > 0 && (
            <Badge variant="secondary">{tokenCount} token(s)</Badge>
          )}
          <Badge
            variant={factions.length <= MAX_FACTIONS ? "success" : "destructive"}
          >
            {factions.length} faction(s)
          </Badge>
          <Badge variant={isValid ? "success" : "destructive"}>
            {isValid ? "Deck valide" : "Deck invalide"}
          </Badge>
        </div>
        {lastValidation && !lastValidation.valid && lastValidation.errors.length > 0 && (
          <ul className="mt-2 text-xs text-destructive">
            {lastValidation.errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="mt-2 text-muted-foreground"
          onClick={() => {
            resetDeck();
            validate();
          }}
        >
          <Trash2 className="mr-1 h-3 w-3" />
          Vider le deck
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {heroCard && (
          <div className="mb-3">
            <p className="text-xs font-medium text-muted-foreground">Héros</p>
            <div
              className={`flex items-center justify-between rounded border bg-muted/50 p-2 ${getFactionBorderClass(heroCard.faction)}`}
            >
              <span className="text-sm font-medium">{heroCard.name}</span>
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => removeFromDeck(heroCard.id, false, 1)}
                >
                  <Minus className="h-3 w-3" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {TYPE_ORDER.map(({ type, label }) => {
          const entries = mainEntriesByType[type];
          if (!entries?.length) return null;
          return (
            <div key={type} className="mb-3">
              <p className="text-xs font-medium text-muted-foreground">
                {label}
              </p>
              <ul className="space-y-1">
                {entries.map(([cardId, qty]) => {
                  const card = cardsById.get(cardId);
                  if (!card) return null;
                  return (
                    <li
                      key={cardId}
                      className={`flex items-center justify-between rounded border bg-muted/30 px-2 py-1 text-sm ${getFactionBorderClass(card.faction)}`}
                    >
                      <span className="truncate">{card.name}</span>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeFromDeck(cardId, false, 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-xs">{qty}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => addToDeck(cardId, false, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}

        {tokenEntries.length > 0 && (
          <>
            <p className="mt-3 text-xs font-medium text-muted-foreground">
              Tokens / Mana
            </p>
            <ul className="space-y-1">
              {tokenEntries.map(([cardId, qty]) => {
                const card = cardsById.get(cardId);
                if (!card) return null;
                return (
                  <li
                    key={cardId}
                    className={`flex items-center justify-between rounded border bg-muted/30 px-2 py-1 text-sm ${getFactionBorderClass(card.faction)}`}
                  >
                    <span className="truncate">{card.name}</span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeFromDeck(cardId, true, 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-xs">{qty}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => addToDeck(cardId, true, 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
    </CardUi>
  );
}
