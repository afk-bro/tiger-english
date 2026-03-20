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
  nativeWord: string
  englishWord: string
  partOfSpeech: string | null
  level: 'basic' | 'intermediate' | 'advanced' | null
  exampleSentence: string | null
  imageUrl: string | null
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

type CardRow = {
  id: string
  set_id: string
  native_word: string
  english_word: string
  part_of_speech: string | null
  level: string | null
  example_sentence: string | null
  image_url: string | null
  sort_order: number
  created_at: string
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

export function mapCard(row: CardRow): FlashcardCard {
  return {
    id: row.id,
    setId: row.set_id,
    nativeWord: row.native_word,
    englishWord: row.english_word,
    partOfSpeech: row.part_of_speech,
    level: row.level as FlashcardCard['level'],
    exampleSentence: row.example_sentence,
    imageUrl: row.image_url,
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
