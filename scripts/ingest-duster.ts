/**
 * Pipeline d'ingestion des cartes du set DUSTER (Les Graines de l'Unité).
 * Produit src/data/duster.cards.json pour usage dans l'app.
 *
 * Usage: pnpm ingest  (ou npm run ingest)
 */

import * as fs from "fs";
import * as path from "path";

const OUT_PATH = path.join(
  process.cwd(),
  "src",
  "data",
  "duster.cards.json"
);
const CACHE_DIR = path.join(process.cwd(), "scripts", ".ingest-cache");
const DUSTER_URL =
  "https://www.altered.gg/fr-fr/cards?cardSet[]=DUSTER";

interface RawCard {
  id: string;
  name: string;
  arenaName?: string;
  setCode: string;
  faction: string;
  rarity: string;
  type: string;
  imageUrl: string;
  mainCost?: number;
}

const RARITY_MAP: Record<string, string> = {
  common: "COMMON",
  rare: "RARE",
  unique: "UNIQUE",
  token: "TOKEN",
  special: "SPECIAL",
};

const TYPE_MAP: Record<string, string> = {
  hero: "HERO",
  character: "CHARACTER",
  spell: "SPELL",
  landmark: "LANDMARK",
  token: "TOKEN",
  mana: "MANA",
  "mana convergence": "MANA",
};

function normalizeRarity(r: string): string {
  const key = r?.toLowerCase?.()?.trim?.() ?? "";
  return RARITY_MAP[key] ?? "COMMON";
}

function normalizeType(t: string): string {
  const key = t?.toLowerCase?.()?.trim?.() ?? "";
  return TYPE_MAP[key] ?? "CHARACTER";
}

const API_BASE = "https://api.altered.gg/cards";
const ITEMS_PER_PAGE = 100;
const LANG = "fr-fr"; // pour noms et images FR

interface AlteredApiCard {
  reference: string;
  name: string;
  imagePath?: string;
  allImagePath?: Record<string, string>;
  cardType?: { reference: string };
  mainFaction?: { reference: string };
  rarity?: { reference: string };
  elements?: { MAIN_COST?: string };
}

interface AlteredApiResponse {
  "hydra:member"?: AlteredApiCard[];
  "hydra:totalItems"?: number;
}

