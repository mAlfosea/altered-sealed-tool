"use client";

import { useMemo, useState } from "react";
import type { Card } from "../lib/types";
import { cardDisplayName } from "../lib/types";
import type { CollectionEntry } from "../store/useSealedStore";
import { Card as CardUi } from "./ui/card";
import { Badge } from "./ui/badge";
import { useSealedStore } from "../store/useSealedStore";
import { cn } from "../lib/utils";
import type { AnchorRect } from "./CardHoverPreview";
import { CardHoverPreview } from "./CardHoverPreview";

/** Ordre des factions pour le tri (héros puis cartes). */
const FACTION_ORDER = ["AX", "BR", "LY", "MU", "OR", "YZ", "NEUTRAL", "NE"];

/** Libellés des factions pour l’affichage. */
export const FACTION_LABELS: Record<string, string> = {
  AX: "Axiom",
  BR: "Bravos",
  LY: "Lyra",
  MU: "Muna",
  OR: "Ordis",
  YZ: "Yzmir",
  NEUTRAL: "Neutral",
  NE: "NE",
};

function factionIndex(faction: string): number {
  const i = FACTION_ORDER.indexOf(faction);
  return i >= 0 ? i : FACTION_ORDER.length;
}

interface CollectionGridProps {
  entries: CollectionEntry[];
  search: string;
  activeFactions: string[];
  activeRarities: string[];
  activeTypes: string[];
  onAddCard: (cardId: string, isToken: boolean, qty?: number) => void;
  onRemoveCard?: (cardId: string, isToken: boolean, qty?: number) => void;
}

function CardTile({
  card,
  qty,
  inDeck,
  onAdd,
  onRemove,
  onHoverChange,
  disabled,
}: {
  card: Card;
  qty: number;
  inDeck: number;
  onAdd: (cardId: string, isToken: boolean, qty?: number) => void;
  onRemove?: (cardId: string, isToken: boolean, qty?: number) => void;
  onHoverChange?: (card: Card | null, anchorEl: HTMLElement | null) => void;
  disabled?: boolean;
}) {
  const isToken = card.type === "TOKEN" || card.type === "MANA";
  const allInDeck = qty > 0 && inDeck >= qty;

  const handleClick = (e: React.MouseEvent) => {
    if (disabled) return;
    const addQty = e.shiftKey ? 3 : 1;
    onAdd(card.id, isToken, addQty);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (disabled || !onRemove) return;
    onRemove(card.id, isToken, 1);
  };

  return (
    <CardUi
      className={cn(
        "cursor-pointer transition hover:ring-2 hover:ring-primary/50",
        disabled && "cursor-not-allowed opacity-60"
      )}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      onMouseEnter={(e) => onHoverChange?.(card, e.currentTarget as HTMLElement)}
      onMouseLeave={() => onHoverChange?.(null, null)}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-t-lg bg-muted">
        {card.imageUrl ? (
          <img
            src={card.imageUrl}
            alt={cardDisplayName(card)}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            {cardDisplayName(card).slice(0, 20)}
          </div>
        )}
        <div className="absolute right-1 top-1">
          <Badge
            variant="secondary"
            className={cn(
              "tabular-nums",
              allInDeck && "font-semibold text-red-600"
            )}
          >
            {inDeck}/{qty}
          </Badge>
        </div>
      </div>
      <div className="p-2">
        <p className="truncate text-sm font-medium">{cardDisplayName(card)}</p>
      </div>
    </CardUi>
  );
}

function getInDeckCount(deck: { main: Record<string, number>; tokens: Record<string, number> }, cardId: string): number {
  return (deck.main[cardId] ?? 0) + (deck.tokens[cardId] ?? 0);
}

export function CollectionGrid({
  entries,
  search,
  activeFactions,
  activeRarities,
  activeTypes,
  onAddCard,
  onRemoveCard,
}: CollectionGridProps) {
  const cardsById = useSealedStore((s) => s.cardsById);
  const deck = useSealedStore((s) => s.deck);
  const [hoveredCard, setHoveredCard] = useState<Card | null>(null);
  const [anchorRect, setAnchorRect] = useState<AnchorRect | null>(null);

  const handleHoverChange = (card: Card | null, el: HTMLElement | null) => {
    setHoveredCard(card);
    setAnchorRect(card && el ? (el.getBoundingClientRect() as AnchorRect) : null);
  };

  const filtered = useMemo(() => {
    const lower = search.toLowerCase();
    return entries.filter(({ card }) => {
      if (lower && !card.nameFr.toLowerCase().includes(lower) && !card.nameEn.toLowerCase().includes(lower)) return false;
      if (activeFactions.length > 0 && !activeFactions.includes(card.faction)) return false;
      if (activeRarities.length > 0 && !activeRarities.includes(card.rarity)) return false;
      if (activeTypes.length > 0 && !activeTypes.includes(card.type)) return false;
      return true;
    });
  }, [entries, search, activeFactions, activeRarities, activeTypes]);

  const toShow = useMemo(() => {
    const byId = new Map<string, { card: Card; qty: number }>();
    for (const { card, qty } of filtered) {
      const cur = byId.get(card.id);
      if (cur) cur.qty += qty;
      else byId.set(card.id, { card, qty });
    }
    const list = Array.from(byId.entries()).map(([, entry]) => entry);

    // Tri : 1) Héros en premier, 2) puis les cartes ; dans chaque groupe : faction → coût main croissant → alphabétique (nom FR)
    list.sort((a, b) => {
      const isHeroA = a.card.type === "HERO";
      const isHeroB = b.card.type === "HERO";
      if (isHeroA && !isHeroB) return -1;
      if (!isHeroA && isHeroB) return 1;

      const facA = factionIndex(a.card.faction);
      const facB = factionIndex(b.card.faction);
      if (facA !== facB) return facA - facB;
      const costA = a.card.mainCost ?? 999;
      const costB = b.card.mainCost ?? 999;
      if (costA !== costB) return costA - costB;
      return a.card.nameFr.localeCompare(b.card.nameFr, "fr");
    });
    return list;
  }, [filtered]);

  if (toShow.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        Aucune carte à afficher. Ouvrez des boosters ou ajustez les filtres.
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {toShow.map(({ card, qty }) => (
          <CardTile
            key={card.id}
            card={card}
            qty={qty}
            inDeck={getInDeckCount(deck, card.id)}
            onAdd={onAddCard}
            onRemove={onRemoveCard}
            onHoverChange={handleHoverChange}
          />
        ))}
      </div>
      <CardHoverPreview card={hoveredCard} anchorRect={anchorRect} />
    </>
  );
}
