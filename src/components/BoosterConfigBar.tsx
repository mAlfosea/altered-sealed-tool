"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSealedStore } from "@/store/useSealedStore";
import { getBoostersPerDeck } from "@/lib/booster";
import { Shuffle } from "lucide-react";

function randomSeed(): string {
  return Math.random().toString(36).slice(2, 12);
}

export function BoosterConfigBar() {
  const seed = useSealedStore((s) => s.seed);
  const setSeed = useSealedStore((s) => s.setSeed);
  const numDecks = useSealedStore((s) => s.numDecks);
  const setNumDecks = useSealedStore((s) => s.setNumDecks);
  const openBoosters = useSealedStore((s) => s.openBoosters);
  const collection = useSealedStore((s) => s.collection);
  const boostersPerDeck = getBoostersPerDeck();
  const totalBoosters = numDecks * boostersPerDeck;

  const recap = useMemo(() => {
    let commons = 0;
    let rares = 0;
    let heroes = 0;
    let tokens = 0;
    for (const { card, qty } of collection.values()) {
      if (card.type === "HERO") heroes += qty;
      else if (card.type === "TOKEN" || card.type === "MANA") tokens += qty;
      else if (card.rarity === "COMMON") commons += qty;
      else if (card.rarity === "RARE" || card.rarity === "UNIQUE") rares += qty;
    }
    return { commons, rares, heroes, tokens };
  }, [collection]);

  const hasCollection = collection.size > 0;

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-end gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">
          Nombre de decks
        </label>
        <input
          type="number"
          min={1}
          max={50}
          value={numDecks}
          onChange={(e) => setNumDecks(Number(e.target.value) || 1)}
          className="h-10 w-20 rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">
          {totalBoosters} booster{totalBoosters > 1 ? "s" : ""} ({numDecks} × {boostersPerDeck})
        </span>
      </div>
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium text-muted-foreground">
          Seed
        </label>
        <div className="flex gap-2">
          <Input
            value={seed}
            onChange={(e) => setSeed(e.target.value)}
            className="w-32 font-mono text-sm"
            placeholder="seed"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setSeed(randomSeed())}
            title="Random seed"
          >
            <Shuffle className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <Button onClick={openBoosters}>Ouvrir</Button>
      </div>
      {hasCollection && (
        <p className="mt-3 text-xs text-muted-foreground">
          Récap : <strong>{recap.commons}</strong> communes, <strong>{recap.rares}</strong> rares, <strong>{recap.heroes}</strong> héros, <strong>{recap.tokens}</strong> token(s). ({totalBoosters} booster{totalBoosters > 1 ? "s" : ""} = {totalBoosters * 8} communes + {totalBoosters * 3} rares + {totalBoosters} héros + {totalBoosters} token/mana.)
        </p>
      )}
    </div>
  );
}
