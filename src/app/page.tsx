"use client";

import { useEffect, useState } from "react";
import { BoosterConfigBar } from "@/components/BoosterConfigBar";
import { FiltersBar } from "@/components/FiltersBar";
import { CollectionGrid } from "@/components/CollectionGrid";
import { DeckPanel } from "@/components/DeckPanel";
import { ExportDialog } from "@/components/ExportDialog";
import { Button } from "@/components/ui/button";
import { useSealedStore } from "@/store/useSealedStore";
import type { Card } from "@/lib/types";
import type { CollectionEntry } from "@/store/useSealedStore";
import { Download } from "lucide-react";

export default function Home() {
  const [search, setSearch] = useState("");
  const [factionFilter, setFactionFilter] = useState("");
  const [rarityFilter, setRarityFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [groupByName, setGroupByName] = useState(true);
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
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card px-4 py-3">
        <h1 className="text-xl font-bold">Simulateur Scellé Altered</h1>
        <p className="text-sm text-muted-foreground">
          Les Graines de l&apos;Unité (DUSTER) — Ouvrez des boosters, construisez votre deck, exportez pour TCG Arena.
        </p>
      </header>

      <main className="mx-auto max-w-[1600px] px-4 py-4">
        <div className="mb-4">
          <BoosterConfigBar />
        </div>

        {!cardsLoaded ? (
          <p className="py-8 text-center text-muted-foreground">
            Chargement des cartes…
          </p>
        ) : (
          <div className="flex gap-4">
            <div className="flex-1 min-w-0">
              <div className="mb-3">
                <FiltersBar
                  search={search}
                  onSearch={setSearch}
                  factionFilter={factionFilter}
                  onFactionFilter={setFactionFilter}
                  rarityFilter={rarityFilter}
                  onRarityFilter={setRarityFilter}
                  typeFilter={typeFilter}
                  onTypeFilter={setTypeFilter}
                  groupByName={groupByName}
                  onGroupByName={setGroupByName}
                />
              </div>
              <CollectionGrid
                entries={collectionEntries}
                search={search}
                factionFilter={factionFilter}
                rarityFilter={rarityFilter}
                typeFilter={typeFilter}
                groupByName={groupByName}
                onAddCard={addToDeck}
                onRemoveCard={removeFromDeck}
              />
            </div>
            <aside className="w-80 shrink-0">
              <DeckPanel />
              <Button
                className="mt-3 w-full"
                variant="outline"
                onClick={() => setExportOpen(true)}
              >
                <Download className="mr-2 h-4 w-4" />
                Exporter TCG Arena
              </Button>
            </aside>
          </div>
        )}
      </main>

      <ExportDialog open={exportOpen} onOpenChange={setExportOpen} />
    </div>
  );
}
