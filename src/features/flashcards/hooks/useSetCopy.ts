import { useTranslation } from 'react-i18next';
import type { FlashcardSet } from '../types';

/**
 * Resolve display title and description for a flashcard set, using the
 * i18n key `flashcards.sets.<slug>.{title,description}` when the set has
 * a slug (curated sets), and falling back to the DB raw columns otherwise.
 *
 * `t(..., { defaultValue })` makes a missing locale key return the DB raw
 * column instead of the literal key path — so a slug without a matching
 * locale entry never leaks `flashcards.sets.foo.title` into the UI.
 */
export function useSetCopy(set: FlashcardSet): { title: string; description: string } {
  const { t } = useTranslation();
  if (!set.slug) {
    return {
      title: set.title,
      description: set.description ?? '',
    };
  }
  return {
    title: t(`flashcards.sets.${set.slug}.title`, { defaultValue: set.title }),
    description: t(`flashcards.sets.${set.slug}.description`, {
      defaultValue: set.description ?? '',
    }),
  };
}
