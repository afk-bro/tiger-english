import { useTranslation } from 'react-i18next';
import type { FlashcardSet } from '../types';
import Button from '@/components/ui/Button';
import { useSetCopy } from '../hooks/useSetCopy';

interface FlashcardSetListProps {
  sets: FlashcardSet[];
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  onSelectSet: (setId: string) => void;
  onCreateSet: () => void;
}

export function FlashcardSetList({
  sets,
  loading,
  error,
  isAuthenticated,
  onSelectSet,
  onCreateSet,
}: FlashcardSetListProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-semantic-muted">{t('flashcards.sets.loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-semantic-error">{t('flashcards.sets.load_error', { error })}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-display heading-accent">{t('flashcards.sets.heading')}</h2>
        {isAuthenticated && (
          <Button variant="primary" size="sm" onClick={onCreateSet}>
            {t('flashcards.sets.create')}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {sets.map((set) => (
          <FlashcardSetCard key={set.id} set={set} onSelect={onSelectSet} />
        ))}
      </div>

      {sets.length === 0 && (
        <p className="text-center text-semantic-muted py-12">
          {t('flashcards.sets.empty')}
        </p>
      )}
    </div>
  );
}

function FlashcardSetCard({
  set,
  onSelect,
}: {
  set: FlashcardSet;
  onSelect: (setId: string) => void;
}) {
  const { t } = useTranslation();
  const { title, description } = useSetCopy(set);
  return (
    <button
      onClick={() => onSelect(set.id)}
      className="card card-interactive text-left space-y-3"
    >
      <h3 className="text-base md:text-lg font-semibold text-semantic-text dark:text-semantic-text">
        {title}
      </h3>
      {description && (
        <p className="text-sm leading-relaxed text-semantic-muted dark:text-semantic-muted">
          {description}
        </p>
      )}
      <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">
        {set.cardCount}{' '}
        {set.cardCount === 1
          ? t('flashcards.sets.card_singular')
          : t('flashcards.sets.card_plural')}
      </p>
    </button>
  );
}
