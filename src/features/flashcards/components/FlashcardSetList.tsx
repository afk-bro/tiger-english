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
        <p className="text-primary-600">Loading sets…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-red-600">Failed to load sets: {error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-primary-800 dark:text-primary-200">
          Flashcard Sets
        </h2>
        {isAuthenticated && (
          <Button variant="primary" size="sm" onClick={onCreateSet}>
            + Create set
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {sets.map((set) => (
          <button
            key={set.id}
            onClick={() => onSelectSet(set.id)}
            className="text-left p-5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm hover:shadow-md transition-shadow"
          >
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
              {set.title}
            </h3>
            {set.description && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                {set.description}
              </p>
            )}
            <p className="text-xs text-primary-600 font-medium">
              {set.cardCount} {set.cardCount === 1 ? 'card' : 'cards'}
            </p>
          </button>
        ))}
      </div>

      {sets.length === 0 && (
        <p className="text-center text-primary-600 py-12">
          No sets available yet.
        </p>
      )}
    </div>
  );
}
