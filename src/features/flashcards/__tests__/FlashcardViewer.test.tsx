import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import type { FlashcardCard, CardProgress } from '../types';

// Render Flashcard as a simple stub so we can assert on displayed english word
// without depending on the 3D-flip animation internals.
vi.mock('@/components/flashcards/Flashcard', () => ({
  Flashcard: ({ data }: { data: FlashcardCard }) => (
    <div data-testid="flashcard">{data.englishWord}</div>
  ),
}));

import { FlashcardViewer } from '../components/FlashcardViewer';

// ── Helpers ──────────────────────────────────────────────────────────────────

const makeCard = (overrides?: Partial<FlashcardCard>): FlashcardCard => ({
  id: 'c1',
  setId: 'set-1',
  nativeWord: 'สวัสดี',
  englishWord: 'Hello',
  partOfSpeech: 'interjection',
  level: 'basic',
  exampleSentence: null,
  imageUrl: null,
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
    expect(screen.getByText('No cards in this set yet.')).toBeInTheDocument();
  });

  it('"Back to sets" button calls onBack when cards is empty', () => {
    render(<FlashcardViewer {...baseProps} cards={[]} />);
    fireEvent.click(screen.getByRole('button', { name: /back to sets/i }));
    expect(baseProps.onBack).toHaveBeenCalledTimes(1);
  });
});

// ── Card counter ──────────────────────────────────────────────────────────────

describe('FlashcardViewer — card counter', () => {
  it('shows "Card 1 of N" counter', () => {
    const cards = [makeCard(), makeCard({ id: 'c2', englishWord: 'Water' })];
    render(<FlashcardViewer {...baseProps} cards={cards} />);
    expect(screen.getByText('Card 1 of 2')).toBeInTheDocument();
  });
});

// ── Navigation buttons ────────────────────────────────────────────────────────

describe('FlashcardViewer — button navigation', () => {
  it('Next button advances to the next card', () => {
    const cards = [makeCard(), makeCard({ id: 'c2', englishWord: 'Water' })];
    render(<FlashcardViewer {...baseProps} cards={cards} />);

    expect(screen.getByTestId('flashcard')).toHaveTextContent('Hello');
    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByTestId('flashcard')).toHaveTextContent('Water');
  });

  it('Previous button goes back to the previous card', () => {
    const cards = [makeCard(), makeCard({ id: 'c2', englishWord: 'Water' })];
    render(<FlashcardViewer {...baseProps} cards={cards} />);

    fireEvent.click(screen.getByRole('button', { name: /next/i }));
    expect(screen.getByTestId('flashcard')).toHaveTextContent('Water');

    fireEvent.click(screen.getByRole('button', { name: /previous/i }));
    expect(screen.getByTestId('flashcard')).toHaveTextContent('Hello');
  });

  it('dot navigation jumps directly to an arbitrary card', () => {
    const cards = [
      makeCard(),
      makeCard({ id: 'c2', englishWord: 'Water' }),
      makeCard({ id: 'c3', englishWord: 'Food' }),
    ];
    render(<FlashcardViewer {...baseProps} cards={cards} />);

    fireEvent.click(screen.getByLabelText('Go to card 3'));
    expect(screen.getByTestId('flashcard')).toHaveTextContent('Food');
  });

  it('Back button calls onBack', () => {
    render(<FlashcardViewer {...baseProps} />);
    // The back button text is "← Back" (not "← Back to sets" which appears on empty state)
    fireEvent.click(screen.getByRole('button', { name: /^← back$/i }));
    expect(baseProps.onBack).toHaveBeenCalledTimes(1);
  });
});

// ── Keyboard navigation ───────────────────────────────────────────────────────

describe('FlashcardViewer — keyboard navigation', () => {
  it('ArrowRight advances to the next card', () => {
    const cards = [makeCard(), makeCard({ id: 'c2', englishWord: 'Water' })];
    render(<FlashcardViewer {...baseProps} cards={cards} />);

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    });
    expect(screen.getByTestId('flashcard')).toHaveTextContent('Water');
  });

  it('ArrowLeft goes back to the previous card', () => {
    const cards = [makeCard(), makeCard({ id: 'c2', englishWord: 'Water' })];
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
    expect(screen.queryByRole('button', { name: /i know this/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /still learning/i })).not.toBeInTheDocument();
  });

  it('shows known/unknown buttons for authenticated users', () => {
    render(<FlashcardViewer {...baseProps} isAuthenticated={true} />);
    expect(screen.getByRole('button', { name: /i know this/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /still learning/i })).toBeInTheDocument();
  });

  it('"I know this" calls onMarkKnown with card id and advances to next card', () => {
    const cards = [makeCard(), makeCard({ id: 'c2', englishWord: 'Water' })];
    render(<FlashcardViewer {...baseProps} cards={cards} isAuthenticated={true} />);

    fireEvent.click(screen.getByRole('button', { name: /i know this/i }));

    expect(baseProps.onMarkKnown).toHaveBeenCalledWith('c1');
    expect(screen.getByTestId('flashcard')).toHaveTextContent('Water');
  });

  it('"Still learning" calls onMarkUnknown with card id and advances to next card', () => {
    const cards = [makeCard(), makeCard({ id: 'c2', englishWord: 'Water' })];
    render(<FlashcardViewer {...baseProps} cards={cards} isAuthenticated={true} />);

    fireEvent.click(screen.getByRole('button', { name: /still learning/i }));

    expect(baseProps.onMarkUnknown).toHaveBeenCalledWith('c1');
    expect(screen.getByTestId('flashcard')).toHaveTextContent('Water');
  });
});
