// src/pages/FlashcardsPage.tsx
import { useState } from 'react';
import { useUserStore } from '@/stores/useUserStore';
import { useFlashcardSets } from '@/features/flashcards/hooks/useFlashcardSets';
import { useFlashcards } from '@/features/flashcards/hooks/useFlashcards';
import { useCardProgress } from '@/features/flashcards/hooks/useCardProgress';
import { FlashcardSetList } from '@/features/flashcards/components/FlashcardSetList';
import { FlashcardViewer } from '@/features/flashcards/components/FlashcardViewer';
import { CreateSetModal } from '@/features/flashcards/components/CreateSetModal';

export default function FlashcardsPage() {
  const { profile } = useUserStore();
  const isAuthenticated = profile !== null;

  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const { sets, loading: setsLoading, error: setsError, createSet } = useFlashcardSets(profile?.id);
  const { cards, loading: cardsLoading } = useFlashcards(selectedSetId);
  const { progressMap, markKnown, markUnknown } = useCardProgress(
    cards.map((c) => c.id),
    profile?.id,
  );

  return (
    <div className="min-h-screen bg-surface-light dark:bg-surface-dark">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
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
