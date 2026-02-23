import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Simulateur Scellé Altered",
  description: "Simulateur de format Scellé pour Altered TCG - Les Graines de l'Unité",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
