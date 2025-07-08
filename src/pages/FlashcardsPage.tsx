// src/pages/FlashcardsPage.tsx
import { useState } from "react";
import { WelcomeBanner } from "@/components/flashcards/WelcomeBanner";
import { DifficultySelector } from "@/components/flashcards/DifficultySelector";

type DifficultyLevel = 'basic' | 'intermediate' | 'advanced';

export default function FlashcardsPage() {
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | null>(null);

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Welcome Banner */}
        <WelcomeBanner />
        
        {/* Difficulty Selector */}
        <DifficultySelector 
          selectedDifficulty={selectedDifficulty}
          onDifficultyChange={setSelectedDifficulty}
        />
        
        {/* Placeholder for future components */}
        <div className="mt-12">
          {/* FlashcardViewer will go here */}
          {/* ActionBar will go here */}
          {/* StudyModeView will go here */}
          {/* AddWordModal will go here */}
        </div>
      </div>
    </div>
  );
}
