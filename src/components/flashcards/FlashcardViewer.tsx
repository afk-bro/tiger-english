// src/components/flashcards/FlashcardViewer.tsx
import { useState, useEffect } from "react";
import { Flashcard as FlashcardData } from "@/types/flashcard";
import { Flashcard } from "./Flashcard";
import Button from "@/components/ui/Button";

type DifficultyLevel = 'basic' | 'intermediate' | 'advanced';

interface FlashcardViewerProps {
  selectedDifficulty: DifficultyLevel | null;
}

// Mock flashcard data using the complete Flashcard interface
const mockFlashcards: FlashcardData[] = [
  // Basic Level Cards
  {
    id: '1',
    nativeWord: 'สวัสดี',
    englishWord: 'Hello',
    partOfSpeech: 'interjection',
    level: 'basic',
    exampleSentence: 'สวัสดีครับ - Hello (polite form)',
    imageUrl: '/images/hello.jpg'
  },
  {
    id: '2',
    nativeWord: 'น้ำ',
    englishWord: 'Water',
    partOfSpeech: 'noun',
    level: 'basic',
    exampleSentence: 'ฉันดื่มน้ำ - I drink water'
  },
  {
    id: '3',
    nativeWord: 'อาหาร',
    englishWord: 'Food',
    partOfSpeech: 'noun',
    level: 'basic',
    exampleSentence: 'อาหารอร่อย - The food is delicious'
  },
  
  // Intermediate Level Cards
  {
    id: '4',
    nativeWord: 'การศึกษา',
    englishWord: 'Education',
    partOfSpeech: 'noun',
    level: 'intermediate',
    exampleSentence: 'การศึกษาสำคัญมาก - Education is very important'
  },
  {
    id: '5',
    nativeWord: 'ประสบการณ์',
    englishWord: 'Experience',
    partOfSpeech: 'noun',
    level: 'intermediate',
    exampleSentence: 'เขามีประสบการณ์มาก - He has a lot of experience'
  },
  {
    id: '6',
    nativeWord: 'โอกาส',
    englishWord: 'Opportunity',
    partOfSpeech: 'noun',
    level: 'intermediate',
    exampleSentence: 'นี่เป็นโอกาสดี - This is a good opportunity'
  },
  
  // Advanced Level Cards
  {
    id: '7',
    nativeWord: 'ความรับผิดชอบ',
    englishWord: 'Responsibility',
    partOfSpeech: 'noun',
    level: 'advanced',
    exampleSentence: 'เขามีความรับผิดชอบสูง - He has high responsibility'
  },
  {
    id: '8',
    nativeWord: 'การพัฒนา',
    englishWord: 'Development',
    partOfSpeech: 'noun',
    level: 'advanced',
    exampleSentence: 'การพัฒนาเทคโนโลยี - Technology development'
  },
  {
    id: '9',
    nativeWord: 'ความเข้าใจ',
    englishWord: 'Understanding',
    partOfSpeech: 'noun',
    level: 'advanced',
    exampleSentence: 'ความเข้าใจที่ลึกซึ้ง - Deep understanding'
  }
];

export function FlashcardViewer({ selectedDifficulty }: FlashcardViewerProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // Filter cards based on selected difficulty
  const filteredCards = selectedDifficulty 
    ? mockFlashcards.filter(card => card.level === selectedDifficulty)
    : mockFlashcards;

  // Reset to first card when difficulty changes
  useEffect(() => {
    setCurrentCardIndex(0);
  }, [selectedDifficulty]);

  // Handle navigation
  const goToPrevious = () => {
    setCurrentCardIndex(prev => 
      prev === 0 ? filteredCards.length - 1 : prev - 1
    );
  };

  const goToNext = () => {
    setCurrentCardIndex(prev => 
      prev === filteredCards.length - 1 ? 0 : prev + 1
    );
  };

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') {
        goToPrevious();
      } else if (event.key === 'ArrowRight') {
        goToNext();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [filteredCards.length]);

  // Show empty state if no cards available
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
              : 'No flashcards to display'
            }
          </p>
        </div>
      </div>
    );
  }

  const currentCard = filteredCards[currentCardIndex];

  return (
    <div className="flex flex-col items-center space-y-6 py-8">
      {/* Card Counter */}
      <div className="text-sm text-primary-600 font-medium">
        Card {currentCardIndex + 1} of {filteredCards.length}
        {selectedDifficulty && (
          <span className="ml-2 px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs capitalize">
            {selectedDifficulty}
          </span>
        )}
      </div>

      {/* Flashcard */}
      <div className="flex justify-center">
        <Flashcard data={currentCard} />
      </div>

      {/* Navigation Controls */}
      <div className="flex items-center space-x-4">
        <Button
          variant="secondary"
          size="sm"
          onClick={goToPrevious}
          className="px-4 py-2"
        >
          ← Previous
        </Button>
        
        <div className="flex space-x-1">
          {filteredCards.map((_, index) => (
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

        <Button
          variant="secondary"
          size="sm"
          onClick={goToNext}
          className="px-4 py-2"
        >
          Next →
        </Button>
      </div>

      {/* Keyboard hint */}
      <p className="text-xs text-primary-500 text-center">
        Use ← → arrow keys to navigate
      </p>
    </div>
  );
}
