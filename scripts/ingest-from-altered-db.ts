/**
 * Import des cartes depuis la base Altered TCG Card Database (GitHub).
 * https://github.com/PolluxTroy0/Altered-TCG-Card-Database
 *
 * Télécharge les sets Seed of Unity (DUSTER, DUSTERCB, DUSTEROP, DUSTERTOP)
 * en EN et FR, fusionne par référence et produit un JSON normalisé.
 *
 * Usage: pnpm run ingest (ou npx tsx scripts/ingest-from-altered-db.ts)
 */

import * as fs from "fs";
import * as path from "path";

const BASE_URL =
  "https://raw.githubusercontent.com/PolluxTroy0/Altered-TCG-Card-Database/main/SETS";
const OUT_PATH = path.join(process.cwd(), "src", "data", "duster.cards.json");

/** Format API Altered (un élément du tableau dans SETS/XXX/XXX_EN.json). */
interface AlteredApiCard {
  reference: string;
  name: string;
  cardType?: { reference: string; name: string };
  cardSubTypes?: Array<{ reference: string; name: string }>;
  cardSet?: { reference: string; name: string };
  rarity?: { reference: string };
  mainFaction?: { reference: string; name: string };
  imagePath?: string;
  allImagePath?: Record<string, string>;
  elements?: { MAIN_COST?: string; RESERVE_COST?: string; RECALL_COST?: string };
}

/** Carte normalisée pour l’outil. */
interface NormalizedCard {
  id: string;
  setCode: string;
  nameEn: string;
  nameFr: string;
  imageUrl: string;
  rarity: string;
  faction: string;
  type: string;
  subtype?: string;
  mainCost?: number;
  reserveCost?: number;
}

const API_TYPE_TO_OUR: Record<string, string> = {
  HERO: "HERO",
  CHARACTER: "CHARACTER",
  SPELL: "SPELL",
  LANDMARK: "LANDMARK",
  LANDMARK_PERMANENT: "LANDMARK",
  TOKEN: "TOKEN",
  TOKEN_MANA: "MANA",
  TOKEN_LANDMARK_PERMANENT: "TOKEN",
  EXPEDITION_PERMANENT: "EXPEDITION",
  PERMANENT: "CHARACTER",
  FOILER: "CHARACTER",
};

const SETS_SEED_OF_UNITY = ["DUSTER", "DUSTERCB", "DUSTEROP", "DUSTERTOP"];

function mapType(apiRef: string): string {
  return API_TYPE_TO_OUR[apiRef] ?? "CHARACTER";
}

function mapRarity(apiRef: string): string {
  const r = (apiRef ?? "").toUpperCase();
  if (r === "COMMON" || r === "RARE" || r === "UNIQUE" || r === "EXALTED") return r;
  if (r === "TOKEN" || r === "SPECIAL") return r;
  return "COMMON";
}

