import { useState } from "react";
import type { FlashcardCard } from "@/features/flashcards/types";
import Button from "@/components/ui/Button";

export interface FlashcardProps {
  data: FlashcardCard;
}

export function Flashcard({ data }: FlashcardProps) {
  const { nativeWord, englishWord, partOfSpeech, level, exampleSentence } = data;
  const [isFlipped, setIsFlipped] = useState(false);
  const [showExample, setShowExample] = useState(false);

  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  const handleExampleToggle = (e?: React.MouseEvent) => {
    e?.stopPropagation(); // Prevent card flip when clicking example button
    setShowExample((prev) => !prev);
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'basic':
        return 'bg-success-100 text-success-700 border-success-200';
      case 'intermediate':
        return 'bg-accent-100 text-accent-700 border-accent-200';
      case 'advanced':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <button
      type="button"
      aria-label={isFlipped ? `Showing English: ${englishWord}. Press to flip back.` : `Showing Thai: ${nativeWord}. Press to flip.`}
      className="w-full h-52 sm:w-[500px] sm:h-72 lg:w-[800px] lg:h-[480px] mx-auto perspective cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/40 rounded-xl"
      onClick={handleFlip}
    >
      {/* Flip Container */}
      <div
        className={`relative w-full h-full transition-transform duration-700 preserve-3d transform-gpu origin-center ${
          isFlipped ? "rotate-y-180" : ""
        }`}
        style={{ willChange: 'transform' }}
      >
        {/* Front Side - Native Language */}
        <div
          className={`absolute inset-0 w-full h-full backface-hidden transition-opacity duration-300 ${
            isFlipped ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <div className="w-full h-full bg-white border-2 border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-shadow relative p-8">
            {/* Corner Badges */}
            {level && (
              <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(level)}`}>
                {level.toUpperCase()}
              </div>
            )}
            {partOfSpeech && (
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-700 border border-primary-200">
                {partOfSpeech}
              </div>
            )}

            {/* Main Content - Perfectly Centered */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-4xl sm:text-5xl font-semibold text-gray-800 mb-4">
                  {nativeWord}
                </p>
                <div className="w-16 h-1 bg-primary-300 mx-auto rounded-full"></div>
              </div>
            </div>

            {/* Example Section - Bottom Positioned */}
            {exampleSentence && (
              <div className="absolute bottom-8 left-0 right-0 text-center">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleExampleToggle}
                  className="mb-4 border-2 border-gray-400 bg-white text-gray-700 hover:bg-gray-100"
                >
                  {showExample ? 'Hide Example' : 'Show Example'}
                </Button>
                
                <div className={`transition-all duration-300 overflow-hidden ${
                  showExample ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <p className="text-lg text-gray-600 italic text-center px-4">
                    "{exampleSentence}"
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Back Side - English Translation */}
        <div className={`absolute inset-0 w-full h-full backface-hidden rotate-y-180 transition-opacity duration-300 ${
            isFlipped ? 'opacity-100' : 'opacity-0'
          }`}>
          <div className="w-full h-full bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-200 rounded-xl shadow-lg hover:shadow-xl transition-shadow relative p-8">
            {/* Corner Badges */}
            {level && (
              <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(level)}`}>
                {level.toUpperCase()}
              </div>
            )}
            {partOfSpeech && (
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-medium bg-primary-200 text-primary-800 border border-primary-300">
                {partOfSpeech}
              </div>
            )}

            {/* Main Content - Perfectly Centered */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-4xl sm:text-5xl font-semibold text-primary-800 mb-4">
                  {englishWord}
                </p>
                <div className="w-16 h-1 bg-primary-400 mx-auto rounded-full"></div>
              </div>
            </div>

            {/* Example Section - Bottom Positioned */}
            {exampleSentence && (
              <div className="absolute bottom-8 left-0 right-0 text-center">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleExampleToggle}
                  className="mb-4 border-2 border-primary-400 bg-white text-primary-700 hover:bg-primary-50"
                >
                  {showExample ? 'Hide Example' : 'Show Example'}
                </Button>
                
                <div className={`transition-all duration-300 overflow-hidden ${
                  showExample ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'
                }`}>
                  <p className="text-lg text-primary-700 italic text-center px-4">
                    "{exampleSentence}"
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
