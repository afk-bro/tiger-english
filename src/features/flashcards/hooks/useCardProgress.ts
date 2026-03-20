import { useState, useEffect, useCallback } from 'react';
import { getProgressByCards, upsertCardProgress } from '../api/flashcards';
import type { CardProgress } from '../types';

export function useCardProgress(
  cardIds: string[],
  userId: string | undefined,
) {
  const [progressMap, setProgressMap] = useState<Record<string, CardProgress>>({});
  // Serialise ids so the effect only re-runs when the actual id values change,
  // not on every render due to a new array reference.
  const idsKey = JSON.stringify([...cardIds].sort());

  useEffect(() => {
    if (!userId || cardIds.length === 0) {
      setProgressMap({});
      return;
    }
    getProgressByCards(cardIds, userId)
      .then((rows) => {
        const map: Record<string, CardProgress> = {};
        rows.forEach((p) => {
          map[p.flashcardId] = p;
        });
        setProgressMap(map);
      })
      .catch((error) => {
        console.error('Failed to load card progress', error);
        setProgressMap({});
      });
    // idsKey captures all card ids; eslint wants cardIds in deps but that
    // would re-run on every render. idsKey is the correct stable dependency.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, userId]);

  const markKnown = useCallback(
    (cardId: string) => {
      if (!userId) return;
      const entry: CardProgress = {
        flashcardId: cardId,
        status: 'known',
        lastStudiedAt: new Date().toISOString(),
      };
      setProgressMap((prev) => ({ ...prev, [cardId]: entry }));
      upsertCardProgress(userId, cardId, 'known').catch(console.error);
    },
    [userId],
  );

  const markUnknown = useCallback(
    (cardId: string) => {
      if (!userId) return;
      const entry: CardProgress = {
        flashcardId: cardId,
        status: 'unknown',
        lastStudiedAt: new Date().toISOString(),
      };
      setProgressMap((prev) => ({ ...prev, [cardId]: entry }));
      upsertCardProgress(userId, cardId, 'unknown').catch(console.error);
    },
    [userId],
  );

  return { progressMap, markKnown, markUnknown };
}
