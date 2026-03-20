import { Flashcard } from '@/components/flashcards/Flashcard';
import Button from '@/components/ui/Button';
import { useFlashcardNavigation } from '../useFlashcardNavigation';
import type { FlashcardCard, CardProgress } from '../types';

interface FlashcardViewerProps {
  setId: string;
  cards: FlashcardCard[];
  progressMap: Record<string, CardProgress>;
  onMarkKnown: (cardId: string) => void;
  onMarkUnknown: (cardId: string) => void;
  onBack: () => void;
  isAuthenticated: boolean;
}

export function FlashcardViewer({
  setId,
  cards,
  progressMap,
  onMarkKnown,
  onMarkUnknown,
  onBack,
  isAuthenticated,
}: FlashcardViewerProps) {
  const { currentCardIndex, setCurrentCardIndex, goToPrevious, goToNext } =
    useFlashcardNavigation(cards.length, setId);

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <p className="text-semantic-muted">No cards in this set yet.</p>
        <Button variant="secondary" size="sm" onClick={onBack}>
          ← Back to sets
        </Button>
      </div>
    );
  }

  const currentCard = cards[currentCardIndex];
  const progress = progressMap[currentCard.id];

  const handleMarkKnown = () => {
    onMarkKnown(currentCard.id);
    goToNext();
  };

  const handleMarkUnknown = () => {
    onMarkUnknown(currentCard.id);
    goToNext();
  };

  return (
    <div className="card card-lg flex flex-col items-center space-y-6">
      <div className="flex items-center justify-between w-full">
        <Button variant="secondary" size="sm" onClick={onBack}>
          ← Back
        </Button>
        <div className="flex items-center gap-2 text-sm text-semantic-muted font-medium">
          Card {currentCardIndex + 1} of {cards.length}
          {progress && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              progress.status === 'known'
                ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
            }`}>
              {progress.status}
            </span>
          )}
        </div>
      </div>

      <div className="flex justify-center w-full">
        <Flashcard data={currentCard} />
      </div>

      <div className="flex items-center justify-between w-full gap-2">
        <Button variant="secondary" size="sm" onClick={goToPrevious}>
          ← Previous
        </Button>

        <div className="flex gap-1 overflow-x-auto py-1">
          {cards.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentCardIndex(index)}
              className={`w-2 h-2 flex-shrink-0 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/40 ${
                index === currentCardIndex
                  ? 'bg-primary-500'
                  : 'bg-primary-200 hover:bg-primary-300'
              }`}
              aria-label={`Go to card ${index + 1}`}
            />
          ))}
        </div>

        <Button variant="secondary" size="sm" onClick={goToNext}>
          Next →
        </Button>
      </div>

      {isAuthenticated && (
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleMarkUnknown}
            className="w-full sm:w-auto border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            Still learning
          </Button>
          <Button variant="primary" size="sm" onClick={handleMarkKnown} className="w-full sm:w-auto">
            I know this
          </Button>
        </div>
      )}

      <p className="text-xs text-semantic-muted text-center">
        Use ← → arrow keys to navigate
      </p>
    </div>
  );
}
