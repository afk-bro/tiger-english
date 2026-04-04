# Flashcard Accessibility Fix: Nested Interactive Elements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the WAI-ARIA nesting violation in `Flashcard.tsx` where the outer `role="button"` wrapper contains nested interactive elements (TTS button, Show Example button), by replacing the wrapper with per-face overlay `<button>` elements that are DOM siblings to inner controls.

**Architecture:** Remove `role="button"` from the outer wrapper entirely. Each card face gets a real `<button>` as its first DOM child, absolutely positioned to fill the face. All other face content follows as siblings — not nested inside the flip button. `tabIndex` is managed on every interactive element so the hidden face cannot receive keyboard focus. `stopPropagation()` and `handleCardKeyDown` are removed as they are no longer needed.

**Tech Stack:** React 19 + TypeScript, Tailwind CSS, Vitest + @testing-library/react, `react-i18next`.

---

## Branch

```bash
git checkout -b fix/flashcard-a11y-nested-buttons
```

---

## File Map

| Action | Path |
|--------|------|
| Create | `src/components/flashcards/__tests__/Flashcard.test.tsx` |
| Modify | `src/components/flashcards/Flashcard.tsx` |

---

## Task 1: Write failing tests

**Files:**
- Create: `src/components/flashcards/__tests__/Flashcard.test.tsx`

- [ ] **Step 1: Create the test file**

```tsx
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
      screen.getByRole('button', { name: 'Flip card for Hello' })
    ).toBeInTheDocument();
  });

  it('front flip button uses generic label when englishText is empty', () => {
    render(<Flashcard data={makeCard({ englishText: '' })} />);
    expect(
      screen.getByRole('button', { name: 'Flip card to see translation' })
    ).toBeInTheDocument();
  });

  it('back flip button always has label "Flip card back"', () => {
    render(<Flashcard data={makeCard()} />);
    expect(
      screen.getByRole('button', { name: 'Flip card back' })
    ).toBeInTheDocument();
  });
});

// ── tabIndex management ───────────────────────────────────────────────────────

describe('Flashcard — tabIndex management', () => {
  it('front flip button is keyboard-focusable before flipping', () => {
    render(<Flashcard data={makeCard()} />);
    expect(
      screen.getByRole('button', { name: 'Flip card for Hello' })
    ).toHaveAttribute('tabindex', '0');
  });

  it('back flip button is not keyboard-focusable before flipping', () => {
    render(<Flashcard data={makeCard()} />);
    expect(
      screen.getByRole('button', { name: 'Flip card back' })
    ).toHaveAttribute('tabindex', '-1');
  });

  it('flipping swaps tabIndex on both flip buttons', () => {
    render(<Flashcard data={makeCard()} />);
    const frontBtn = screen.getByRole('button', { name: 'Flip card for Hello' });
    const backBtn = screen.getByRole('button', { name: 'Flip card back' });

    fireEvent.click(frontBtn);

    expect(frontBtn).toHaveAttribute('tabindex', '-1');
    expect(backBtn).toHaveAttribute('tabindex', '0');
  });

  it('Show Example button is not keyboard-focusable before flipping', () => {
    render(<Flashcard data={makeCard({ exampleSentence: 'Hello, how are you?' })} />);
    expect(
      screen.getByRole('button', { name: 'Show Example' })
    ).toHaveAttribute('tabindex', '-1');
  });

  it('Show Example button is keyboard-focusable after flipping to back', () => {
    render(<Flashcard data={makeCard({ exampleSentence: 'Hello, how are you?' })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Flip card for Hello' }));
    expect(
      screen.getByRole('button', { name: 'Show Example' })
    ).toHaveAttribute('tabindex', '0');
  });
});

// ── Flip behavior ─────────────────────────────────────────────────────────────

describe('Flashcard — flip behavior', () => {
  it('clicking the front flip button flips the card', () => {
    render(<Flashcard data={makeCard()} />);
    const frontBtn = screen.getByRole('button', { name: 'Flip card for Hello' });
    const backBtn = screen.getByRole('button', { name: 'Flip card back' });

    fireEvent.click(frontBtn);

    expect(backBtn).toHaveAttribute('tabindex', '0');
    expect(frontBtn).toHaveAttribute('tabindex', '-1');
  });

  it('clicking the back flip button flips back to front', () => {
    render(<Flashcard data={makeCard()} />);
    const frontBtn = screen.getByRole('button', { name: 'Flip card for Hello' });
    const backBtn = screen.getByRole('button', { name: 'Flip card back' });

    fireEvent.click(frontBtn);
    fireEvent.click(backBtn);

    expect(frontBtn).toHaveAttribute('tabindex', '0');
    expect(backBtn).toHaveAttribute('tabindex', '-1');
  });
});

// ── Inner buttons do not trigger flip ─────────────────────────────────────────

describe('Flashcard — inner buttons do not flip the card', () => {
  it('clicking Show Example does not flip the card', () => {
    render(<Flashcard data={makeCard({ exampleSentence: 'Hello, how are you?' })} />);
    fireEvent.click(screen.getByRole('button', { name: 'Flip card for Hello' }));
    const backBtn = screen.getByRole('button', { name: 'Flip card back' });
    expect(backBtn).toHaveAttribute('tabindex', '0');

    fireEvent.click(screen.getByRole('button', { name: 'Show Example' }));

    expect(backBtn).toHaveAttribute('tabindex', '0'); // still on back
  });

  describe('with TTS available', () => {
    beforeEach(() => {
      Object.defineProperty(window, 'speechSynthesis', {
        value: { speak: vi.fn(), cancel: vi.fn() },
        writable: true,
        configurable: true,
      });
    });

    afterEach(() => {
      Object.defineProperty(window, 'speechSynthesis', {
        value: undefined,
        writable: true,
        configurable: true,
      });
    });

    it('clicking the TTS button does not flip the card', () => {
      render(<Flashcard data={makeCard()} />);
      fireEvent.click(screen.getByRole('button', { name: 'Flip card for Hello' }));
      const backBtn = screen.getByRole('button', { name: 'Flip card back' });
      expect(backBtn).toHaveAttribute('tabindex', '0');

      fireEvent.click(
        screen.getByRole('button', { name: 'Hear pronunciation of Hello' })
      );

      expect(backBtn).toHaveAttribute('tabindex', '0'); // still on back
    });
  });
});
```

