import { describe, it, expect, beforeAll } from 'vitest';
import { renderHook } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { useSetCopy } from '../hooks/useSetCopy';
import type { FlashcardSet } from '../types';

beforeAll(() => {
  i18n.use(initReactI18next).init({
    lng: 'en',
    fallbackLng: 'en',
    resources: {
      en: {
        translation: {
          flashcards: {
            sets: {
              greetings_small_talk: {
                title: 'Greetings & Small Talk',
                description: 'Everyday greetings and intros',
              },
            },
          },
        },
      },
    },
    interpolation: { escapeValue: false },
  });
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
);

const baseSet: FlashcardSet = {
  id: 'abc',
  title: 'DB Title',
  description: 'DB Description',
  isPublic: true,
  createdBy: null,
  createdAt: '2026-01-01T00:00:00Z',
  cardCount: 0,
  slug: null,
};

describe('useSetCopy', () => {
  it('returns DB raw values when slug is null (user-created set)', () => {
    const { result } = renderHook(() => useSetCopy(baseSet), { wrapper });
    expect(result.current).toEqual({
      title: 'DB Title',
      description: 'DB Description',
    });
  });

  it('returns translated values when slug + locale key exist', () => {
    const set = { ...baseSet, slug: 'greetings_small_talk', title: 'Old Title', description: 'Old Desc' };
    const { result } = renderHook(() => useSetCopy(set), { wrapper });
    expect(result.current).toEqual({
      title: 'Greetings & Small Talk',
      description: 'Everyday greetings and intros',
    });
  });

  it('falls back to DB raw values when slug is set but locale key is missing', () => {
    const set = { ...baseSet, slug: 'no_such_slug' };
    const { result } = renderHook(() => useSetCopy(set), { wrapper });
    expect(result.current).toEqual({
      title: 'DB Title',
      description: 'DB Description',
    });
  });

  it('returns empty string description when slug is null and DB description is null', () => {
    const set = { ...baseSet, description: null };
    const { result } = renderHook(() => useSetCopy(set), { wrapper });
    expect(result.current).toEqual({
      title: 'DB Title',
      description: '',
    });
  });
});
