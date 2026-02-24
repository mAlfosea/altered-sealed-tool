"use client";

import { useEffect, useState } from "react";
import { BoosterConfigBar } from "components/BoosterConfigBar";
import { FiltersBar } from "components/FiltersBar";
import { CollectionGrid } from "components/CollectionGrid";
import { DeckPanel } from "components/DeckPanel";
import { ExportDialog } from "components/ExportDialog";
import { Button } from "components/ui/button";
import { useSealedStore } from "store/useSealedStore";
import type { Card } from "lib/types";
import type { CollectionEntry } from "store/useSealedStore";

export default function Home() {
  const [search, setSearch] = useState("");
  const [activeFactions, setActiveFactions] = useState<string[]>([]);
  const [activeRarities, setActiveRarities] = useState<string[]>([]);
  const [activeTypes, setActiveTypes] = useState<string[]>([]);
  const [exportOpen, setExportOpen] = useState(false);
  const [cardsLoaded, setCardsLoaded] = useState(false);

  const initCards = useSealedStore((s) => s.initCards);
  const collection = useSealedStore((s) => s.collection);
  const openBoosters = useSealedStore((s) => s.openBoosters);
  const validate = useSealedStore((s) => s.validate);
  const addToDeck = useSealedStore((s) => s.addToDeck);
  const removeFromDeck = useSealedStore((s) => s.removeFromDeck);

  useEffect(() => {
    fetch("/api/cards")
      .then((res) => res.json())
      .then((data: Card[]) => {
        if (Array.isArray(data) && data.length > 0) {
          initCards(data);
        }
        setCardsLoaded(true);
      })
      .catch(() => setCardsLoaded(true));
  }, [initCards]);

  useEffect(() => {
    validate();
  }, [validate]);

  const collectionEntries: CollectionEntry[] = Array.from(collection.values());

  return (
    <div className="flex h-screen flex-col bg-background overflow-hidden">
      <header className="shrink-0 border-b bg-card px-4 py-3">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold">Simulateur Scellé Altered</h1>
            <p className="text-sm text-muted-foreground">
              Les Graines de l&apos;Unité (DUSTER) — Ouvrez des boosters, construisez votre deck, exportez pour TCG Arena.
            </p>
          </div>
          <div className="min-w-0 shrink-0">
            <BoosterConfigBar inline />
          </div>
        </div>
      </header>

      <main className="flex min-h-0 flex-1 flex-col mx-auto w-full max-w-[1600px] px-4 pt-4 overflow-hidden">
        {!cardsLoaded ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-muted-foreground">Chargement des cartes…</p>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 gap-4 overflow-hidden">
            <div className="flex min-h-0 flex-1 flex-col min-w-0 overflow-hidden">
              <div className="shrink-0 mb-3">
                <FiltersBar
                  search={search}
                  onSearch={setSearch}
                  activeFactions={activeFactions}
                  onFactionsChange={setActiveFactions}
                  activeRarities={activeRarities}
                  onRaritiesChange={setActiveRarities}
                  activeTypes={activeTypes}
                  onTypesChange={setActiveTypes}
                />
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto">
                <CollectionGrid
                  entries={collectionEntries}
                  search={search}
                  activeFactions={activeFactions}
                  activeRarities={activeRarities}
                  activeTypes={activeTypes}
                  onAddCard={addToDeck}
                  onRemoveCard={removeFromDeck}
                />
              </div>
            </div>
            <aside className="flex h-full w-80 shrink-0 flex-col min-h-0">
              <DeckPanel onExportClick={() => setExportOpen(true)} />
            </aside>
          </div>
        )}
      </main>

      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} />
    </div>
  );
}
