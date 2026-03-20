import { useState, useEffect, useCallback } from 'react';
import { getVisibleSets, createSet as apiCreateSet } from '../api/flashcards';
import type { FlashcardSet } from '../types';

export function useFlashcardSets(userId?: string) {
  const [sets, setSets] = useState<FlashcardSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getVisibleSets();
      setSets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sets');
      setSets([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSets();
  }, [fetchSets]);

  const createSet = useCallback(
    async (title: string, description: string | null) => {
      if (!userId) throw new Error('Must be authenticated to create a set');
      await apiCreateSet(title, description, userId);
      await fetchSets();
    },
    [fetchSets, userId],
  );

  return { sets, loading, error, createSet };
}
