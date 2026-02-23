"use client";

import { useMemo } from "react";
import type { Card } from "@/lib/types";
import type { CollectionEntry } from "@/store/useSealedStore";
import { Card as CardUi } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useSealedStore } from "@/store/useSealedStore";
import { cn } from "@/lib/utils";

/** Ordre des factions pour le tri (héros puis cartes). */
const FACTION_ORDER = ["AX", "BR", "LY", "MU", "OR", "YZ", "NEUTRAL"];

function factionIndex(faction: string): number {
  const i = FACTION_ORDER.indexOf(faction);
  return i >= 0 ? i : FACTION_ORDER.length;
}

interface CollectionGridProps {
  entries: CollectionEntry[];
  search: string;
  factionFilter: string;
  rarityFilter: string;
  typeFilter: string;
  groupByName: boolean;
  onAddCard: (cardId: string, isToken: boolean, qty?: number) => void;
  onRemoveCard?: (cardId: string, isToken: boolean, qty?: number) => void;
}

function CardTile({
  card,
  qty,
  onAdd,
  onRemove,
  disabled,
}: {
  card: Card;
  qty: number;
  onAdd: (cardId: string, isToken: boolean, qty?: number) => void;
  onRemove?: (cardId: string, isToken: boolean, qty?: number) => void;
  disabled?: boolean;
}) {
  const isToken = card.type === "TOKEN" || card.type === "MANA";

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
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden rounded-t-lg bg-muted">
        {card.imageUrl ? (
          <img
            src={card.imageUrl}
            alt={card.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-muted-foreground">
            {card.name.slice(0, 20)}
          </div>
        )}
        <div className="absolute right-1 top-1">
          <Badge variant="secondary">×{qty}</Badge>
        </div>
      </div>
      <div className="p-2">
        <p className="truncate text-sm font-medium">{card.name}</p>
        <div className="flex flex-wrap gap-1">
          <Badge variant="outline" className="text-[10px]">
            {card.faction}
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {card.rarity}
          </Badge>
          <Badge variant="outline" className="text-[10px]">
            {card.type}
          </Badge>
        </div>
      </div>
    </CardUi>
  );
}

export function CollectionGrid({
  entries,
  search,
  factionFilter,
  rarityFilter,
  typeFilter,
  groupByName,
  onAddCard,
  onRemoveCard,
}: CollectionGridProps) {
  const cardsById = useSealedStore((s) => s.cardsById);

  const filtered = useMemo(() => {
    const lower = search.toLowerCase();
    return entries.filter(({ card }) => {
      if (lower && !card.name.toLowerCase().includes(lower)) return false;
      if (factionFilter && card.faction !== factionFilter) return false;
      if (rarityFilter && card.rarity !== rarityFilter) return false;
      if (typeFilter && card.type !== typeFilter) return false;
      return true;
    });
  }, [entries, search, factionFilter, rarityFilter, typeFilter]);

  const toShow = useMemo(() => {
    let list: { card: Card; qty: number }[];
    if (groupByName) {
      const byId = new Map<string, { card: Card; qty: number }>();
      for (const { card, qty } of filtered) {
        const cur = byId.get(card.id);
        if (cur) cur.qty += qty;
        else byId.set(card.id, { card, qty });
      }
      list = Array.from(byId.entries()).map(([, entry]) => entry);
    } else {
      list = filtered.map(({ card, qty }) => ({ card, qty }));
    }

    // Tri : héros par faction, puis cartes par faction puis coût mana croissant
    list.sort((a, b) => {
      const isHeroA = a.card.type === "HERO";
      const isHeroB = b.card.type === "HERO";
      if (isHeroA && !isHeroB) return -1;
      if (!isHeroA && isHeroB) return 1;
      if (isHeroA && isHeroB) {
        return factionIndex(a.card.faction) - factionIndex(b.card.faction);
      }
      const facA = factionIndex(a.card.faction);
      const facB = factionIndex(b.card.faction);
      if (facA !== facB) return facA - facB;
      const costA = a.card.mainCost ?? 999;
      const costB = b.card.mainCost ?? 999;
      return costA - costB;
    });
    return list;
  }, [filtered, groupByName]);

  if (toShow.length === 0) {
    return (
      <p className="py-8 text-center text-muted-foreground">
        Aucune carte à afficher. Ouvrez des boosters ou ajustez les filtres.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {toShow.map(({ card, qty }) => (
        <CardTile
          key={card.id}
          card={card}
          qty={qty}
          onAdd={onAddCard}
          onRemove={onRemoveCard}
        />
      ))}
    </div>
  );
}
