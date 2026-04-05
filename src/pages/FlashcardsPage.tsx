// src/pages/FlashcardsPage.tsx
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUserStore } from '@/stores/useUserStore';
import { useFlashcardSets } from '@/features/flashcards/hooks/useFlashcardSets';
import { useFlashcards } from '@/features/flashcards/hooks/useFlashcards';
import { useCardProgress } from '@/features/flashcards/hooks/useCardProgress';
import { FlashcardSetList } from '@/features/flashcards/components/FlashcardSetList';
import { FlashcardViewer } from '@/features/flashcards/components/FlashcardViewer';
import { CreateSetModal } from '@/features/flashcards/components/CreateSetModal';
import { SUPPORTED_LANGUAGES } from '@/schemas/authSchema';

export default function FlashcardsPage() {
  const { t } = useTranslation();
  const { profile, profileLoading } = useUserStore();
  const isAuthenticated = profile !== null;

  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [localLanguage, setLocalLanguage] = useState<string | null>(null);

  // Defer browser-language detection until after profile resolves so we don't
  // fetch cards in the wrong language and then refetch when native_language loads.
  useEffect(() => {
    if (profileLoading) return;
    if (profile?.native_language) return;
    setLocalLanguage((prev) => {
      if (prev !== null) return prev; // preserve a manual pick
      const detected = navigator.language.split('-')[0].toLowerCase();
      return (SUPPORTED_LANGUAGES as readonly string[]).includes(detected) ? detected : null;
    });
  }, [profileLoading, profile?.native_language]);

  // Language resolution: profile (authoritative) → browser/local selection → null (blocked)
  const languageCode = profile?.native_language ?? localLanguage;

  const LANGUAGE_NAMES: Record<typeof SUPPORTED_LANGUAGES[number], string> = {
    th: t('flashcards.language.th'),
    zh: t('flashcards.language.zh'),
    vi: t('flashcards.language.vi'),
  };

  const renderLanguageButtons = () => (
    <div className="flex gap-3 flex-wrap justify-center">
      {SUPPORTED_LANGUAGES.map((code) => (
        <button
          key={code}
          type="button"
          onClick={() => setLocalLanguage(code)}
          className="px-6 py-3 rounded-xl border-2 border-primary-400 bg-white text-primary-700 hover:bg-primary-50 dark:bg-transparent dark:border-primary-500 dark:text-primary-300 dark:hover:bg-primary-900/30 text-base font-semibold transition-colors"
        >
          {LANGUAGE_NAMES[code]}
        </button>
      ))}
    </div>
  );

  const { sets, loading: setsLoading, error: setsError, createSet } = useFlashcardSets(profile?.id);
  const { cards, loading: cardsLoading } = useFlashcards(selectedSetId, languageCode ?? null);
  const { progressMap, markKnown, markUnknown } = useCardProgress(
    cards.map((c) => c.id),
    profile?.id,
  );

  return (
    <div className="min-h-screen bg-semantic-bg dark:bg-semantic-bg">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        {/* When a set is selected but no language — show prominent picker instead of confusing "No cards" */}
        {!languageCode && selectedSetId !== null ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="bg-white dark:bg-gray-800 border-2 border-primary-200 dark:border-primary-700 rounded-2xl p-10 max-w-sm w-full shadow-md text-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {t('flashcards.language_required.heading')}
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                {t('flashcards.language_required.subtext')}
              </p>
              <div className="mb-5">{renderLanguageButtons()}</div>
              <button
                type="button"
                onClick={() => setSelectedSetId(null)}
                className="text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                {t('flashcards.viewer.back_to_sets')}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Prominent language banner — shown when browsing sets with no language selected */}
            {!languageCode && (
              <div className="mb-8 bg-primary-50 dark:bg-primary-900/20 border-2 border-primary-200 dark:border-primary-700 rounded-2xl p-6 text-center">
                <h2 className="text-lg font-bold text-primary-900 dark:text-primary-100 mb-1">
                  {t('flashcards.language_required.heading')}
                </h2>
                <p className="text-sm text-primary-700 dark:text-primary-300 mb-4">
                  {t('flashcards.language_required.subtext')}
                </p>
                {renderLanguageButtons()}
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
                <p className="text-primary-600">{t('flashcards.loading_cards')}</p>
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
          </>
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
