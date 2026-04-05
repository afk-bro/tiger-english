// src/components/flashcards/__tests__/Flashcard.test.tsx
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { FlashcardCard } from '@/features/flashcards/types';
import { Flashcard } from '../Flashcard';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

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

// ── Semantic structure ────────────────────────────────────────────────────────

describe('Flashcard — semantic structure', () => {
  it('outer wrapper is not an interactive element', () => {
    const { container } = render(<Flashcard data={makeCard()} />);
    const outerDiv = container.firstChild as HTMLElement;
    expect(outerDiv).not.toHaveAttribute('role', 'button');
    expect(outerDiv).not.toHaveAttribute('tabindex');
  });
});

// ── Accessible labels ─────────────────────────────────────────────────────────

describe('Flashcard — flip button accessible labels', () => {
  it('front flip button uses word-specific label when englishText is present', () => {
    render(<Flashcard data={makeCard({ englishText: 'Hello' })} />);
    expect(
      screen.getByRole('button', { hidden: true, name: 'flashcards.flip.front_with_word' })
    ).toBeInTheDocument();
  });

  it('front flip button uses generic label when englishText is empty', () => {
    render(<Flashcard data={makeCard({ englishText: '' })} />);
    expect(
      screen.getByRole('button', { hidden: true, name: 'flashcards.flip.front_no_word' })
    ).toBeInTheDocument();
  });

  it('back flip button always has an accessible label', () => {
    render(<Flashcard data={makeCard()} />);
    expect(
      screen.getByRole('button', { hidden: true, name: 'flashcards.flip.back' })
    ).toBeInTheDocument();
  });
});

// ── tabIndex management ───────────────────────────────────────────────────────

describe('Flashcard — tabIndex management', () => {
  it('front flip button is keyboard-focusable before flipping', () => {
    render(<Flashcard data={makeCard()} />);
    expect(
      screen.getByRole('button', { hidden: true, name: 'flashcards.flip.front_with_word' })
    ).toHaveAttribute('tabindex', '0');
  });

  it('back flip button is not keyboard-focusable before flipping', () => {
    render(<Flashcard data={makeCard()} />);
    expect(
      screen.getByRole('button', { hidden: true, name: 'flashcards.flip.back' })
    ).toHaveAttribute('tabindex', '-1');
  });

  it('flipping swaps tabIndex on both flip buttons', () => {
    render(<Flashcard data={makeCard()} />);
    const frontBtn = screen.getByRole('button', { hidden: true, name: 'flashcards.flip.front_with_word' });
    const backBtn = screen.getByRole('button', { hidden: true, name: 'flashcards.flip.back' });

    fireEvent.click(frontBtn);

    expect(frontBtn).toHaveAttribute('tabindex', '-1');
    expect(backBtn).toHaveAttribute('tabindex', '0');
  });

  it('Show Example button is not keyboard-focusable before flipping', () => {
    render(<Flashcard data={makeCard({ exampleSentence: 'Hello, how are you?' })} />);
    expect(
      screen.getByRole('button', { hidden: true, name: 'flashcards.example.show' })
    ).toHaveAttribute('tabindex', '-1');
  });

  it('Show Example button is keyboard-focusable after flipping to back', () => {
    render(<Flashcard data={makeCard({ exampleSentence: 'Hello, how are you?' })} />);
    fireEvent.click(screen.getByRole('button', { hidden: true, name: 'flashcards.flip.front_with_word' }));
    expect(
      screen.getByRole('button', { hidden: true, name: 'flashcards.example.show' })
    ).toHaveAttribute('tabindex', '0');
  });
});

// ── Flip behavior ─────────────────────────────────────────────────────────────

describe('Flashcard — flip behavior', () => {
  it('clicking the front flip button flips the card', () => {
    render(<Flashcard data={makeCard()} />);
    const frontBtn = screen.getByRole('button', { hidden: true, name: 'flashcards.flip.front_with_word' });
    const backBtn = screen.getByRole('button', { hidden: true, name: 'flashcards.flip.back' });

    fireEvent.click(frontBtn);

    expect(backBtn).toHaveAttribute('tabindex', '0');
    expect(frontBtn).toHaveAttribute('tabindex', '-1');
  });

  it('clicking the back flip button flips back to front', () => {
    render(<Flashcard data={makeCard()} />);
    const frontBtn = screen.getByRole('button', { hidden: true, name: 'flashcards.flip.front_with_word' });
    const backBtn = screen.getByRole('button', { hidden: true, name: 'flashcards.flip.back' });

    fireEvent.click(frontBtn);
    fireEvent.click(backBtn);

    expect(frontBtn).toHaveAttribute('tabindex', '0');
    expect(backBtn).toHaveAttribute('tabindex', '-1');
  });
});

// ── Focus management on flip ──────────────────────────────────────────────────

