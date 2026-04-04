import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import type { FlashcardCard, CardProgress } from '../types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Render Flashcard as a simple stub so we can assert on displayed english word
// without depending on the 3D-flip animation internals.
vi.mock('@/components/flashcards/Flashcard', () => ({
  Flashcard: ({ data }: { data: FlashcardCard }) => (
    <div data-testid="flashcard">{data.englishText}</div>
  ),
}));

import { FlashcardViewer } from '../components/FlashcardViewer';

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeCard = (overrides?: Partial<FlashcardCard>): FlashcardCard => ({
  id: 'c1',
  setId: 'set-1',
  nativeText: 'สวัสดี',
  englishText: 'Hello',
  partOfSpeech: 'interjection',
  level: 'basic',
  category: null,
  exampleSentence: null,
  imageUrl: null,
  englishAudioUrl: null,
  nativeAudioUrl: null,
  notes: null,
  isPhrase: false,
  sortOrder: 1,
  ...overrides,
});

const baseProps = {
  setId: 'set-1',
  cards: [makeCard()],
  progressMap: {},
  onMarkKnown: vi.fn(),
  onMarkUnknown: vi.fn(),
  onBack: vi.fn(),
  isAuthenticated: false,
};

beforeEach(() => vi.clearAllMocks());

// ── Empty state ───────────────────────────────────────────────────────────────

describe('FlashcardViewer — empty state', () => {
  it('shows "No cards" message when cards is empty', () => {
    render(<FlashcardViewer {...baseProps} cards={[]} />);
    expect(screen.getByText('flashcards.viewer.no_cards')).toBeInTheDocument();
  });

  it('"Back to sets" button calls onBack when cards is empty', () => {
    render(<FlashcardViewer {...baseProps} cards={[]} />);
    fireEvent.click(screen.getByRole('button', { name: 'flashcards.viewer.back_to_sets' }));
    expect(baseProps.onBack).toHaveBeenCalledTimes(1);
  });
});

// ── Card counter ──────────────────────────────────────────────────────────────

describe('FlashcardViewer — card counter', () => {
  it('shows "Card 1 of N" counter', () => {
    const cards = [makeCard(), makeCard({ id: 'c2', englishText: 'Water' })];
    render(<FlashcardViewer {...baseProps} cards={cards} />);
    expect(screen.getByText('flashcards.viewer.card_count')).toBeInTheDocument();
  });
});

// ── Navigation buttons ────────────────────────────────────────────────────────

describe('FlashcardViewer — button navigation', () => {
  it('Next button advances to the next card', () => {
    const cards = [makeCard(), makeCard({ id: 'c2', englishText: 'Water' })];
    render(<FlashcardViewer {...baseProps} cards={cards} />);

    expect(screen.getByTestId('flashcard')).toHaveTextContent('Hello');
    fireEvent.click(screen.getByRole('button', { name: 'flashcards.viewer.next' }));
    expect(screen.getByTestId('flashcard')).toHaveTextContent('Water');
  });

  it('Previous button goes back to the previous card', () => {
    const cards = [makeCard(), makeCard({ id: 'c2', englishText: 'Water' })];
    render(<FlashcardViewer {...baseProps} cards={cards} />);

    fireEvent.click(screen.getByRole('button', { name: 'flashcards.viewer.next' }));
    expect(screen.getByTestId('flashcard')).toHaveTextContent('Water');

    fireEvent.click(screen.getByRole('button', { name: 'flashcards.viewer.previous' }));
    expect(screen.getByTestId('flashcard')).toHaveTextContent('Hello');
  });

  it('dot navigation jumps directly to an arbitrary card', () => {
    const cards = [
      makeCard(),
      makeCard({ id: 'c2', englishText: 'Water' }),
      makeCard({ id: 'c3', englishText: 'Food' }),
    ];
    render(<FlashcardViewer {...baseProps} cards={cards} />);

    // With the i18n mock, all dots share the same aria-label key; pick the third (index 2)
    const dots = screen.getAllByLabelText('flashcards.viewer.go_to_card');
    fireEvent.click(dots[2]);
    expect(screen.getByTestId('flashcard')).toHaveTextContent('Food');
  });

  it('Back button calls onBack', () => {
    render(<FlashcardViewer {...baseProps} />);
    // The back button text is "← Back" (not "← Back to sets" which appears on empty state)
    fireEvent.click(screen.getByRole('button', { name: 'flashcards.viewer.back' }));
    expect(baseProps.onBack).toHaveBeenCalledTimes(1);
  });
});

