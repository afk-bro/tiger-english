import { useState, useEffect } from 'react';
import { getCardsBySet } from '../api/flashcards';
import type { FlashcardCard } from '../types';

export function useFlashcards(setId: string | null, languageCode: string | null) {
  const [cards, setCards] = useState<FlashcardCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!setId || !languageCode) {
      setCards([]);
      setLoading(false);
      setError(null);
      return () => { cancelled = true; };
    }

    setLoading(true);
    setError(null);

    getCardsBySet(setId, languageCode)
      .then((fetchedCards) => {
        if (!cancelled) setCards(fetchedCards);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load cards');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [setId, languageCode]);

  return { cards, loading, error };
}
