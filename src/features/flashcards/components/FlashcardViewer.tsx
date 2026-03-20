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
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-primary-600">No cards in this set yet.</p>
        <Button variant="secondary" size="sm" onClick={onBack} className="mt-4">
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
    <div className="flex flex-col items-center space-y-6 py-8">
      <div className="flex items-center justify-between w-full max-w-3xl">
        <Button variant="secondary" size="sm" onClick={onBack}>
          ← Back
        </Button>
        <div className="text-sm text-primary-600 font-medium">
          Card {currentCardIndex + 1} of {cards.length}
          {progress && (
            <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
              progress.status === 'known'
                ? 'bg-green-100 text-green-700'
                : 'bg-red-100 text-red-700'
            }`}>
              {progress.status}
            </span>
          )}
        </div>
      </div>

      <div className="flex justify-center">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <Flashcard data={currentCard as any} />
      </div>

      <div className="flex items-center space-x-4">
        <Button variant="secondary" size="sm" onClick={goToPrevious} className="px-4 py-2">
          ← Previous
        </Button>

        <div className="flex space-x-1">
          {cards.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentCardIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentCardIndex
                  ? 'bg-primary-500'
                  : 'bg-primary-200 hover:bg-primary-300'
              }`}
              aria-label={`Go to card ${index + 1}`}
            />
          ))}
        </div>

        <Button variant="secondary" size="sm" onClick={goToNext} className="px-4 py-2">
          Next →
        </Button>
      </div>

      {isAuthenticated && (
        <div className="flex space-x-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleMarkUnknown}
            className="px-6 py-2 border-red-300 text-red-700 hover:bg-red-50"
          >
            Still learning
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleMarkKnown}
            className="px-6 py-2"
          >
            I know this
          </Button>
        </div>
      )}

      <p className="text-xs text-primary-500 text-center">
        Use ← → arrow keys to navigate
      </p>
    </div>
  );
}