- [ ] **Step 2: Run the tests and verify they fail**

```bash
npm test -- src/components/flashcards/__tests__/Flashcard.test.tsx
```

Expected: multiple failures. The outer wrapper currently has `role="button"` and `tabindex="0"`, and there are no buttons with labels `"Flip card for Hello"` or `"Flip card back"`.

---

## Task 2: Refactor `Flashcard.tsx`

**Files:**
- Modify: `src/components/flashcards/Flashcard.tsx`

- [ ] **Step 1: Replace the file with the refactored implementation**

Key changes from the original:
- Outer wrapper: `role="button"`, `tabIndex`, `onClick`, `onKeyDown` removed — plain sizing div
- `handleCardKeyDown` deleted (native `<button>` handles Enter/Space)
- `handleExampleToggle` and `handleSpeak` lose their event parameter and `stopPropagation()` calls
- Each face gets an overlay `<button className="flip-btn absolute inset-0 ...">` as first child
- Face containers gain `select-none` and the `:has(.flip-btn:focus-visible)` ring classes
- TTS and Show Example use native `<button>` elements with explicit `tabIndex`
- `Button` component import removed (Show Example now uses a native `<button>` with equivalent Tailwind classes)

Full file:

```tsx
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Volume2 } from "lucide-react";
import type { FlashcardCard } from "@/features/flashcards/types";

export interface FlashcardProps {
  data: FlashcardCard;
}

export function Flashcard({ data }: FlashcardProps) {
  const { t } = useTranslation();
  const { nativeText, englishText, partOfSpeech, level, exampleSentence } = data;
  const [isFlipped, setIsFlipped] = useState(false);
  const [showExample, setShowExample] = useState(false);

  const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  const handleFlip = () => setIsFlipped((prev) => !prev);
  const handleExampleToggle = () => setShowExample((prev) => !prev);
  const handleSpeak = () => {
    if (!englishText) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(englishText);
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  };

  const getDifficultyColor = (difficulty?: string) => {
    switch (difficulty) {
      case 'basic':       return 'bg-success-100 text-success-700 border-success-200';
      case 'intermediate': return 'bg-accent-100 text-accent-700 border-accent-200';
      case 'advanced':    return 'bg-red-100 text-red-700 border-red-200';
      default:            return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const frontFlipLabel = englishText
    ? `Flip card for ${englishText}`
    : 'Flip card to see translation';

  return (
    <div className="w-full h-52 sm:w-[500px] sm:h-72 lg:w-[800px] lg:h-[480px] mx-auto perspective">
      {/* Flip Container */}
      <div
        className={`relative w-full h-full transition-transform duration-700 preserve-3d transform-gpu origin-center ${
          isFlipped ? "rotate-y-180" : ""
        }`}
        style={{ willChange: 'transform' }}
      >
        {/* Front Side - Native Language */}
        <div
          className={`absolute inset-0 w-full h-full backface-hidden transition-opacity duration-300 ${
            isFlipped ? 'opacity-0' : 'opacity-100'
          }`}
        >
          <div className="w-full h-full bg-white border-2 border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-shadow relative p-8 select-none [&:has(>.flip-btn:focus-visible)]:ring-2 [&:has(>.flip-btn:focus-visible)]:ring-primary-400/40">
            {/* Overlay flip button — first child, fills face, sits behind content */}
            <button
              type="button"
              className="flip-btn absolute inset-0 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/40"
              onClick={handleFlip}
              tabIndex={isFlipped ? -1 : 0}
              aria-label={frontFlipLabel}
            />
            {/* Corner Badges */}
            {level && (
              <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(level)}`}>
                {level.toUpperCase()}
              </div>
            )}
            {partOfSpeech && (
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-700 border border-primary-200">
                {partOfSpeech}
              </div>
            )}
            {/* Main Content - Perfectly Centered */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                {nativeText ? (
                  <>
                    <p className="text-4xl sm:text-5xl font-semibold text-gray-800 mb-4">
                      {nativeText}
                    </p>
                    <div className="w-16 h-1 bg-primary-300 mx-auto rounded-full" />
                  </>
                ) : (
                  <>
                    <p className="text-lg text-gray-400 italic mb-2">{t('flashcards.translation_coming_soon')}</p>
                    <div className="w-16 h-1 bg-gray-200 mx-auto rounded-full" />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Back Side - English Translation */}
        <div className={`absolute inset-0 w-full h-full backface-hidden rotate-y-180 transition-opacity duration-300 ${
            isFlipped ? 'opacity-100' : 'opacity-0'
          }`}>
          <div className="w-full h-full bg-gradient-to-br from-primary-50 to-primary-100 border-2 border-primary-200 rounded-xl shadow-lg hover:shadow-xl transition-shadow relative p-8 flex flex-col select-none [&:has(>.flip-btn:focus-visible)]:ring-2 [&:has(>.flip-btn:focus-visible)]:ring-primary-400/40">
            {/* Overlay flip button — first child, fills face, sits behind content */}
            <button
              type="button"
              className="flip-btn absolute inset-0 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/40"
              onClick={handleFlip}
              tabIndex={isFlipped ? 0 : -1}
              aria-label="Flip card back"
            />
            {/* Corner Badges */}
            {level && (
              <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-medium border ${getDifficultyColor(level)}`}>
                {level.toUpperCase()}
              </div>
            )}
            {partOfSpeech && (
              <div className="absolute top-4 right-4 px-3 py-1 rounded-full text-sm font-medium bg-primary-200 text-primary-800 border border-primary-300">
                {partOfSpeech}
              </div>
            )}

            {/* Main Content - Centered in remaining space */}
            <div className="flex-1 flex items-center justify-center pt-4">
              <div className="text-center">
                <div className="flex items-center justify-center gap-3 mb-4">
                  <p className="text-4xl sm:text-5xl font-semibold text-primary-800">
                    {englishText}
                  </p>
                  {ttsSupported && (
                    <button
                      type="button"
                      aria-label={`Hear pronunciation of ${englishText}`}
                      onClick={handleSpeak}
                      tabIndex={isFlipped ? 0 : -1}
                      className="flex-shrink-0 p-2 rounded-full text-primary-500 hover:text-primary-700 hover:bg-primary-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/40"
                    >
                      <Volume2 className="w-6 h-6 sm:w-7 sm:h-7" />
                    </button>
                  )}
                </div>
                <div className="w-16 h-1 bg-primary-400 mx-auto rounded-full" />
              </div>
            </div>

            {/* Example Section - sits below the word in normal flow */}
            {exampleSentence && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={handleExampleToggle}
                  tabIndex={isFlipped ? 0 : -1}
                  className="px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ease-out active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/40 border-2 border-primary-400 bg-white text-primary-700 hover:bg-primary-50"
                >
                  {showExample ? 'Hide Example' : 'Show Example'}
                </button>

                <div className={`transition-all duration-300 overflow-hidden ${
                  showExample ? 'max-h-32 opacity-100 mt-3' : 'max-h-0 opacity-0'
                }`}>
                  <p className="text-lg text-primary-700 italic text-center px-4">
                    "{exampleSentence}"
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run the Flashcard tests and verify they pass**

```bash
npm test -- src/components/flashcards/__tests__/Flashcard.test.tsx
```

Expected: all tests PASS.

- [ ] **Step 3: Run the full test suite to check for regressions**

```bash
npm test
```

Expected: all tests PASS. The `FlashcardViewer` tests mock `Flashcard` entirely so they are unaffected by this refactor.

- [ ] **Step 4: Type-check**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/flashcards/__tests__/Flashcard.test.tsx \
        src/components/flashcards/Flashcard.tsx
git commit -m "fix: replace role=button wrapper with per-face overlay buttons in Flashcard

Fixes WAI-ARIA nesting violation where TTS and Show Example buttons
were nested inside a role=button element. Each card face now has a
real <button> as its first DOM child that fills the face as a flip
target. Inner buttons are DOM siblings, not descendants, so no
nesting violation exists. tabIndex is managed on all interactive
elements to prevent focus reaching the hidden face."
```
