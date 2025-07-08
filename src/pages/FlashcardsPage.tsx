// src/pages/FlashcardsPage.tsx
import { WelcomeBanner } from "@/components/flashcards/WelcomeBanner";

export default function FlashcardsPage() {
  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Welcome Banner */}
        <WelcomeBanner />
        
        {/* Placeholder for future components */}
        <div className="mt-12">
          {/* DifficultySelector will go here */}
          {/* FlashcardViewer will go here */}
          {/* ActionBar will go here */}
          {/* StudyModeView will go here */}
          {/* AddWordModal will go here */}
        </div>
      </div>
    </div>
  );
}
