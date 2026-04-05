# Flashcard Accessibility Fix: Nested Interactive Elements

**Date:** 2026-04-04
**Scope:** `src/components/flashcards/Flashcard.tsx`

## Problem

The `Flashcard` component wraps the entire card in a `div` with `role="button"`, `tabIndex={0}`, and `onClick={handleFlip}`. The back face of this card contains two nested interactive elements: a TTS `<button>` and a Show Example `<Button>`. WAI-ARIA prohibits interactive elements inside another interactive element (`role="button"` makes the outer div interactive). This causes assistive technology to behave incorrectly — focus and activation become ambiguous.

## Goal

Fix the semantic structure so no interactive element is nested inside another, while preserving the full-card-click-to-flip UX on both faces.

## Approach

**Per-face overlay `<button>` as first DOM child.**

Remove `role="button"`, `tabIndex`, `onClick`, and `onKeyDown` from the outer wrapper div entirely — it becomes a plain perspective/sizing container. Each card face gets a real `<button>` as its **first DOM child**, absolutely positioned to fill the face. All other face content (badges, word, TTS button, example section) follows as DOM siblings — not nested inside the flip button. No WAI-ARIA nesting violation exists.

Since click events bubble through ancestors and not sideways to siblings, clicks on the TTS button or Show Example button never reach the flip button. `stopPropagation()` can be removed from both handlers. `handleCardKeyDown` can be deleted — native `<button>` elements respond to Enter/Space without it.

## Accessible Labels

| Face | Word available | Label |
|------|---------------|-------|
| Front | yes | `Flip card for {englishText}` |
| Front | no | `Flip card to see translation` |
| Back | any | `Flip card back` |

`englishText` drives the front condition since the back face is what reveals the English word.

## Focus Ring

The overlay button suppresses its own default outline (`focus:outline-none`). The styled face container shows the ring using CSS `:has()`:

```
[&:has(>.flip-btn:focus-visible)]:ring-2
[&:has(>.flip-btn:focus-visible)]:ring-primary-400/40
```

`flip-btn` is a plain utility class on the overlay button, used only as a CSS selector target.

**Fallback:** The overlay button also carries `focus-visible:ring-2 focus-visible:ring-primary-400/40` directly, so if `:has()` is unsupported the button itself shows the ring. Target audience is modern mobile and desktop browsers; `:has()` is well-supported, so this fallback is a safety net only.

## tabIndex Management

The CSS 3D flip leaves both faces in the DOM simultaneously. Without tabIndex management, keyboard users could tab to controls on the hidden face. All interactive elements on both faces have their `tabIndex` driven by `isFlipped`:

| Element | Front visible (`!isFlipped`) | Back visible (`isFlipped`) |
|---|---|---|
| Front flip button | `0` | `-1` |
| Back flip button | `-1` | `0` |
| TTS button | `-1` | `0` |
| Show Example button | `-1` | `0` |

## Text Selectability

Both styled face containers get `select-none`. Without it, clicking to flip drags-selects the word text — poor UX.

## Stacking

The overlay button is `absolute inset-0 rounded-xl` and appears first in the DOM inside its face container. Normal-flow children (badges, word, TTS, example) follow it in the DOM and naturally stack above it visually. No explicit `z-index` is required. Interactive controls (TTS, Show Example) receive pointer events naturally as the topmost elements in their area.

## Files Changed

| File | Change |
|------|--------|
| `src/components/flashcards/Flashcard.tsx` | Remove `role="button"` wrapper; add per-face overlay flip buttons; add `select-none`; manage tabIndex; remove `stopPropagation()` and `handleCardKeyDown` |

## Out of Scope

- No changes to flashcard navigation, data fetching, or other components.
- No changes to the front face interactive structure (it has no nested buttons — the overlay approach is applied for consistency and to handle the keyboard/SR case uniformly).
