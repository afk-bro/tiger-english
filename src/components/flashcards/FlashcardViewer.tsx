// src/components/flashcards/FlashcardViewer.tsx
import type { Flashcard as FlashcardData } from "@/types/flashcard";
import { Flashcard } from "./Flashcard";
import Button from "@/components/ui/Button";
import { mockFlashcards } from "@/mocks/mockFlashcardData";
import { useFlashcardNavigation } from "@/features/flashcards/useFlashcardNavigation";

type DifficultyLevel = "basic" | "intermediate" | "advanced";

interface FlashcardViewerProps {
  selectedDifficulty: DifficultyLevel | null;
}

export function FlashcardViewer({ selectedDifficulty }: FlashcardViewerProps) {
  const filteredCards: FlashcardData[] = selectedDifficulty
    ? mockFlashcards.filter((card) => card.level === selectedDifficulty)
    : mockFlashcards;

  const { currentCardIndex, setCurrentCardIndex, goToPrevious, goToNext } =
    useFlashcardNavigation(filteredCards.length);

  if (filteredCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-primary-700 mb-2">
            No flashcards available
          </h3>
          <p className="text-primary-600">
            {selectedDifficulty
              ? `No cards found for ${selectedDifficulty} level`
              : "No flashcards to display"}
          </p>
        </div>
      </div>
    );
  }

  const currentCard = filteredCards[currentCardIndex];

  return (
    <div className="flex flex-col items-center space-y-6 py-8">
      <div className="text-sm text-primary-600 font-medium">
        Card {currentCardIndex + 1} of {filteredCards.length}
        {selectedDifficulty && (
          <span className="ml-2 px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs capitalize">
            {selectedDifficulty}
          </span>
        )}
      </div>

      <div className="flex justify-center">
        <Flashcard data={currentCard} />
      </div>

      <div className="flex items-center space-x-4">
        <Button variant="secondary" size="sm" onClick={goToPrevious} className="px-4 py-2">
          ← Previous
        </Button>

        <div className="flex space-x-1">
          {filteredCards.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentCardIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentCardIndex
                  ? "bg-primary-500"
                  : "bg-primary-200 hover:bg-primary-300"
              }`}
              aria-label={`Go to card ${index + 1}`}
            />
          ))}
        </div>

        <Button variant="secondary" size="sm" onClick={goToNext} className="px-4 py-2">
          Next →
        </Button>
      </div>

      <p className="text-xs text-primary-500 text-center">
        Use ← → arrow keys to navigate
      </p>
    </div>
  );
}
