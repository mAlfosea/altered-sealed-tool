"use client";

import { useMemo, useState } from "react";
import type { Card } from "../lib/types";
import { cardDisplayName } from "../lib/types";
import { useSealedStore } from "../store/useSealedStore";
import { getDeckFactions } from "../lib/deckValidation";
import { getFactionBorderClass, getFactionBorderStyle, getFactionBgStyle } from "../lib/factionColors";
import { Button } from "./ui/button";
import { Card as CardUi } from "./ui/card";
import { Badge } from "./ui/badge";
import type { AnchorRect } from "./CardHoverPreview";
import { CardHoverPreview } from "./CardHoverPreview";
import { Download, Minus, Star, Trash2 } from "lucide-react";

const MAX_FACTIONS = 3;

export interface DeckPanelProps {
  onExportClick?: () => void;
}
const MIN_MAIN = 30;

/** Ordre d’affichage des types : héros, personnages, sorts, repères. */
const TYPE_ORDER: Array<{ type: string; label: string }> = [
  { type: "CHARACTER", label: "Personnages" },
  { type: "SPELL", label: "Sorts" },
  { type: "EXPEDITION", label: "Permanents d'expédition" },
  { type: "LANDMARK", label: "Repères" },
];

export function DeckPanel({ onExportClick }: DeckPanelProps) {
  const deck = useSealedStore((s) => s.deck);
  const cardsById = useSealedStore((s) => s.cardsById);
  const lastValidation = useSealedStore((s) => s.lastValidation);
  const removeFromDeck = useSealedStore((s) => s.removeFromDeck);
  const setHero = useSealedStore((s) => s.setHero);
  const resetDeck = useSealedStore((s) => s.resetDeck);
  const getMainCount = useSealedStore((s) => s.getMainCount);
  const getTokenCount = useSealedStore((s) => s.getTokenCount);
  const validate = useSealedStore((s) => s.validate);

  const mainCount = getMainCount();
  const tokenCount = getTokenCount();
  const [hoveredCard, setHoveredCard] = useState<Card | null>(null);
  const [anchorRect, setAnchorRect] = useState<AnchorRect | null>(null);

  const setHover = (card: Card | null, el: HTMLElement | null) => {
    setHoveredCard(card);
    setAnchorRect(card && el ? (el.getBoundingClientRect() as AnchorRect) : null);
  };

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
    // Tri par coût main puis ordre alphabétique (nom FR)
    for (const key of Object.keys(byType)) {
      byType[key].sort((a, b) => {
        const cardA = cardsById.get(a[0]);
        const cardB = cardsById.get(b[0]);
        const costA = cardA?.mainCost ?? 999;
        const costB = cardB?.mainCost ?? 999;
        if (costA !== costB) return costA - costB;
        const nameA = cardA ? cardDisplayName(cardA) : "";
        const nameB = cardB ? cardDisplayName(cardB) : "";
        return nameA.localeCompare(nameB);
      });
    }
    return byType;
  }, [deck.main, deck.heroCardId, cardsById]);

  const tokenEntries = useMemo(() => {
    return Object.entries(deck.tokens).filter(([, qty]) => qty > 0);
  }, [deck.tokens]);

  return (
    <CardUi className="flex h-full min-h-[320px] flex-col border-l bg-card">
      <div className="border-b p-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold">Mon deck</h3>
          {onExportClick && (
            <Button variant="outline" size="sm" onClick={onExportClick}>
              <Download className="mr-1 h-3 w-3" />
              Exporter
            </Button>
          )}
        </div>
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
            <p className="text-sm font-medium text-muted-foreground">Héros (1)</p>
            <div
              className={`flex items-center justify-between rounded border p-2.5 ${getFactionBorderClass(heroCard.faction)}`}
              style={{ ...getFactionBgStyle(heroCard.faction), ...getFactionBorderStyle(heroCard.faction) }}
              onMouseEnter={(e) => setHover(heroCard, e.currentTarget)}
              onMouseLeave={() => setHover(null, null)}
            >
              <div className="flex min-w-0 flex-1 items-center justify-start gap-1.5">
                <span className="truncate text-base font-medium">{cardDisplayName(heroCard)}</span>
                {(heroCard.rarity === "RARE" || heroCard.rarity === "EXALTED" || heroCard.rarity === "UNIQUE") && (
                  <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-500" />
                )}
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => removeFromDeck(heroCard.id, false, 1)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {TYPE_ORDER.map(({ type, label }) => {
          const entries = mainEntriesByType[type];
          if (!entries?.length) return null;
          const typeTotal = entries.reduce((sum, [, qty]) => sum + qty, 0);
          return (
            <div key={type} className="mb-3">
              <p className="text-sm font-medium text-muted-foreground">
                {label} ({typeTotal})
              </p>
              <ul className="space-y-1.5">
                {entries.map(([cardId, qty]) => {
                  const card = cardsById.get(cardId);
                  if (!card) return null;
                  const costMain = card.mainCost ?? "—";
                  const costReserve = card.reserveCost;
                  const costLabel = costReserve != null ? `${costMain} / ${costReserve}` : String(costMain);
                  const isRare = card.rarity === "RARE" || card.rarity === "EXALTED" || card.rarity === "UNIQUE";
                  return (
                    <li
                      key={cardId}
                      className={`flex items-center justify-between gap-2 rounded border px-2.5 py-1.5 text-base ${getFactionBorderClass(card.faction)}`}
                      style={{ ...getFactionBgStyle(card.faction), ...getFactionBorderStyle(card.faction) }}
                      onMouseEnter={(e) => setHover(card, e.currentTarget)}
                      onMouseLeave={() => setHover(null, null)}
                    >
                      <div className="flex min-w-0 flex-1 items-center justify-start gap-2">
                        <span
                          className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-white/40 text-base font-bold tabular-nums text-black"
                          aria-label={`${qty} copie(s)`}
                        >
                          {qty}
                        </span>
                        <span className="truncate">{cardDisplayName(card)}</span>
                        {isRare && (
                          <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-500" />
                        )}
                      </div>
                      <div className="flex shrink-0 items-center gap-1">
                        <span className="w-10 text-center text-sm tabular-nums text-black">
                          {costLabel}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 bg-red-500/75 hover:bg-red-500/90 text-white"
                          onClick={() => removeFromDeck(cardId, false, 1)}
                          aria-label="Retirer une copie du deck"
                        >
                          <Minus className="h-4 w-4" />
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
            <p className="mt-3 text-sm font-medium text-muted-foreground">
              Tokens / Mana ({tokenEntries.reduce((sum, [, qty]) => sum + qty, 0)})
            </p>
            <ul className="space-y-1.5">
              {tokenEntries.map(([cardId, qty]) => {
                const card = cardsById.get(cardId);
                if (!card) return null;
                const isRare = card.rarity === "RARE" || card.rarity === "EXALTED" || card.rarity === "UNIQUE";
                return (
                  <li
                    key={cardId}
                    className={`flex items-center justify-between gap-2 rounded border px-2.5 py-1.5 text-base ${getFactionBorderClass(card.faction)}`}
                    style={{ ...getFactionBgStyle(card.faction), ...getFactionBorderStyle(card.faction) }}
                    onMouseEnter={(e) => setHover(card, e.currentTarget)}
                    onMouseLeave={() => setHover(null, null)}
                  >
                    <div className="flex min-w-0 flex-1 items-center justify-start gap-2">
                      <span
                        className="flex h-7 w-7 shrink-0 items-center justify-center rounded bg-white/40 text-base font-bold tabular-nums text-black"
                        aria-label={`${qty} copie(s)`}
                      >
                        {qty}
                      </span>
                      <span className="truncate">{cardDisplayName(card)}</span>
                      {isRare && (
                        <Star className="h-4 w-4 shrink-0 fill-amber-400 text-amber-500" />
                      )}
                    </div>
                    <div className="flex shrink-0 items-center">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 bg-red-500/75 hover:bg-red-500/90 text-white"
                        onClick={() => removeFromDeck(cardId, true, 1)}
                        aria-label="Retirer une copie du deck"
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>
      <CardHoverPreview card={hoveredCard} anchorRect={anchorRect} />
    </CardUi>
  );
}
