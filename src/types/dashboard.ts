// src/types/dashboard.ts

export interface Profile {
  first_name: string;
  last_name?: string;
}

export interface XPBreakdownTier {
  totalXP: number;
  xpPerWord: number;
  wordsCompleted: number;
}

export interface XPData {
  currentXP: number;
  totalXPForNextLevel: number;
  progressPercentage: number;
  currentLevel: number;
  xpBreakdown: {
    beginner: XPBreakdownTier;
    intermediate: XPBreakdownTier;
    expert: XPBreakdownTier;
  };
}

export interface StudyStats {
  currentStreak: number;
  totalWordsLearned: number;
  studyTimeToday: number;
  accuracyRate: number;
}

export interface FlashcardGroup {
  id: string;
  name: string;
  difficulty: string;
  progress: number;
  completedCards: number;
  totalCards: number;
  lastStudied: string;
  color: string;
}
