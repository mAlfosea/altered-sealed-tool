/**
 * Couleurs officielles par faction Altered (bordure + fond liste du deck).
 * Axiom, Yzmir, Bravos, Ordis, Muna, Lyra + Neutre.
 */
const FACTION_HEX: Record<string, string> = {
  AX: "#824e3c",   // Axiom
  YZ: "#b05dc9",   // Yzmir
  BR: "#cf4841",   // Bravos
  OR: "#0f7ea5",   // Ordis
  MU: "#629759",   // Muna
  LY: "#ef7ba6",   // Lyra
  NEUTRAL: "#64748b",
  NE: "#64748b",
};

/** RGB (pour rgba) dérivés des hex. */
const FACTION_RGB: Record<string, string> = {
  AX: "130, 78, 60",
  YZ: "176, 93, 201",
  BR: "207, 72, 65",
  OR: "15, 126, 165",
  MU: "98, 151, 89",
  LY: "239, 123, 166",
  NEUTRAL: "100, 116, 139",
  NE: "100, 116, 139",
};

export function getFactionBorderClass(faction: string): string {
  return "border-l-4";
}

/** Style inline pour la bordure gauche (couleur exacte). */
export function getFactionBorderStyle(faction: string): { borderLeftColor: string } {
  const hex = FACTION_HEX[faction] ?? FACTION_HEX.NEUTRAL;
  return { borderLeftColor: hex };
}

/** Style inline pour le fond teinté. */
export function getFactionBgStyle(faction: string): { backgroundColor: string } {
  const rgb = FACTION_RGB[faction] ?? FACTION_RGB.NEUTRAL;
  return { backgroundColor: `rgba(${rgb}, 0.75)` };
}
