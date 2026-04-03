import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Volume2 } from "lucide-react";
import type { FlashcardCard } from "@/features/flashcards/types";
import Button from "@/components/ui/Button";

export interface FlashcardProps {
  data: FlashcardCard;
}

export function Flashcard({ data }: FlashcardProps) {
  const { t } = useTranslation();
  const { nativeText, englishText, partOfSpeech, level, exampleSentence } = data;
  const [isFlipped, setIsFlipped] = useState(false);
  const [showExample, setShowExample] = useState(false);

  const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  const handleCardKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleFlip();
    }
  };

  const handleExampleToggle = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setShowExample((prev) => !prev);
  };

  const handleSpeak = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!englishText) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(englishText);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
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
    <div
      role="button"
      tabIndex={0}
      aria-label={
        isFlipped
          ? `Showing English: ${englishText}. Press to flip back.`
          : nativeText
          ? `Showing native text: ${nativeText}. Press to flip.`
          : t('flashcards.card_not_translated')
      }
      className="w-full h-52 sm:w-[500px] sm:h-72 lg:w-[800px] lg:h-[480px] mx-auto perspective cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/40 rounded-xl"
      onClick={handleFlip}
      onKeyDown={handleCardKeyDown}
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
                {nativeText ? (
                  <>
                    <p className="text-4xl sm:text-5xl font-semibold text-gray-800 mb-4">
                      {nativeText}
                    </p>
                    <div className="w-16 h-1 bg-primary-300 mx-auto rounded-full" />
                  </>
                ) : (
                  <>
                    <p className="text-lg text-gray-400 italic mb-2">{t('flashcards.translation_coming_soon')}</p>
                    <div className="w-16 h-1 bg-gray-200 mx-auto rounded-full" />
                  </>
                )}
              </div>
            </div>

          </div>
        </div>

        {/* Back Side - English Translation */}
        <div className={`absolute inset-0 w-full h-full backface-hidden rotate-y-180 transition-opacity duration-300 ${
            isFlipped ? 'opacity-100' : 'opacity-0'
          }`}>
          <div className="w-full h-full bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-200 rounded-xl shadow-lg hover:shadow-xl transition-shadow relative p-8 flex flex-col">
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

            {/* Main Content - Centered in remaining space */}
            <div className="flex-1 flex items-center justify-center pt-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <p className="text-4xl sm:text-5xl font-semibold text-primary-800">
                    {englishText}
                  </p>
                  {ttsSupported && (
                    <button
                      type="button"
                      aria-label={`Hear pronunciation of ${englishText}`}
                      onClick={handleSpeak}
                      className="flex-shrink-0 p-2 rounded-full text-primary-500 hover:text-primary-700 hover:bg-primary-200 transition-colors"
                    >
                      <Volume2 className="w-6 h-6 sm:w-7 sm:h-7" />
                    </button>
                  )}
                </div>
                <div className="w-16 h-1 bg-primary-400 mx-auto rounded-full"></div>
              </div>
            </div>

            {/* Example Section - sits below the word in normal flow */}
            {exampleSentence && (
              <div className="text-center pt-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleExampleToggle}
                  className="border-2 border-primary-400 bg-white text-primary-700 hover:bg-primary-50"
                >
                  {showExample ? 'Hide Example' : 'Show Example'}
                </Button>

                <div className={`transition-all duration-300 overflow-hidden ${
                  showExample ? 'max-h-32 opacity-100 mt-3' : 'max-h-0 opacity-0'
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
    </div>
  );
}