describe('Flashcard — focus management on flip', () => {
  it('mouse click: front flip button does not retain focus after flipping (prevents aria-hidden warning)', () => {
    render(<Flashcard data={makeCard()} />);
    const frontBtn = screen.getByRole('button', { hidden: true, name: 'flashcards.flip.front_with_word' });

    frontBtn.focus();
    expect(document.activeElement).toBe(frontBtn);

    fireEvent.click(frontBtn);

    expect(document.activeElement).not.toBe(frontBtn);
  });

  it('mouse click: back flip button does not retain focus after flipping back', () => {
    render(<Flashcard data={makeCard()} />);
    const frontBtn = screen.getByRole('button', { hidden: true, name: 'flashcards.flip.front_with_word' });
    const backBtn  = screen.getByRole('button', { hidden: true, name: 'flashcards.flip.back' });

    fireEvent.click(frontBtn); // flip to back

    backBtn.focus();
    expect(document.activeElement).toBe(backBtn);

    fireEvent.click(backBtn); // flip back to front

    expect(document.activeElement).not.toBe(backBtn);
  });

  it('keyboard flip (Enter): focus moves to the back flip button', () => {
    render(<Flashcard data={makeCard()} />);
    const frontBtn = screen.getByRole('button', { hidden: true, name: 'flashcards.flip.front_with_word' });
    const backBtn  = screen.getByRole('button', { hidden: true, name: 'flashcards.flip.back' });

    frontBtn.focus();
    fireEvent.keyDown(frontBtn, { key: 'Enter' });
    fireEvent.click(frontBtn); // browser fires click after Enter on a button

    expect(document.activeElement).toBe(backBtn);
  });

  it('keyboard flip (Space): focus moves to the back flip button', () => {
    render(<Flashcard data={makeCard()} />);
    const frontBtn = screen.getByRole('button', { hidden: true, name: 'flashcards.flip.front_with_word' });
    const backBtn  = screen.getByRole('button', { hidden: true, name: 'flashcards.flip.back' });

    frontBtn.focus();
    fireEvent.keyDown(frontBtn, { key: ' ' });
    fireEvent.click(frontBtn);

    expect(document.activeElement).toBe(backBtn);
  });

  it('keyboard flip back (Enter): focus returns to the front flip button', () => {
    render(<Flashcard data={makeCard()} />);
    const frontBtn = screen.getByRole('button', { hidden: true, name: 'flashcards.flip.front_with_word' });
    const backBtn  = screen.getByRole('button', { hidden: true, name: 'flashcards.flip.back' });

    // Flip to back via keyboard
    frontBtn.focus();
    fireEvent.keyDown(frontBtn, { key: 'Enter' });
    fireEvent.click(frontBtn);
    expect(document.activeElement).toBe(backBtn);

    // Flip back to front via keyboard
    fireEvent.keyDown(backBtn, { key: 'Enter' });
    fireEvent.click(backBtn);

    expect(document.activeElement).toBe(frontBtn);
  });
});

// ── Inner buttons do not trigger flip ─────────────────────────────────────────

describe('Flashcard — inner buttons do not flip the card', () => {
  it('clicking Show Example does not flip the card', () => {
    render(<Flashcard data={makeCard({ exampleSentence: 'Hello, how are you?' })} />);
    fireEvent.click(screen.getByRole('button', { hidden: true, name: 'flashcards.flip.front_with_word' }));
    const backBtn = screen.getByRole('button', { hidden: true, name: 'flashcards.flip.back' });
    expect(backBtn).toHaveAttribute('tabindex', '0');

    fireEvent.click(screen.getByRole('button', { hidden: true, name: 'flashcards.example.show' }));

    // Both sides of the invariant: still on back
    expect(backBtn).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('button', { hidden: true, name: 'flashcards.flip.front_with_word' })).toHaveAttribute('tabindex', '-1');
  });

  describe('with TTS available', () => {
    let originalSpeechSynthesis: typeof window.speechSynthesis | undefined;
    let originalSpeechSynthesisUtterance: typeof globalThis.SpeechSynthesisUtterance | undefined;

    beforeEach(() => {
      originalSpeechSynthesis = (window as any).speechSynthesis;
      originalSpeechSynthesisUtterance = (globalThis as any).SpeechSynthesisUtterance;
      Object.defineProperty(window, 'speechSynthesis', {
        value: { speak: vi.fn(), cancel: vi.fn() },
        writable: true,
        configurable: true,
      });
      (globalThis as any).SpeechSynthesisUtterance = vi.fn().mockImplementation((text: string) => ({ text, lang: '' }));
    });

    afterEach(() => {
      Object.defineProperty(window, 'speechSynthesis', {
        value: originalSpeechSynthesis,
        writable: true,
        configurable: true,
      });
      (globalThis as any).SpeechSynthesisUtterance = originalSpeechSynthesisUtterance;
    });

    it('clicking the TTS button does not flip the card', () => {
      render(<Flashcard data={makeCard()} />);
      fireEvent.click(screen.getByRole('button', { hidden: true, name: 'flashcards.flip.front_with_word' }));
      const backBtn = screen.getByRole('button', { hidden: true, name: 'flashcards.flip.back' });
      expect(backBtn).toHaveAttribute('tabindex', '0');

      fireEvent.click(
        screen.getByRole('button', { hidden: true, name: 'flashcards.tts.speak_label' })
      );

      // Both sides of the invariant: still on back
      expect(backBtn).toHaveAttribute('tabindex', '0');
      expect(screen.getByRole('button', { hidden: true, name: 'flashcards.flip.front_with_word' })).toHaveAttribute('tabindex', '-1');
    });
  });
});
