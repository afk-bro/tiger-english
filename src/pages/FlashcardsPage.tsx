// src/pages/FlashcardsPage.tsx
import { useState } from "react";
import { WelcomeBanner } from "@/components/flashcards/WelcomeBanner";
import { DifficultySelector } from "@/components/flashcards/DifficultySelector";
import { FlashcardViewer } from "@/components/flashcards/FlashcardViewer";
import { ActionBar } from "@/components/flashcards/ActionBar";

type DifficultyLevel = 'basic' | 'intermediate' | 'advanced';

export default function FlashcardsPage() {
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel | null>(null);

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Welcome Banner */}
        {/* <WelcomeBanner /> */}
        
        {/* Difficulty Selector */}
        <DifficultySelector 
          selectedDifficulty={selectedDifficulty}
          onDifficultyChange={setSelectedDifficulty}
        />
        
        {/* Flashcard Viewer */}
        <FlashcardViewer selectedDifficulty={selectedDifficulty} />
        
        {/* Placeholder for future components */}
        <div className="mt-12">
          {/* ActionBar will go here */}
          <ActionBar />
          {/* StudyModeView will go here */}
          {/* AddWordModal will go here */}
        </div>
      </div>
    </div>
  );
}