async function fetchAlteredApiPage(page: number): Promise<AlteredApiResponse> {
  const url = `${API_BASE}?rarity[]=COMMON&rarity[]=RARE&rarity[]=UNIQUE&itemsPerPage=${ITEMS_PER_PAGE}&page=${page}&cardSet.reference[]=DUSTER`;
  const res = await fetch(url, {
    headers: { "Accept-Language": "fr-fr", Accept: "application/ld+json" },
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json() as Promise<AlteredApiResponse>;
}

async function tryFetchApi(): Promise<RawCard[] | null> {
  try {
    const all: RawCard[] = [];
    let page = 1;
    let total = 1;
    do {
      const data = await fetchAlteredApiPage(page);
      const members = data["hydra:member"] ?? [];
      if (page === 1) total = data["hydra:totalItems"] ?? members.length;
      for (const c of members) {
        const imageUrl =
          c.allImagePath?.[LANG] ??
          c.allImagePath?.["en-us"] ??
          c.imagePath ??
          "";
        const parsedCost = c.elements?.MAIN_COST != null
          ? parseInt(c.elements.MAIN_COST, 10)
          : NaN;
        const mainCost = Number.isNaN(parsedCost) ? undefined : parsedCost;
        all.push({
          id: c.reference,
          name: c.name ?? "Sans nom",
          setCode: "DUSTER",
          faction: c.mainFaction?.reference ?? "NEUTRAL",
          rarity: c.rarity?.reference ?? "COMMON",
          type: c.cardType?.reference ?? "CHARACTER",
          imageUrl,
          mainCost,
        });
      }
      if (members.length < ITEMS_PER_PAGE) break;
      page++;
    } while (page <= Math.ceil(total / ITEMS_PER_PAGE));
    return all.length > 0 ? all : null;
  } catch (e) {
    console.warn("API Altered (api.altered.gg) indisponible:", e);
    return null;
  }
}

async function scrapeWithPlaywright(): Promise<RawCard[]> {
  const { chromium } = await import("@playwright/test");
  const cards: RawCard[] = [];
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage();
    await page.goto(DUSTER_URL, { waitUntil: "networkidle", timeout: 30000 });

    const cardSelectors = [
      '[data-card-id]',
      "[data-testid='card']",
      ".card-item",
      "article.card",
      "[class*='card']",
    ];

    let found = false;
    for (const sel of cardSelectors) {
      const els = await page.$$(sel);
      if (els.length > 0) {
        found = true;
        for (const el of els) {
          try {
            const id =
              (await el.getAttribute("data-card-id")) ||
              (await el.getAttribute("data-id")) ||
              "";
            const name =
              (await el.$eval("h2, h3, [class*='name'], [class*='title']", (e) =>
                (e as HTMLElement).textContent?.trim()
              ).catch(() => null)) ||
              (await el.textContent())?.slice(0, 100) ||
              "Unknown";
            const img = await el.$("img").catch(() => null);
            const imageUrl = img
              ? await img.getAttribute("src").catch(() => "") ?? ""
              : "";
            const faction =
              (await el.getAttribute("data-faction")) ||
              (await el
                .$eval("[class*='faction']", (e) =>
                  (e as HTMLElement).textContent?.trim()
                )
                .catch(() => null)) ||
              "";
            const rarity =
              (await el.getAttribute("data-rarity")) ||
              (await el
                .$eval("[class*='rarity']", (e) =>
                  (e as HTMLElement).textContent?.trim()
                )
                .catch(() => null)) ||
              "COMMON";
            const type =
              (await el.getAttribute("data-type")) ||
              (await el
                .$eval("[class*='type']", (e) =>
                  (e as HTMLElement).textContent?.trim()
                )
                .catch(() => null)) ||
              "CHARACTER";

            if (id || name !== "Unknown") {
              cards.push({
                id: id || `gen-${cards.length}-${name.replace(/\s/g, "-")}`,
                name,
                setCode: "DUSTER",
                faction: faction || "NEUTRAL",
                rarity,
                type,
                imageUrl,
              });
            }
          } catch (_) {
            // skip malformed card
          }
        }
        break;
      }
    }

    if (!found || cards.length < 10) {
      const bodyText = await page.evaluate(() => document.body.innerText);
      const possibleJson = bodyText.match(
        /<script[^>]*>[\s\S]*?(\{[\s\S]*?"cards"[\s\S]*?\})[\s\S]*?<\/script>/i
      );
      if (possibleJson) {
        try {
          const parsed = JSON.parse(possibleJson[1]!);
          const list = parsed.cards ?? parsed.data ?? parsed;
          if (Array.isArray(list)) {
            list.forEach((c: Record<string, unknown>) => {
              cards.push({
                id: String(c.id ?? c.slug ?? cards.length),
                name: String(c.name ?? c.title ?? ""),
                arenaName: c.arenaName ? String(c.arenaName) : undefined,
                setCode: "DUSTER",
                faction: String(c.faction ?? c.factions?.[0] ?? "NEUTRAL"),
                rarity: String(c.rarity ?? "COMMON"),
                type: String(c.type ?? c.cardType ?? "CHARACTER"),
                imageUrl: String(c.imageUrl ?? c.image ?? c.art ?? ""),
              });
            });
          }
        } catch (_) {
          // ignore
        }
      }
    }

    const scrollHeight = await page.evaluate(() => document.body.scrollHeight);
    for (let i = 0; i < Math.min(scrollHeight / 800, 15); i++) {
      await page.evaluate(() =>
        window.scrollBy(0, window.innerHeight)
      );
      await new Promise((r) => setTimeout(r, 500));
    }
  } finally {
    await browser.close();
  }

  return cards;
}

function toCanonicalCard(raw: RawCard): {
  id: string;
  name: string;
  arenaName: string;
  setCode: "DUSTER";
  faction: string;
  rarity: string;
  type: string;
  imageUrl: string;
  mainCost?: number;
} {
  const id =
    raw.id ||
    `${raw.setCode}-${raw.name.replace(/\s+/g, "-").replace(/[^a-zA-Z0-9-]/g, "")}-${Math.random().toString(36).slice(2, 9)}`;
  return {
    id,
    name: raw.name || "Sans nom",
    arenaName: raw.arenaName ?? raw.name ?? "Sans nom",
    setCode: "DUSTER",
    faction: raw.faction || "NEUTRAL",
    rarity: normalizeRarity(raw.rarity),
    type: normalizeType(raw.type),
    imageUrl: raw.imageUrl || "",
    mainCost: raw.mainCost,
  };
}

async function main(): Promise<void> {
  console.log("Ingestion DUSTER...");
  if (!fs.existsSync(path.dirname(OUT_PATH))) {
    fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  }
  if (!fs.existsSync(CACHE_DIR)) {
    fs.mkdirSync(CACHE_DIR, { recursive: true });
  }

  let rawCards: RawCard[] | null = await tryFetchApi();
  if (!rawCards || rawCards.length < 5) {
    console.log("API non disponible, tentative avec Playwright...");
    try {
      rawCards = await scrapeWithPlaywright();
    } catch (e) {
      console.error("Échec ingestion:", e);
      process.exit(1);
    }
  }

  if (!rawCards || rawCards.length === 0) {
    console.warn("Aucune carte récupérée. Conservation du fichier existant.");
    process.exit(0);
  }

  const canonical = rawCards.map(toCanonicalCard);
  fs.writeFileSync(OUT_PATH, JSON.stringify(canonical, null, 2), "utf-8");
  console.log(`Écrit ${canonical.length} cartes dans ${OUT_PATH}`);
}

main();
