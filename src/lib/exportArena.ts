import type { Card, DeckState, Rarity } from "./types";
import { cardDisplayName } from "./types";

export interface ExportOptions {
  includeTokens: boolean;
  includeManaConvergence: boolean;
}

const DEFAULT_OPTIONS: ExportOptions = {
  includeTokens: false,
  includeManaConvergence: false,
};

/** Raretés nécessitant l'ajout du code faction pour distinguer les versions dans TCG Arena. */
const RARE_RARITIES = new Set<Rarity>(["RARE", "UNIQUE", "EXALTED"]);

/**
 * Nom d'export pour TCG Arena.
 * Les cartes rares/uniques/exaltées ont plusieurs versions par faction :
 * on ajoute " - FACTION" pour les différencier (ex: "Talos - OR", "Talos - AX").
 */
function arenaCardName(card: Card, locale: "fr" | "en"): string {
  const name = cardDisplayName(card, locale);
  return RARE_RARITIES.has(card.rarity) ? `${name} - ${card.faction}` : name;
}

/**
 * Produit la liste texte au format TCG Arena : une ligne par carte "<quantité> <nom exact>".
 * Utilise le nom anglais pour l'export.
 */
export function exportToArenaFormat(
  deck: DeckState,
  cardsById: Map<string, Card>,
  options: Partial<ExportOptions> = {}
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const lines: string[] = [];

  if (deck.heroCardId && deck.main[deck.heroCardId] !== undefined) {
    const hero = cardsById.get(deck.heroCardId);
    const qty = deck.main[deck.heroCardId] ?? 0;
    if (hero && qty > 0) {
      lines.push(`${qty} ${arenaCardName(hero, "en")}`);
    }
  }

  for (const [cardId, qty] of Object.entries(deck.main)) {
    if (qty <= 0 || cardId === deck.heroCardId) continue;
    const card = cardsById.get(cardId);
    if (!card) continue;
    if (card.type === "TOKEN" && !opts.includeTokens) continue;
    if (card.type === "MANA" && !opts.includeManaConvergence) continue;
    lines.push(`${qty} ${arenaCardName(card, "en")}`);
  }

  if (opts.includeTokens || opts.includeManaConvergence) {
    for (const [cardId, qty] of Object.entries(deck.tokens)) {
      if (qty <= 0) continue;
      const card = cardsById.get(cardId);
      if (!card) continue;
      if (card.type === "TOKEN" && !opts.includeTokens) continue;
      if (card.type === "MANA" && !opts.includeManaConvergence) continue;
      lines.push(`${qty} ${arenaCardName(card, "en")}`);
    }
  }

  return lines.join("\n");
}
