import { supabase } from '@/lib/supabase';
import { ProgressAPI } from '@/lib/api/progress';
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

export async function getCardsBySet(setId: string, languageCode: string): Promise<FlashcardCard[]> {
  const { data, error } = await supabase
    .from('flashcards')
    .select(`
      id, set_id, english_text, part_of_speech, level, category,
      example_sentence, english_audio_url, image_url,
      notes, is_phrase, sort_order,
      flashcard_translations(native_text, native_audio_url, language_code, is_reviewed)
    `)
    .eq('set_id', setId)
    .order('sort_order', { ascending: true });
  // No filter on flashcard_translations.language_code — adding .eq on an embedded
  // resource converts the implicit LEFT JOIN to INNER JOIN, dropping untranslated cards.

  if (error) throw new Error(error.message);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (data ?? []).map((row) => mapCard(row as any, languageCode));
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
  _userId: string,
  flashcardId: string,
  status: 'known' | 'unknown',
): Promise<void> {
  // user_id is now read from the JWT on the backend (review_flashcard_tx),
  // not passed explicitly. The Postgres function performs the dual-write
  // (user_card_progress + flashcard_reviews + user_activity_log) atomically.
  await ProgressAPI.reviewFlashcard({ flashcardId, status });
}