async function fetchSet(setCode: string, lang: "EN" | "FR"): Promise<AlteredApiCard[]> {
  const url = `${BASE_URL}/${setCode}/${setCode}_${lang}.json`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${url}`);
  const data = (await res.json()) as AlteredApiCard[];
  return Array.isArray(data) ? data : [];
}

function toNormalized(
  en: AlteredApiCard,
  fr: AlteredApiCard | undefined,
  setCode: string
): NormalizedCard {
  const nameEn = en.name ?? "";
  const nameFr = fr?.name ?? nameEn;
  const imageUrl =
    en.allImagePath?.["fr-fr"] ||
    fr?.allImagePath?.["fr-fr"] ||
    en.allImagePath?.["en-us"] ||
    en.imagePath ||
    fr?.imagePath ||
    "";
  const typeRef = en.cardType?.reference ?? "CHARACTER";
  const mainCost =
    en.elements?.MAIN_COST != null
      ? parseInt(en.elements.MAIN_COST, 10)
      : undefined;
  const mainCostValid =
    mainCost != null && !Number.isNaN(mainCost) ? mainCost : undefined;
  const reserveCostRaw =
    en.elements?.RESERVE_COST != null
      ? parseInt(en.elements.RESERVE_COST, 10)
      : en.elements?.RECALL_COST != null
        ? parseInt(en.elements.RECALL_COST, 10)
        : undefined;
  const reserveCostValid =
    reserveCostRaw != null && !Number.isNaN(reserveCostRaw) ? reserveCostRaw : undefined;

  // Déduire le coût manquant : la base Altered ne fournit pas toujours les deux.
  // Si un seul est présent, on utilise la même valeur pour l'autre (convention courante).
  const mappedType = mapType(typeRef);
  const needsCosts =
    mappedType !== "HERO" && mappedType !== "MANA" && mappedType !== "TOKEN";
  let mainCostOut = mainCostValid;
  let reserveCostOut = reserveCostValid;
  if (needsCosts) {
    if (mainCostOut != null && reserveCostOut == null) reserveCostOut = mainCostOut;
    if (reserveCostOut != null && mainCostOut == null) mainCostOut = reserveCostOut;
  } else if (mainCostOut == null && reserveCostOut == null) {
    mainCostOut = 0;
    reserveCostOut = 0;
  }

  const subtype =
    (en.cardSubTypes ?? [])
      .map((s) => s.reference ?? s.name)
      .filter(Boolean)
      .join(", ") || undefined;
  return {
    id: en.reference,
    setCode,
    nameEn,
    nameFr,
    imageUrl,
    rarity: mapRarity(en.rarity?.reference ?? "COMMON"),
    faction: en.mainFaction?.reference ?? "NEUTRAL",
    type: mapType(typeRef),
    subtype: subtype || undefined,
    mainCost: mainCostOut,
    reserveCost: reserveCostOut,
  };
}

async function main(): Promise<void> {
  console.log("Import depuis Altered TCG Card Database (GitHub)...");
  const byRef = new Map<string, { en: AlteredApiCard; fr?: AlteredApiCard; setCode: string }>();

  for (const setCode of SETS_SEED_OF_UNITY) {
    try {
      const [enList, frList] = await Promise.all([
        fetchSet(setCode, "EN"),
        fetchSet(setCode, "FR"),
      ]);
      const frByRef = new Map(frList.map((c) => [c.reference, c]));
      for (const en of enList) {
        if (!en.reference) continue;
        byRef.set(en.reference, {
          en,
          fr: frByRef.get(en.reference),
          setCode: en.cardSet?.reference ?? setCode,
        });
      }
      console.log(`  ${setCode}: ${enList.length} cartes (EN), ${frList.length} (FR)`);
    } catch (e) {
      console.warn(`  ${setCode}: erreur`, e);
    }
  }

  const cards: NormalizedCard[] = [];
  for (const { en, fr, setCode } of byRef.values()) {
    cards.push(toNormalized(en, fr, setCode));
  }

  // Tri: par setCode, puis par type (héros en premier), faction, mainCost, id
  const typeOrder: Record<string, number> = {
    HERO: 0,
    CHARACTER: 1,
    SPELL: 2,
    LANDMARK: 3,
    EXPEDITION: 4,
    TOKEN: 5,
    MANA: 6,
  };
  cards.sort((a, b) => {
    if (a.setCode !== b.setCode) return a.setCode.localeCompare(b.setCode);
    const ta = typeOrder[a.type] ?? 99;
    const tb = typeOrder[b.type] ?? 99;
    if (ta !== tb) return ta - tb;
    if (a.faction !== b.faction) return a.faction.localeCompare(b.faction);
    const ca = a.mainCost ?? 999;
    const cb = b.mainCost ?? 999;
    if (ca !== cb) return ca - cb;
    return a.id.localeCompare(b.id);
  });

  const dir = path.dirname(OUT_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(cards, null, 2), "utf-8");
  console.log(`Écrit ${cards.length} cartes dans ${OUT_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
