# Code Quality & Architecture Improvements — Design Spec

**Date:** 2026-03-19
**Scope:** Architecture consistency and code quality improvements to the existing codebase. No new features.

---

## 1. Button System Consolidation

### Problem
Two parallel button systems exist:
- `src/components/ui/Button.tsx` — full-featured, variant-based (`primary`, `secondary`, `ghost`, `outline`, `white`, `danger`), supports `Link` rendering, sizes, icons
- `src/components/ui/buttons/` — `PrimaryButton`, `SecondaryButton`, `TextButton`, `IconButton` — redundant wrappers with hardcoded styles that duplicate what `Button.tsx` already handles

The subdirectory components are only consumed by `FlashcardActionButton`. The two systems have diverged in style details (different padding, shadow values) creating inconsistency.

Additionally, `Button.tsx` has a Link rendering bug: when `to` is provided, it wraps children in a `<span className={classes}>` inside a bare `<Link>`. The `Link` element receives no styles. Classes must be applied directly to the `Link`.

### Changes
- **Delete** `src/components/ui/buttons/PrimaryButton.tsx`, `SecondaryButton.tsx`, `TextButton.tsx`
- **Move** `IconButton` to `src/components/ui/IconButton.tsx` — it earns standalone status due to its distinct API (icon-only, required `aria-label`, size prop, no children)
- **Delete** `src/components/ui/buttons/` directory atomically (includes `index.ts` barrel and any `README.md` inside — do not delete files individually, remove the whole directory)
- **Fix** `Button.tsx` `iconLeft` prop: destructure it from props and render it before `children`.
- **Fix** `Button.tsx` Link rendering — two decisions:
  1. When `disabled && to`: render a non-interactive `<span>` with the same computed classes instead of a `<Link>`. This completely removes navigation behaviour without relying on JS interception.
  2. When `to` without `disabled`: apply `classes` directly to the `<Link>` element (remove the inner `<span>` wrapper). The `<Link>` element has no native `disabled` prop, so the visual disabled state is handled by case 1 above.
- **Update** `FlashcardActionButton` import: `@/components/ui/buttons` → `@/components/ui/IconButton`

### Outcome
One button primitive (`Button.tsx`) + one specialised icon-only button (`IconButton.tsx`). No diverged styles. Link variant renders correctly.

---

## 2. Filename Typo Fix

### Problem
`src/components/AppInitiazlier.tsx` — the filename is misspelled. The internal comment and exported function name are already correct (`AppInitializer`), so only the file needs renaming.

### Changes
- **Rename** `AppInitiazlier.tsx` → `AppInitializer.tsx`
- **Update** the single import in `src/App.tsx`

---

## 3. Feature Pattern Extension

### Problem
`features/auth/` establishes a clear pattern: business logic (hooks, services, constants, utils) lives separate from components. This pattern is not applied to flashcards or dashboard.

Currently:
- `FlashcardViewer.tsx` contains 9 hardcoded mock card objects and the full navigation + keyboard logic inline
- `Dashboard.tsx` contains the logout handler and auth-redirect side-effect inline

### Changes

#### Flashcards
- **Create** `src/mocks/mockFlashcardData.ts` — move the 9 mock `Flashcard` objects out of `FlashcardViewer.tsx` (consistent with `src/mocks/mockDashboardData.ts`)
- **Create** `src/features/flashcards/useFlashcardNavigation.ts` — extracts:
  - `currentCardIndex` state
  - `goToPrevious` / `goToNext` handlers — wrapped in `useCallback` with `cardCount` (the filtered array length) as a dependency, so the keyboard `useEffect` can safely list them without stale closures
  - `useEffect` keyboard listener (ArrowLeft / ArrowRight) — depends on `[goToPrevious, goToNext]`
  - `useEffect` to reset index when `cardCount` changes
  - Accepts `cardCount: number` as a parameter; returns `{ currentCardIndex, setCurrentCardIndex, goToPrevious, goToNext }`
  - **Edge case safeguard:** when `cardCount === 0`, `currentCardIndex` must be clamped to 0. The consumer (`FlashcardViewer`) is responsible for not rendering navigation when `filteredCards.length === 0`, but the hook itself must not return an index that exceeds `cardCount - 1`. Apply `Math.min(currentCardIndex, Math.max(0, cardCount - 1))` when returning the index, or reset to 0 inside the `cardCount` reset effect.
- **Simplify** `FlashcardViewer.tsx` — calls `useFlashcardNavigation`, imports mock data externally

#### Dashboard
- **Create** `src/features/dashboard/useDashboard.ts` — extracts:
  - `handleLogout` (calls `logoutUser`, clears profile, toasts, navigates)
  - Auth-redirect `useEffect` (navigates to `/login` if no profile after load)
  - Returns `{ handleLogout, loading, profile }`
- **Simplify** `Dashboard.tsx` — calls `useDashboard()`, renders with returned values

### Outcome
All three feature areas (auth, flashcards, dashboard) follow the same pattern: business logic in `features/`, display logic in `components/` and `pages/`.

---

## 4. UI Component Barrel Export

### Problem
Consumers import each UI component by full path (`@/components/ui/Button`, `@/components/ui/FormInput`, etc.). There is no index file, making imports verbose and requiring knowledge of the exact file layout.

### Changes
- **Create** `src/components/ui/index.ts` exporting: `Button`, `IconButton`, `FormInput`, `NavLink`, `UserMenu`
- Existing imports are not changed — the barrel is additive only

### Outcome
Future code can import from `@/components/ui` directly. Existing consumers continue to work unchanged.

---

## Execution Order

1. Fix `Button.tsx` Link bug
2. Move `IconButton` to `src/components/ui/IconButton.tsx`
3. Delete `buttons/` subdirectory; update `FlashcardActionButton` import
4. Rename `AppInitiazlier.tsx` → `AppInitializer.tsx`; update `App.tsx` import
5. Create `src/mocks/mockFlashcardData.ts`; create `src/features/flashcards/useFlashcardNavigation.ts`; update `FlashcardViewer.tsx`
6. Create `src/features/dashboard/useDashboard.ts`; update `Dashboard.tsx`
7. Create `src/components/ui/index.ts`

---

## Out of Scope
- No new features
- No changes to backend
- No test additions
- No styling changes
- Existing consumers of UI components are not migrated to barrel imports (additive only)
