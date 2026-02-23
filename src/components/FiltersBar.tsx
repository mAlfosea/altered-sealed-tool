"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface FiltersBarProps {
  search: string;
  onSearch: (v: string) => void;
  factionFilter: string;
  onFactionFilter: (v: string) => void;
  rarityFilter: string;
  onRarityFilter: (v: string) => void;
  typeFilter: string;
  onTypeFilter: (v: string) => void;
  groupByName: boolean;
  onGroupByName: (v: boolean) => void;
}

const FACTIONS = ["AX", "BR", "LY", "NEUTRAL", ""];
const RARITIES = ["COMMON", "RARE", "UNIQUE", "TOKEN", "SPECIAL", ""];
const TYPES = ["HERO", "CHARACTER", "SPELL", "LANDMARK", "TOKEN", "MANA", ""];

export function FiltersBar(props: FiltersBarProps) {
  const {
    search,
    onSearch,
    factionFilter,
    onFactionFilter,
    rarityFilter,
    onRarityFilter,
    typeFilter,
    onTypeFilter,
    groupByName,
    onGroupByName,
  } = props;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-lg border bg-card p-3">
      <div className="relative min-w-[180px] flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => onSearch(e.target.value)}
          placeholder="Rechercher une carte"
          className="pl-9"
        />
      </div>
      <select
        value={factionFilter}
        onChange={(e) => onFactionFilter(e.target.value)}
        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="">Toutes factions</option>
        {FACTIONS.filter(Boolean).map((f) => (
          <option key={f} value={f}>
            {f}
          </option>
        ))}
      </select>
      <select
        value={rarityFilter}
        onChange={(e) => onRarityFilter(e.target.value)}
        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="">Toutes raretés</option>
        {RARITIES.filter(Boolean).map((r) => (
          <option key={r} value={r}>
            {r}
          </option>
        ))}
      </select>
      <select
        value={typeFilter}
        onChange={(e) => onTypeFilter(e.target.value)}
        className="h-10 rounded-md border border-input bg-background px-3 text-sm"
      >
        <option value="">Tous types</option>
        {TYPES.filter(Boolean).map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={groupByName}
          onChange={(e) => onGroupByName(e.target.checked)}
          className="rounded border-input"
        />
        Regrouper par nom
      </label>
    </div>
  );
}