// ── Keyboard navigation ───────────────────────────────────────────────────────

describe('FlashcardViewer — keyboard navigation', () => {
  it('ArrowRight advances to the next card', () => {
    const cards = [makeCard(), makeCard({ id: 'c2', englishText: 'Water' })];
    render(<FlashcardViewer {...baseProps} cards={cards} />);

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    });
    expect(screen.getByTestId('flashcard')).toHaveTextContent('Water');
  });

  it('ArrowLeft goes back to the previous card', () => {
    const cards = [makeCard(), makeCard({ id: 'c2', englishText: 'Water' })];
    render(<FlashcardViewer {...baseProps} cards={cards} />);

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    });
    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }));
    });
    expect(screen.getByTestId('flashcard')).toHaveTextContent('Hello');
  });
});

// ── Progress badge ────────────────────────────────────────────────────────────

describe('FlashcardViewer — progress badge', () => {
  it('shows "known" badge when progress status is known', () => {
    const progressMap: Record<string, CardProgress> = {
      c1: { flashcardId: 'c1', status: 'known', lastStudiedAt: null },
    };
    render(<FlashcardViewer {...baseProps} progressMap={progressMap} />);
    expect(screen.getByText('known')).toBeInTheDocument();
  });

  it('shows "unknown" badge when progress status is unknown', () => {
    const progressMap: Record<string, CardProgress> = {
      c1: { flashcardId: 'c1', status: 'unknown', lastStudiedAt: null },
    };
    render(<FlashcardViewer {...baseProps} progressMap={progressMap} />);
    expect(screen.getByText('unknown')).toBeInTheDocument();
  });

  it('shows no badge when card has not been studied', () => {
    render(<FlashcardViewer {...baseProps} progressMap={{}} />);
    expect(screen.queryByText('known')).not.toBeInTheDocument();
    expect(screen.queryByText('unknown')).not.toBeInTheDocument();
  });
});

// ── Auth-gated progress buttons ───────────────────────────────────────────────

describe('FlashcardViewer — auth-gated buttons', () => {
  it('hides known/unknown buttons for guests', () => {
    render(<FlashcardViewer {...baseProps} isAuthenticated={false} />);
    expect(screen.queryByRole('button', { name: 'flashcards.viewer.i_know_this' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'flashcards.viewer.still_learning' })).not.toBeInTheDocument();
  });

  it('shows known/unknown buttons for authenticated users', () => {
    render(<FlashcardViewer {...baseProps} isAuthenticated={true} />);
    expect(screen.getByRole('button', { name: 'flashcards.viewer.i_know_this' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'flashcards.viewer.still_learning' })).toBeInTheDocument();
  });

  it('"I know this" calls onMarkKnown with card id and advances to next card', () => {
    const cards = [makeCard(), makeCard({ id: 'c2', englishText: 'Water' })];
    render(<FlashcardViewer {...baseProps} cards={cards} isAuthenticated={true} />);

    fireEvent.click(screen.getByRole('button', { name: 'flashcards.viewer.i_know_this' }));

    expect(baseProps.onMarkKnown).toHaveBeenCalledWith('c1');
    expect(screen.getByTestId('flashcard')).toHaveTextContent('Water');
  });

  it('"Still learning" calls onMarkUnknown with card id and advances to next card', () => {
    const cards = [makeCard(), makeCard({ id: 'c2', englishText: 'Water' })];
    render(<FlashcardViewer {...baseProps} cards={cards} isAuthenticated={true} />);

    fireEvent.click(screen.getByRole('button', { name: 'flashcards.viewer.still_learning' }));

    expect(baseProps.onMarkUnknown).toHaveBeenCalledWith('c1');
    expect(screen.getByTestId('flashcard')).toHaveTextContent('Water');
  });
});
