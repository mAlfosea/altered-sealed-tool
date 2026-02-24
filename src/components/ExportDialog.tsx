"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { X } from "lucide-react";
import { exportToArenaFormat } from "../lib/exportArena";
import { useSealedStore } from "../store/useSealedStore";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportDialog({ open, onOpenChange }: ExportDialogProps) {
  const [includeMana, setIncludeMana] = useState(false);
  const deck = useSealedStore((s) => s.deck);
  const cardsById = useSealedStore((s) => s.cardsById);

  const text = exportToArenaFormat(deck, cardsById, {
    includeTokens: false,
    includeManaConvergence: includeMana,
  });

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(text);
  }, [text]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "altered-deck-arena.txt";
    a.click();
    URL.revokeObjectURL(url);
  }, [text]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="top-8 left-1/2 max-h-[90vh] -translate-x-1/2 translate-y-0 flex flex-col">
        <DialogHeader>
          <DialogTitle>Exporter pour TCG Arena</DialogTitle>
          <DialogDescription>
            Format : une ligne par carte : quantité + nom exact. Les tokens ne sont pas inclus par défaut.
          </DialogDescription>
        </DialogHeader>
        <DialogClose asChild>
          <Button variant="ghost" size="icon" className="absolute right-4 top-4">
            <X className="h-4 w-4" />
            <span className="sr-only">Fermer</span>
          </Button>
        </DialogClose>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={includeMana}
            onChange={(e) => setIncludeMana(e.target.checked)}
            className="rounded border-input"
          />
          Inclure Mana Convergence
        </label>
        <textarea
          readOnly
          value={text}
          className="min-h-[200px] flex-1 resize-y rounded-md border bg-muted/50 p-3 font-mono text-sm"
          spellCheck={false}
        />
        <div className="flex gap-2">
          <Button onClick={handleCopy}>Copier</Button>
          <Button variant="outline" onClick={handleDownload}>
            Télécharger .txt
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
