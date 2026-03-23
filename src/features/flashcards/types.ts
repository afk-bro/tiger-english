export type FlashcardSet = {
  id: string
  title: string
  description: string | null
  isPublic: boolean
  createdBy: string | null
  createdAt: string
  cardCount: number
}

export type FlashcardCard = {
  id: string
  setId: string
  nativeText: string | null      // null when no reviewed translation exists for this language
  nativeAudioUrl: string | null  // null when no reviewed translation exists
  englishText: string
  partOfSpeech: string | null
  level: 'basic' | 'intermediate' | 'advanced' | null
  category: string | null
  exampleSentence: string | null
  imageUrl: string | null
  englishAudioUrl: string | null
  notes: string | null
  isPhrase: boolean
  sortOrder: number
}
// Note: DB `level` column is text | null (check constraint). Cast required in mapper.

export type CardProgress = {
  flashcardId: string
  status: 'unseen' | 'known' | 'unknown'
  lastStudiedAt: string | null
}

// ── Mappers ─────────────────────────────────────────────────────────────────
// Called only from api/flashcards.ts. Never called from hooks or components.

type SetRow = {
  id: string
  title: string
  description: string | null
  is_public: boolean
  created_by: string | null
  created_at: string
  flashcards?: { count: number }[]   // optional: PostgREST may omit if no rows
}

type TranslationRow = {
  native_text: string
  native_audio_url: string | null
  language_code: string
  is_reviewed: boolean
}

type CardRow = {
  id: string
  set_id: string
  english_text: string
  part_of_speech: string | null
  level: string | null
  category: string | null
  example_sentence: string | null
  image_url: string | null
  english_audio_url: string | null
  notes: string | null
  is_phrase: boolean
  sort_order: number
  created_at: string
  flashcard_translations: TranslationRow[]
}

type ProgressRow = {
  flashcard_id: string
  status: 'unseen' | 'known' | 'unknown'
  last_studied_at: string | null
  user_id: string
  created_at: string
}

export function mapSet(row: SetRow): FlashcardSet {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    isPublic: row.is_public,
    createdBy: row.created_by,
    createdAt: row.created_at,
    cardCount: (row.flashcards ?? [])[0]?.count ?? 0,
  };
}

export function mapCard(row: CardRow, languageCode: string): FlashcardCard {
  const translation =
    row.flashcard_translations.find(
      (t) => t.language_code === languageCode && t.is_reviewed,
    ) ?? null;

  return {
    id: row.id,
    setId: row.set_id,
    nativeText: translation?.native_text ?? null,
    nativeAudioUrl: translation?.native_audio_url ?? null,
    englishText: row.english_text,
    partOfSpeech: row.part_of_speech,
    level: row.level as FlashcardCard['level'],
    category: row.category,
    exampleSentence: row.example_sentence,
    imageUrl: row.image_url,
    englishAudioUrl: row.english_audio_url,
    notes: row.notes,
    isPhrase: row.is_phrase,
    sortOrder: row.sort_order,
  };
}

export function mapProgress(row: ProgressRow): CardProgress {
  return {
    flashcardId: row.flashcard_id,
    status: row.status,
    lastStudiedAt: row.last_studied_at,
  };
}
