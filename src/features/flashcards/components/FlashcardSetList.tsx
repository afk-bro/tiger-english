import type { FlashcardSet } from '../types';
import Button from '@/components/ui/Button';

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
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-semantic-muted">Loading sets…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-semantic-error">Failed to load sets: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-display heading-accent">Flashcard Sets</h2>
        {isAuthenticated && (
          <Button variant="primary" size="sm" onClick={onCreateSet}>
            + Create set
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {sets.map((set) => (
          <button
            key={set.id}
            onClick={() => onSelectSet(set.id)}
            className="card card-interactive text-left space-y-3"
          >
            <h3 className="text-base md:text-lg font-semibold text-semantic-text dark:text-semantic-text">
              {set.title}
            </h3>
            {set.description && (
              <p className="text-sm leading-relaxed text-semantic-muted dark:text-semantic-muted">
                {set.description}
              </p>
            )}
            <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">
              {set.cardCount} {set.cardCount === 1 ? 'card' : 'cards'}
            </p>
          </button>
        ))}
      </div>

      {sets.length === 0 && (
        <p className="text-center text-semantic-muted py-12">
          No sets available yet.
        </p>
      )}
    </div>
  );
}
