"use client";

import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { FACTION_ICONS } from "@/components/FactionIcons";

interface FiltersBarProps {
  search: string;
  onSearch: (v: string) => void;
  activeFactions: string[];
  onFactionsChange: (factions: string[]) => void;
  activeRarities: string[];
  onRaritiesChange: (rarities: string[]) => void;
  activeTypes: string[];
  onTypesChange: (types: string[]) => void;
}

// Couleurs officielles par faction (hex)
const FACTION_OPTIONS: { value: string; label: string; hex: string }[] = [
  { value: "AX", label: "Axiom", hex: "#824e3c" },
  { value: "BR", label: "Bravos", hex: "#cf4841" },
  { value: "LY", label: "Lyra", hex: "#ef7ba6" },
  { value: "MU", label: "Muna", hex: "#629759" },
  { value: "OR", label: "Ordis", hex: "#0f7ea5" },
  { value: "YZ", label: "Yzmir", hex: "#b05dc9" },
];

const RARITY_OPTIONS: { value: string; label: string; shape: string }[] = [
  { value: "COMMON", label: "Commun", shape: "rounded-full" },
  { value: "RARE", label: "Rare", shape: "rounded-sm" },
  { value: "EXALTED", label: "Exalté", shape: "rounded-md" },
  { value: "UNIQUE", label: "Unique", shape: "rounded-lg" },
];

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "HERO", label: "Héro" },
  { value: "CHARACTER", label: "Personnage" },
  { value: "SPELL", label: "Sort" },
  { value: "EXPEDITION", label: "Permanent d'expédition" },
  { value: "LANDMARK", label: "Repère" },
  { value: "TOKEN", label: "Token" },
];

function toggleInSet(current: string[], value: string): string[] {
  if (current.includes(value)) return current.filter((x) => x !== value);
  return [...current, value];
}

export function FiltersBar(props: FiltersBarProps) {
  const {
    search,
    onSearch,
    activeFactions,
    onFactionsChange,
    activeRarities,
    onRaritiesChange,
    activeTypes,
    onTypesChange,
  } = props;

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-3">
      {/* Ligne 1 : Recherche par nom + Rareté (centré) */}
      <div className="flex flex-wrap items-center justify-center gap-5">
        <div className="relative w-96 min-w-[160px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Recherche par nom"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider shrink-0">Rareté</span>
          {RARITY_OPTIONS.map((opt) => {
            const active = activeRarities.includes(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onRaritiesChange(toggleInSet(activeRarities, opt.value))}
                className={cn(
                  "px-3 py-1.5 text-sm font-medium transition-all border",
                  opt.shape,
                  active
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/60 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground"
                )}
                title={opt.label}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Ligne 2 : Factions + Types (même ligne, centré) */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider shrink-0">Factions</span>
        {FACTION_OPTIONS.map((opt) => {
          const active = activeFactions.includes(opt.value);
          const Icon = FACTION_ICONS[opt.value];
          return (
            <button
              key={opt.value}
              type="button"
              title={opt.label}
              onClick={() => onFactionsChange(toggleInSet(activeFactions, opt.value))}
              className={cn(
                "p-2 rounded-lg border transition-all flex items-center justify-center",
                active
                  ? "ring-2 ring-offset-2 ring-offset-card ring-white/80 hover:brightness-110"
                  : "bg-gray-200 border-gray-300 hover:bg-gray-300"
              )}
              style={active ? { backgroundColor: opt.hex, borderColor: opt.hex } : undefined}
            >
              {Icon && (
                <Icon
                  className={active ? "text-white" : undefined}
                  style={!active ? { color: opt.hex } : undefined}
                />
              )}
            </button>
          );
        })}
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider shrink-0">Types</span>
        {TYPE_OPTIONS.map((opt) => {
          const active = activeTypes.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => onTypesChange(toggleInSet(activeTypes, opt.value))}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-lg border transition-all",
                active
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-muted/60 text-muted-foreground border-transparent hover:bg-muted hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
