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
    });
  });

  it('defaults cardCount to 0 when flashcards array is empty', () => {
    const row = {
      id: 'abc', title: 'T', description: null, is_public: false,
      created_by: 'user-1', created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z', flashcards: [],
    };
    expect(mapSet(row).cardCount).toBe(0);
  });

  it('defaults cardCount to 0 when flashcards is undefined (defensive)', () => {
    const row = {
      id: 'abc', title: 'T', description: null, is_public: false,
      created_by: null, created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z', flashcards: undefined as any,
    };
    expect(mapSet(row).cardCount).toBe(0);
  });
});

describe('mapCard', () => {
  it('maps a DB row to a FlashcardCard domain object', () => {
    const row = {
      id: 'card-1',
      set_id: 'set-1',
      native_text: 'สวัสดี',
      english_text: 'Hello',
      part_of_speech: 'interjection',
      level: 'basic',
      category: 'greetings',
      example_sentence: 'Hello!',
      image_url: null,
      english_audio_url: null,
      native_audio_url: null,
      notes: null,
      is_phrase: false,
      sort_order: 1,
      created_at: '2026-01-01T00:00:00Z',
    };
    expect(mapCard(row)).toEqual({
      id: 'card-1',
      setId: 'set-1',
      nativeText: 'สวัสดี',
      englishText: 'Hello',
      partOfSpeech: 'interjection',
      level: 'basic',
      category: 'greetings',
      exampleSentence: 'Hello!',
      imageUrl: null,
      englishAudioUrl: null,
      nativeAudioUrl: null,
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
