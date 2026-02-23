"use client";

import { useMemo } from "react";
import type { Card } from "@/lib/types";
import { cardDisplayName } from "@/lib/types";

export interface AnchorRect {
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

interface CardHoverPreviewProps {
  card: Card | null;
  /** Rectangle de l’élément survolé (getBoundingClientRect). La preview se place à droite ou à gauche selon la place. */
  anchorRect: AnchorRect | null;
  className?: string;
}

const PREVIEW_WIDTH = 420;
const PREVIEW_HEIGHT = 560; // 4/3
const GAP = 12;

/** Aperçu d’une carte en grand au survol (liste boosters ou deck), positionné à côté de l’élément survolé. */
export function CardHoverPreview({ card, anchorRect, className = "" }: CardHoverPreviewProps) {
  const style = useMemo(() => {
    if (!card || !anchorRect || typeof window === "undefined")
      return undefined;

    const spaceOnRight = window.innerWidth - anchorRect.right >= PREVIEW_WIDTH + GAP;
    const spaceOnLeft = anchorRect.left >= PREVIEW_WIDTH + GAP;

    let left: number;
    if (spaceOnRight) {
      left = anchorRect.right + GAP;
    } else if (spaceOnLeft) {
      left = anchorRect.left - PREVIEW_WIDTH - GAP;
    } else {
      left = anchorRect.right + GAP;
    }

    let top = anchorRect.top + anchorRect.height / 2 - PREVIEW_HEIGHT / 2;
    top = Math.max(GAP, Math.min(window.innerHeight - PREVIEW_HEIGHT - GAP, top));

    return {
      position: "fixed" as const,
      left: `${left}px`,
      top: `${top}px`,
      width: `${PREVIEW_WIDTH}px`,
      height: `${PREVIEW_HEIGHT}px`,
      zIndex: 50,
    };
  }, [card, anchorRect]);

  if (!card) return null;

  return (
    <div
      role="img"
      aria-label={cardDisplayName(card)}
      className={`pointer-events-none overflow-hidden rounded-lg shadow-xl transition-opacity duration-150 ${className}`}
      style={style}
    >
      {card.imageUrl ? (
        <img
          src={card.imageUrl}
          alt={cardDisplayName(card)}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-muted p-4 text-center text-sm text-muted-foreground">
          {cardDisplayName(card)}
        </div>
      )}
    </div>
  );
}
