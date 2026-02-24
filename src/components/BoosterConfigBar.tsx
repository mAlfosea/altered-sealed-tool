"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useSealedStore } from "@/store/useSealedStore";
import { Shuffle } from "lucide-react";

function randomSeed(): string {
  return Math.random().toString(36).slice(2, 12);
}

interface BoosterConfigBarProps {
  /** Mode compact intégré dans le header (une ligne, sans carte) */
  inline?: boolean;
}

export function BoosterConfigBar({ inline }: BoosterConfigBarProps) {
  const seed = useSealedStore((s) => s.seed);
  const setSeed = useSealedStore((s) => s.setSeed);
  const numBoosters = useSealedStore((s) => s.numBoosters);
  const setNumBoosters = useSealedStore((s) => s.setNumBoosters);
  const openBoosters = useSealedStore((s) => s.openBoosters);
  const collection = useSealedStore((s) => s.collection);

  const recap = useMemo(() => {
    let commons = 0;
    let rares = 0;
    let heroes = 0;
    let tokens = 0;
    for (const { card, qty } of Array.from(collection.values())) {
      if (card.type === "HERO") heroes += qty;
      else if (card.type === "TOKEN" || card.type === "MANA") tokens += qty;
      else if (card.rarity === "COMMON") commons += qty;
      else if (card.rarity === "RARE" || card.rarity === "UNIQUE") rares += qty;
    }
    return { commons, rares, heroes, tokens };
  }, [collection]);

  const hasCollection = collection.size > 0;
  const totalCards = collection.size > 0 ? Array.from(collection.values()).reduce((s, e) => s + e.qty, 0) : 0;

  const handleOpenWithRandomSeed = () => openBoosters(true);
  const handleOpenWithCurrentSeed = () => openBoosters(false);

  const controls = (
    <div className={inline ? "flex flex-wrap items-center gap-3" : "flex flex-wrap items-end gap-4"}>
      <div className="flex items-center gap-2">
        <label className="text-sm text-muted-foreground whitespace-nowrap">
          Nombre de booster à ouvrir
        </label>
        <input
          type="number"
          min={1}
          max={50}
          value={numBoosters}
          onChange={(e) => setNumBoosters(Number(e.target.value) || 1)}
          className="h-9 w-16 rounded-md border border-input bg-background px-2 py-1.5 text-sm"
        />
        <Button type="button" size={inline ? "sm" : "default"} onClick={handleOpenWithRandomSeed}>
          Ouvrir
        </Button>
      </div>
      <div className="ml-auto flex items-center gap-2">
        <label className="text-sm text-muted-foreground whitespace-nowrap">
          Utiliser un seed
        </label>
        <Input
          value={seed}
          onChange={(e) => setSeed(e.target.value)}
          className={inline ? "h-9 w-28 font-mono text-sm" : "w-32 font-mono text-sm"}
          placeholder="seed"
        />
        <Button
          type="button"
          variant="outline"
          size="icon"
          className={inline ? "h-9 w-9" : undefined}
          onClick={() => setSeed(randomSeed())}
          title="Nouveau seed aléatoire"
        >
          <Shuffle className="h-4 w-4" />
        </Button>
        <Button type="button" size={inline ? "sm" : "default"} onClick={handleOpenWithCurrentSeed}>
          Ouvrir
        </Button>
      </div>
    </div>
  );

  if (inline) {
    return (
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-4">
          {controls}
        </div>
        {hasCollection && (
          <p className="text-xs text-muted-foreground">
            Récap : <strong>{recap.commons}</strong> communes, <strong>{recap.rares}</strong> rares, <strong>{recap.heroes}</strong> héros, <strong>{recap.tokens}</strong> token(s). ({totalCards} cartes.)
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-card p-4 shadow-sm">
      {controls}
      {hasCollection && (
        <p className="mt-3 text-xs text-muted-foreground">
          Récap : <strong>{recap.commons}</strong> communes, <strong>{recap.rares}</strong> rares, <strong>{recap.heroes}</strong> héros, <strong>{recap.tokens}</strong> token(s). ({totalCards} cartes.)
        </p>
      )}
    </div>
  );
}
