# Simulateur Scellé Altered

Application web pour simuler le format **Scellé (Sealed)** du JCC Altered (set **Les Graines de l'Unité** — DUSTER), construire un deck conforme aux règles et exporter une liste compatible **TCG Arena**.

## Prérequis

- **Node.js 18+**
- **pnpm** (recommandé) ou npm

## Installation

```bash
pnpm install
# ou: npm install
```

## Génération des données (cartes DUSTER)

Le jeu de cartes est fourni dans `src/data/duster.cards.json`. Pour le régénérer à partir du site officiel Altered :

```bash
pnpm ingest
# ou: npm run ingest
```

- Le script utilise l’**API officielle Altered** (`api.altered.gg`) pour le set DUSTER : noms, factions, raretés, types et **URLs des images** (hébergées sur le CDN Altered). Aucun scraping nécessaire si l’API répond.
- En secours, le script peut utiliser **Playwright** (headless) ; installez les binaires si besoin : `npx playwright install chromium`.
- La sortie est écrite dans `src/data/duster.cards.json`. Chaque carte a un champ `imageUrl` : l’app affiche les images directement depuis le CDN. Vous pouvez versionner ce fichier pour que l’app fonctionne sans relancer l’ingestion.

## Lancement en développement

```bash
pnpm dev
# ou: npm run dev
```

Ouvrez [http://localhost:3000](http://localhost:3000).

## Build & déploiement (ex. Vercel)

```bash
pnpm build
pnpm start
```

L’app fonctionne **sans backend** : les cartes sont servies en lecture depuis le JSON et l’API route Next.js `/api/cards`.

## Règles du Scellé (implémentées)

- **Deck :** minimum 30 cartes (hors tokens).
- **Tokens / Mana Convergence :** ne comptent pas dans le minimum ; option d’inclure la Mana dans l’export TCG Arena.
- **Factions :** maximum 3 dans le deck.
- **Héros :** optionnel ; s’il est présent, il compte dans les 30 et doit appartenir à une faction du deck.
- Pas de limite de copies par nom ni de limite rare/unique.

## Contenu d’un booster (simulation)

- Slot 1 : Héros (100 %)
- Slots 2–9 : Communes (100 %)
- Slots 10–11 : Rares (100 %)
- Slot 12 : Rare 87,5 % / Unique 12,5 %
- Slot 13 : Jeton 58,3 % / Mana 16,7 %

## Seed & reproductibilité

- Un **seed** (chaîne) permet de reproduire exactement la même ouverture de boosters.
- Utilisez le bouton « Random seed » pour en générer un nouveau, ou saisissez le vôtre avant de cliquer sur **Ouvrir**.

## Export TCG Arena

- **Format :** une ligne par carte : `<quantité> <nom exact>` (ex. `2 Nikola Tesla - AX`).
- **Bouton :** « Exporter TCG Arena » ouvre une modale avec zone de texte, **Copier** et **Télécharger .txt**.
- Par défaut les tokens ne sont pas inclus ; une option « Inclure Mana Convergence » permet d’ajouter les cartes Mana si vous les avez mises dans le deck pour atteindre 30 cartes.

## Commandes utiles

| Commande        | Description                    |
|-----------------|--------------------------------|
| `pnpm dev`      | Serveur de développement       |
| `pnpm build`    | Build de production            |
| `pnpm start`    | Démarrer le build              |
| `pnpm ingest`   | Régénérer `duster.cards.json`   |
| `pnpm test`     | Lancer les tests unitaires     |
| `pnpm lint`     | ESLint                         |
| `pnpm format`   | Prettier                       |

## Structure projet

```
├── src/
│   ├── app/              # Next.js App Router (page, layout, api/cards)
│   ├── components/       # BoosterConfigBar, CollectionGrid, DeckPanel, ExportDialog, FiltersBar, ui/
│   ├── data/             # duster.cards.json (généré par ingest)
│   ├── lib/              # types, rng, booster, deckValidation, exportArena, utils
│   └── store/            # useSealedStore (Zustand + persist)
├── scripts/
│   └── ingest-duster.ts  # Pipeline d’ingestion des cartes DUSTER
├── package.json
└── README.md
```

## Tests

Les tests (Vitest) couvrent notamment :

- **Validation du deck** : minimum 30 cartes, max 3 factions, héros dans une faction du deck.
- **Génération de boosters** : reproductibilité avec seed (snapshot stable).

```bash
pnpm test
```

---

L’app est utilisable en local sans relancer l’ingestion tant que `src/data/duster.cards.json` est présent (par défaut un petit jeu de cartes de démo est fourni).
