// src/features/flashcards/useFlashcardNavigation.ts
import { useState, useEffect, useCallback } from "react";

export function useFlashcardNavigation(cardCount: number) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // Reset to 0 whenever cardCount changes (i.e. difficulty filter changes)
  useEffect(() => {
    setCurrentCardIndex(0);
  }, [cardCount]);

  const goToPrevious = useCallback(() => {
    if (cardCount === 0) return;
    setCurrentCardIndex((prev) => (prev === 0 ? cardCount - 1 : prev - 1));
  }, [cardCount]);

  const goToNext = useCallback(() => {
    if (cardCount === 0) return;
    setCurrentCardIndex((prev) => (prev === cardCount - 1 ? 0 : prev + 1));
  }, [cardCount]);

  // Keyboard navigation — stable deps via useCallback above
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrevious();
      else if (e.key === "ArrowRight") goToNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPrevious, goToNext]);

  // Clamp index: safe when cardCount drops to 0 or below current index
  const safeIndex = cardCount === 0 ? 0 : Math.min(currentCardIndex, cardCount - 1);

  return { currentCardIndex: safeIndex, setCurrentCardIndex, goToPrevious, goToNext };
}
