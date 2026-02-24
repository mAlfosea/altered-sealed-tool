export type Rarity = "COMMON" | "RARE" | "UNIQUE" | "TOKEN" | "SPECIAL" | "EXALTED";
export type CardType =
  | "HERO"
  | "CHARACTER"
  | "SPELL"
  | "LANDMARK"
  | "TOKEN"
  | "MANA"
  | "EXPEDITION";

/** Carte normalisée (référence issue de la base Altered TCG Card Database). */
export interface Card {
  /** Identifiant unique (ex: ALT_DUSTER_A_AX_85_C). */
  id: string;
  /** Code extension (ex: DUSTER, DUSTERCB). */
  setCode: string;
  /** Nom en anglais. */
  nameEn: string;
  /** Nom en français. */
  nameFr: string;
  /** URL de l’image (priorité FR). */
  imageUrl: string;
  /** Rareté. */
  rarity: Rarity;
  /** Faction (AX, BR, LY, MU, OR, YZ, NEUTRAL, etc.). */
  faction: string;
  /** Type de carte. */
  type: CardType;
  /** Sous-type(s), séparés par virgule si plusieurs. */
  subtype?: string;
  /** Coût de mana principal (pour le tri). */
  mainCost?: number;
  /** Coût réserve (jouer depuis la réserve / rappel). */
  reserveCost?: number;
}

/** Nom d’affichage (FR par défaut) et pour export Arena. */
export function cardDisplayName(card: Card, locale: "fr" | "en" = "fr"): string {
  return locale === "en" ? card.nameEn : card.nameFr;
}

export interface OwnedCard {
  cardId: string;
  qty: number;
  foilQty?: number;
}

export interface DeckState {
  heroCardId?: string;
  main: Record<string, number>;
  tokens: Record<string, number>;
}
