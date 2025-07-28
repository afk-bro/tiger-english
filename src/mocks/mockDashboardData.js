// Mock data
export const mockDashboardData = {
    xp: {
        currentXP: 1247,
        totalXPForNextLevel: 1500,
        currentLevel: 12,
        progressPercentage: 83.1, // (1247/1500) * 100
        xpBreakdown: {
            beginner: {
                xpPerWord: 1,
                wordsCompleted: 145,
                totalXP: 145
            },
            intermediate: {
                xpPerWord: 3,
                wordsCompleted: 89,
                totalXP: 267
            },
            expert: {
                xpPerWord: 5,
                wordsCompleted: 167,
                totalXP: 835
            }
        }
    },
    flashcardGroups: [
        {
            id: '1',
            name: 'Business English',
            difficulty: 'Advanced',
            progress: 78,
            totalCards: 120,
            completedCards: 94,
            lastStudied: '2025-06-29',
            color: 'bg-blue-500'
        },
        {
            id: '2',
            name: 'Daily Conversations',
            difficulty: 'Intermediate',
            progress: 92,
            totalCards: 85,
            completedCards: 78,
            lastStudied: '2025-06-29',
            color: 'bg-green-500'
        },
        {
            id: '3',
            name: 'Travel Phrases',
            difficulty: 'Beginner',
            progress: 65,
            totalCards: 60,
            completedCards: 39,
            lastStudied: '2025-06-28',
            color: 'bg-orange-500'
        },
        {
            id: '4',
            name: 'Academic Vocabulary',
            difficulty: 'Expert',
            progress: 45,
            totalCards: 200,
            completedCards: 90,
            lastStudied: '2025-06-27',
            color: 'bg-purple-500'
        },
        {
            id: '5',
            name: 'Idioms & Expressions',
            difficulty: 'Intermediate',
            progress: 88,
            totalCards: 75,
            completedCards: 66,
            lastStudied: '2025-06-29',
            color: 'bg-pink-500'
        }
    ],
    studyStats: {
        totalWordsLearned: 401,
        studyTimeToday: 45,
        studyTimeWeek: 285,
        accuracyRate: 87.5,
        currentStreak: 12,
        longestStreak: 28
    },
    recentAchievements: [
        {
            id: '1',
            title: 'Word Master',
            description: 'Learned 400+ words',
            icon: '🎓',
            unlockedAt: '2025-06-28',
            rarity: 'epic'
        },
        {
            id: '2',
            title: 'Streak Champion',
            description: '10-day study streak',
            icon: '🔥',
            unlockedAt: '2025-06-26',
            rarity: 'rare'
        },
        {
            id: '3',
            title: 'Business Pro',
            description: 'Completed Business English',
            icon: '💼',
            unlockedAt: '2025-06-25',
            rarity: 'common'
        }
    ]
};
// Helper functions
export const getXPProgressColor = (percentage) => {
    if (percentage < 30)
        return 'from-accent-400 to-accent-500'; // Orange
    if (percentage < 70)
        return 'from-primary-400 to-primary-500'; // Blue
    return 'from-success-400 to-success-500'; // Green
};
export const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
        case 'Beginner': return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
        case 'Intermediate': return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30';
        case 'Advanced': return 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30';
        case 'Expert': return 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30';
        default: return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30';
    }
};
