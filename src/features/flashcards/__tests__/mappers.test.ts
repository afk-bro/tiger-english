import { describe, it, expect } from 'vitest';
import { mapSet, mapCard, mapProgress } from '../types';

describe('mapSet', () => {
  it('maps a DB row to a FlashcardSet domain object', () => {
    const row = {
      id: 'abc',
      title: 'Test Set',
      description: 'A description',
      is_public: true,
      created_by: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      slug: 'test_slug',
      flashcards: [{ count: 5 }],
    };
    expect(mapSet(row)).toEqual({
      id: 'abc',
      title: 'Test Set',
      description: 'A description',
      isPublic: true,
      createdBy: null,
      createdAt: '2026-01-01T00:00:00Z',
      cardCount: 5,
      slug: 'test_slug',
    });
  });

  it('defaults cardCount to 0 when flashcards array is empty', () => {
    const row = {
      id: 'abc', title: 'T', description: null, is_public: false,
      created_by: 'user-1', created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z', flashcards: [],
    } as any;
    expect(mapSet(row).cardCount).toBe(0);
  });

  it('defaults cardCount to 0 when flashcards is undefined (defensive)', () => {
    const row = {
      id: 'abc', title: 'T', description: null, is_public: false,
      created_by: null, created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z', flashcards: undefined as any,
    } as any;
    expect(mapSet(row).cardCount).toBe(0);
  });

  it('preserves explicit null slug', () => {
    const row = {
      id: 'abc', title: 'T', description: null, is_public: false, slug: null,
      created_by: null, created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z', flashcards: [{ count: 0 }],
    };
    expect(mapSet(row).slug).toBe(null);
  });
});

describe('mapCard', () => {
  const baseRow = {
    id: 'card-1',
    set_id: 'set-1',
    english_text: 'Hello',
    part_of_speech: 'interjection',
    level: 'basic',
    category: 'greetings',
    example_sentence: 'Hello!',
    image_url: null,
    english_audio_url: null,
    notes: null,
    is_phrase: false,
    sort_order: 1,
    created_at: '2026-01-01T00:00:00Z',
  };

  it('picks the reviewed translation for the requested language', () => {
    const row = {
      ...baseRow,
      flashcard_translations: [
        { language_code: 'th', native_text: 'สวัสดี', native_audio_url: null, is_reviewed: true },
        { language_code: 'zh', native_text: '你好', native_audio_url: null, is_reviewed: true },
      ],
    };
    const card = mapCard(row, 'th');
    expect(card.nativeText).toBe('สวัสดี');
    expect(card.nativeAudioUrl).toBeNull();
  });

  it('returns nativeText null when no translation exists for the language', () => {
    const row = {
      ...baseRow,
      flashcard_translations: [
        { language_code: 'zh', native_text: '你好', native_audio_url: null, is_reviewed: true },
      ],
    };
    const card = mapCard(row, 'th');
    expect(card.nativeText).toBeNull();
  });

  it('returns nativeText null when translation exists but is not reviewed', () => {
    const row = {
      ...baseRow,
      flashcard_translations: [
        { language_code: 'th', native_text: 'สวัสดี', native_audio_url: null, is_reviewed: false },
      ],
    };
    const card = mapCard(row, 'th');
    expect(card.nativeText).toBeNull();
  });

  it('returns nativeText null when flashcard_translations is empty', () => {
    const row = { ...baseRow, flashcard_translations: [] };
    const card = mapCard(row, 'th');
    expect(card.nativeText).toBeNull();
  });

  it('maps nativeAudioUrl from the matched translation', () => {
    const row = {
      ...baseRow,
      flashcard_translations: [
        { language_code: 'th', native_text: 'สวัสดี', native_audio_url: 'https://cdn/th/hello.mp3', is_reviewed: true },
      ],
    };
    const card = mapCard(row, 'th');
    expect(card.nativeAudioUrl).toBe('https://cdn/th/hello.mp3');
  });

  it('maps all non-translation fields correctly', () => {
    const row = {
      ...baseRow,
      flashcard_translations: [],
    };
    const card = mapCard(row, 'th');
    expect(card).toMatchObject({
      id: 'card-1',
      setId: 'set-1',
      englishText: 'Hello',
      partOfSpeech: 'interjection',
      level: 'basic',
      category: 'greetings',
      exampleSentence: 'Hello!',
      imageUrl: null,
      englishAudioUrl: null,
      notes: null,
      isPhrase: false,
      sortOrder: 1,
    });
  });
});

describe('mapProgress', () => {
  it('maps a DB row to a CardProgress domain object', () => {
    const row = {
      flashcard_id: 'card-1',
      status: 'known' as const,
      last_studied_at: '2026-01-01T00:00:00Z',
      user_id: 'user-1',
      created_at: '2026-01-01T00:00:00Z',
    };
    expect(mapProgress(row)).toEqual({
      flashcardId: 'card-1',
      status: 'known',
      lastStudiedAt: '2026-01-01T00:00:00Z',
    });
  });
});
