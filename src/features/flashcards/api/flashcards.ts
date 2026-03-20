import { supabase } from '@/lib/supabase';
import { mapSet, mapCard, mapProgress, type FlashcardSet, type FlashcardCard, type CardProgress } from '../types';

export async function getVisibleSets(): Promise<FlashcardSet[]> {
  const { data, error } = await supabase
    .from('flashcard_sets')
    .select('*, flashcards(count)');

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapSet);
}

// userId must be provided by the caller (from useUserStore.profile.id).
// Do NOT call supabase.auth.getUser() here — it makes an extra network request
// and its result is not guaranteed to be non-null even when the user is authenticated.
export async function createSet(
  title: string,
  description: string | null,
  userId: string,
): Promise<FlashcardSet> {
  const { data, error } = await supabase
    .from('flashcard_sets')
    .insert({ title, description, created_by: userId })
    .select('*, flashcards(count)')
    .single();

  if (error) throw new Error(error.message);
  return mapSet(data);
}

export async function getCardsBySet(setId: string): Promise<FlashcardCard[]> {
  const { data, error } = await supabase
    .from('flashcards')
    .select('*')
    .eq('set_id', setId)
    .order('sort_order', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapCard);
}

export async function getProgressByCards(
  cardIds: string[],
  userId: string,
): Promise<CardProgress[]> {
  if (cardIds.length === 0) return [];

  const { data, error } = await supabase
    .from('user_card_progress')
    .select('*')
    .eq('user_id', userId)
    .in('flashcard_id', cardIds);

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapProgress);
}

export async function upsertCardProgress(
  userId: string,
  flashcardId: string,
  status: 'known' | 'unknown',
): Promise<void> {
  const { error } = await supabase
    .from('user_card_progress')
    .upsert(
      { user_id: userId, flashcard_id: flashcardId, status, last_studied_at: new Date().toISOString() },
      { onConflict: 'user_id,flashcard_id' },
    );

  if (error) throw new Error(error.message);
}
