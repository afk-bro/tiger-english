// src/features/flashcards/useFlashcardNavigation.ts
import { useState, useEffect, useCallback } from "react";

// resetKey defaults to '' for backward compatibility with any existing callers.
// Pass setId to guarantee index reset when switching between same-size sets.
export function useFlashcardNavigation(cardCount: number, resetKey: string = '') {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // Reset when either cardCount or resetKey changes
  useEffect(() => {
    setCurrentCardIndex(0);
  }, [cardCount, resetKey]);

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
