import { useState, useEffect } from 'react';
import { getCardsBySet } from '../api/flashcards';
import type { FlashcardCard } from '../types';

export function useFlashcards(setId: string | null) {
  const [cards, setCards] = useState<FlashcardCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!setId) {
      setCards([]);
      return;
    }
    setLoading(true);
    setError(null);
    getCardsBySet(setId)
      .then(setCards)
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load cards'))
      .finally(() => setLoading(false));
  }, [setId]);

  return { cards, loading, error };
}
