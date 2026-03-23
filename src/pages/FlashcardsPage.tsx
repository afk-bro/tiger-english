// src/pages/FlashcardsPage.tsx
import { useState } from 'react';
import { useUserStore } from '@/stores/useUserStore';
import { useFlashcardSets } from '@/features/flashcards/hooks/useFlashcardSets';
import { useFlashcards } from '@/features/flashcards/hooks/useFlashcards';
import { useCardProgress } from '@/features/flashcards/hooks/useCardProgress';
import { FlashcardSetList } from '@/features/flashcards/components/FlashcardSetList';
import { FlashcardViewer } from '@/features/flashcards/components/FlashcardViewer';
import { CreateSetModal } from '@/features/flashcards/components/CreateSetModal';
import { SUPPORTED_LANGUAGES } from '@/schemas/authSchema';

const LANGUAGE_NAMES: Record<string, string> = {
  th: 'Thai',
  zh: 'Chinese',
  vi: 'Vietnamese',
};

export default function FlashcardsPage() {
  const { profile } = useUserStore();
  const isAuthenticated = profile !== null;

  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [localLanguage, setLocalLanguage] = useState<string | null>(null);

  // Language resolution: profile (authoritative) → local selection → null (blocked)
  const languageCode = profile?.native_language ?? localLanguage;

  const { sets, loading: setsLoading, error: setsError, createSet } = useFlashcardSets(profile?.id);
  const { cards, loading: cardsLoading } = useFlashcards(selectedSetId, languageCode ?? null);
  const { progressMap, markKnown, markUnknown } = useCardProgress(
    cards.map((c) => c.id),
    profile?.id,
  );

  return (
    <div className="min-h-screen bg-semantic-bg dark:bg-semantic-bg">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        {/* Language selector — shown when profile.native_language is not set */}
        {!languageCode && (
          <div className="mb-6 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Choose your native language to see translations:
            </p>
            <div className="flex gap-2 flex-wrap">
              {SUPPORTED_LANGUAGES.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLocalLanguage(code)}
                  className="px-4 py-2 rounded-lg border border-primary-300 text-primary-700 hover:bg-primary-50 dark:border-primary-600 dark:text-primary-300 dark:hover:bg-primary-900/20 text-sm font-medium transition-colors"
                >
                  {LANGUAGE_NAMES[code]}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedSetId === null ? (
          <FlashcardSetList
            sets={sets}
            loading={setsLoading}
            error={setsError}
            isAuthenticated={isAuthenticated}
            onSelectSet={setSelectedSetId}
            onCreateSet={() => setIsCreateModalOpen(true)}
          />
        ) : cardsLoading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-primary-600">Loading cards…</p>
          </div>
        ) : (
          <FlashcardViewer
            setId={selectedSetId}
            cards={cards}
            progressMap={progressMap}
            onMarkKnown={markKnown}
            onMarkUnknown={markUnknown}
            onBack={() => setSelectedSetId(null)}
            isAuthenticated={isAuthenticated}
          />
        )}

        {isCreateModalOpen && (
          <CreateSetModal
            onClose={() => setIsCreateModalOpen(false)}
            onSubmit={createSet}
          />
        )}
      </div>
    </div>
  );
}
