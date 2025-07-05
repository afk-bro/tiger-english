import { useState } from "react";
import { Flashcard as FlashcardData } from "@/types/flashcard";

export interface FlashcardProps {
  data: FlashcardData;
}

export function Flashcard({ data }: FlashcardProps) {
  const { nativeWord, englishWord } = data;
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => {
    setIsFlipped((prev) => !prev);
  };

  return (
    <div className="w-80 h-48 perspective cursor-pointer" onClick={handleFlip}>
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
          <div className="w-full h-full bg-white border-2 border-gray-200 rounded-xl shadow-lg flex items-center justify-center p-6 hover:shadow-xl transition-shadow">
            <div className="text-center">
              <p className="text-2xl font-semibold text-gray-800 mb-2">
                {nativeWord}
              </p>
              <div className="w-8 h-0.5 bg-primary-300 mx-auto"></div>
            </div>
          </div>
        </div>

        {/* Back Side - English Translation */}
        <div className={`absolute inset-0 w-full h-full backface-hidden rotate-y-180 transition-opacity duration-300 ${
            isFlipped ? 'opacity-100' : 'opacity-0'
          }`}>
          <div className="w-full h-full bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-200 rounded-xl shadow-lg flex items-center justify-center p-6 hover:shadow-xl transition-shadow">
            <div className="text-center">
              <p className="text-2xl font-semibold text-primary-800 mb-2">
                {englishWord}
              </p>
              <div className="w-8 h-0.5 bg-primary-400 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
