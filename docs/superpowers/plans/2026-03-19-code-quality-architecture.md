# Code Quality & Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Consolidate the duplicate button system, fix a filename typo, extend the features/ pattern consistently to flashcards and dashboard, and add a UI barrel export.

**Architecture:** Tasks 1–4 touch disjoint files and can be executed in parallel. Task 5 (barrel export) depends on Task 1 completing first (IconButton must exist at its new path). All changes are pure refactors — no behaviour changes, no new features. Verification at each step is `npm run type-check` and `npm test`.

**Tech Stack:** React 19, TypeScript 5, Vite, clsx, React Router DOM v7, Zustand, Vitest

**Spec:** `docs/superpowers/specs/2026-03-19-code-quality-architecture-design.md`

---

## File Map

| File | Action | Task |
|------|--------|------|
| `src/components/ui/Button.tsx` | Modify | 1 |
| `src/components/ui/IconButton.tsx` | Create (moved from `buttons/`) | 1 |
| `src/components/ui/buttons/` | Delete atomically | 1 |
| `src/components/flashcards/FlashcardActionButton.tsx` | Modify import | 1 |
| `src/components/AppInitiazlier.tsx` | Rename → `AppInitializer.tsx` | 2 |
| `src/App.tsx` | Modify import | 2 |
| `src/mocks/mockFlashcardData.ts` | Create | 3 |
| `src/features/flashcards/useFlashcardNavigation.ts` | Create | 3 |
| `src/components/flashcards/FlashcardViewer.tsx` | Modify | 3 |
| `src/features/dashboard/useDashboard.ts` | Create | 4 |
| `src/pages/Dashboard.tsx` | Modify | 4 |
| `src/components/ui/index.ts` | Create | 5 |

---

## Task 1: Button System Consolidation

**Files:**
- Modify: `src/components/ui/Button.tsx`
- Create: `src/components/ui/IconButton.tsx`
- Delete: `src/components/ui/buttons/` (entire directory)
- Modify: `src/components/flashcards/FlashcardActionButton.tsx`

- [ ] **Step 1: Fix `Button.tsx`**

Replace the entire file content with:

```tsx
// src/components/ui/Button.tsx
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import clsx from "clsx";

type ButtonProps = {
  children: ReactNode;
  to?: string;
  iconRight?: ReactNode;
  iconLeft?: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "outline" | "white" | "danger";
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  type?: "button" | "submit";
  fullWidth?: boolean;
  block?: boolean;
  align?: "left" | "center" | "right";
  disabled?: boolean;
  onClick?: (e?: React.MouseEvent) => void;
};

export default function Button({
  children,
  to,
  iconRight,
  iconLeft,
  variant = "primary",
  className = "",
  size = "md",
  type = "button",
  fullWidth,
  block,
  align,
  disabled = false,
  onClick,
}: ButtonProps) {
  const base =
    "inline-flex items-center justify-center gap-2 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-200";

  const styles = {
    primary:
      "bg-gradient-to-r from-accent-600 to-accent-400 hover:from-accent-800 hover:to-accent-300 text-gray-800 shadow-lg hover:shadow-xl transform hover:-translate-y-1 shadow-md hover:shadow-lg border border-gold-400",
    secondary:
      "bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600 border border-slate-300 dark:border-slate-600",
    ghost:
      "text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300",
    outline:
      "border border-white text-white hover:text-white/80 hover:border-white/50",
    white:
      "bg-white text-primary-600 hover:bg-primary-50 shadow-lg hover:shadow-xl transform hover:-translate-y-1",
    danger:
      "bg-red-500 hover:bg-red-600 text-white dark:bg-red-600 dark:hover:bg-red-700",
  };

  const sizeStyles = {
    xs: "px-2 py-1 text-xs",
    sm: "px-4 py-2 text-sm rounded-md",
    md: "px-6 py-3 text-base rounded-lg",
    lg: "px-8 py-4 text-lg rounded-xl",
  };

  const layoutStyles = clsx({
    "w-full": fullWidth,
    block: block,
    "text-left": align === "left",
    "text-center": align === "center",
    "text-right": align === "right",
  });

  const classes = clsx(base, styles[variant], sizeStyles[size ?? "md"], layoutStyles, className);

  // Link variant: disabled → non-interactive span; enabled → Link with classes
  if (to) {
    if (disabled) {
      return (
        <span className={clsx(classes, "opacity-50 cursor-not-allowed")}>
          {iconLeft}
          {children}
          {iconRight}
        </span>
      );
    }
    return (
      <Link to={to} className={classes}>
        {iconLeft}
        {children}
        {iconRight}
      </Link>
    );
  }

  return (
    <button
      type={type}
      className={clsx(classes, disabled && "opacity-50 cursor-not-allowed")}
      disabled={disabled}
      onClick={onClick}
    >
      {iconLeft}
      {children}
      {iconRight}
    </button>
  );
}
```

- [ ] **Step 2: Create `src/components/ui/IconButton.tsx`**

```tsx
// src/components/ui/IconButton.tsx
import { forwardRef, type ReactNode, type MouseEvent } from "react";
import clsx from "clsx";

export interface IconButtonProps {
  icon: ReactNode;
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  "aria-label": string;
  className?: string;
  size?: "sm" | "md" | "lg";
  type?: "button" | "submit";
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  (
    {
      icon,
      onClick,
      disabled = false,
      "aria-label": ariaLabel,
      className = "",
      size = "md",
      type = "button",
    },
    ref
  ) => {
    const baseClasses =
      "inline-flex items-center justify-center rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2";

    const sizeClasses = {
      sm: "p-2 text-sm",
      md: "p-3 text-base",
      lg: "p-4 text-lg",
    };

    const styleClasses =
      "bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-800 border border-gray-300 hover:border-gray-400 shadow-sm hover:shadow-md";

    return (
      <button
        ref={ref}
        type={type}
        onClick={onClick}
        disabled={disabled}
        aria-label={ariaLabel}
        className={clsx(
          baseClasses,
          sizeClasses[size],
          styleClasses,
          disabled && "opacity-50 cursor-not-allowed",
          className
        )}
      >
        {icon}
      </button>
    );
  }
);

IconButton.displayName = "IconButton";
```

- [ ] **Step 3: Delete the `buttons/` directory atomically**

```bash
rm -rf src/components/ui/buttons
```

- [ ] **Step 4: Update `FlashcardActionButton.tsx` import**

In `src/components/flashcards/FlashcardActionButton.tsx`, change line 3:

```tsx
// Before
import { IconButton } from "@/components/ui/buttons";

// After
import { IconButton } from "@/components/ui/IconButton";
```

- [ ] **Step 5: Type-check**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 6: Commit**

The `rm -rf` in Step 3 removes files from disk but does not stage the deletions in git. Use `git rm -r` to stage the deletions explicitly before committing.

```bash
git rm -r src/components/ui/buttons/
git add src/components/ui/Button.tsx src/components/ui/IconButton.tsx src/components/flashcards/FlashcardActionButton.tsx
git commit -m "refactor: consolidate button system, fix Link/iconLeft bugs"
```

---

## Task 2: AppInitializer Typo Fix

**Files:**
- Rename: `src/components/AppInitiazlier.tsx` → `src/components/AppInitializer.tsx`
- Modify: `src/App.tsx` line 4

- [ ] **Step 1: Rename the file**

```bash
git mv src/components/AppInitiazlier.tsx src/components/AppInitializer.tsx
```

- [ ] **Step 2: Update the import in `src/App.tsx`**

Change line 4:

```tsx
// Before
import AppInitializer from "./components/AppInitiazlier";

// After
import AppInitializer from "./components/AppInitializer";
```

- [ ] **Step 3: Type-check**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/AppInitializer.tsx src/App.tsx
git commit -m "fix: correct AppInitializer filename typo"
```

---

## Task 3: Flashcard Feature Pattern

**Files:**
- Create: `src/mocks/mockFlashcardData.ts`
- Create: `src/features/flashcards/useFlashcardNavigation.ts`
- Modify: `src/components/flashcards/FlashcardViewer.tsx`

- [ ] **Step 1: Create `src/mocks/mockFlashcardData.ts`**

Move the 9 mock card objects out of `FlashcardViewer.tsx`:

```ts
// src/mocks/mockFlashcardData.ts
import type { Flashcard } from "@/types/flashcard";

export const mockFlashcards: Flashcard[] = [
  {
    id: "1",
    nativeWord: "สวัสดี",
    englishWord: "Hello",
    partOfSpeech: "interjection",
    level: "basic",
    exampleSentence: "สวัสดีครับ - Hello (polite form)",
    imageUrl: "/images/hello.jpg",
  },
  {
    id: "2",
    nativeWord: "น้ำ",
    englishWord: "Water",
    partOfSpeech: "noun",
    level: "basic",
    exampleSentence: "ฉันดื่มน้ำ - I drink water",
  },
  {
    id: "3",
    nativeWord: "อาหาร",
    englishWord: "Food",
    partOfSpeech: "noun",
    level: "basic",
    exampleSentence: "อาหารอร่อย - The food is delicious",
  },
  {
    id: "4",
    nativeWord: "การศึกษา",
    englishWord: "Education",
    partOfSpeech: "noun",
    level: "intermediate",
    exampleSentence: "การศึกษาสำคัญมาก - Education is very important",
  },
  {
    id: "5",
    nativeWord: "ประสบการณ์",
    englishWord: "Experience",
    partOfSpeech: "noun",
    level: "intermediate",
    exampleSentence: "เขามีประสบการณ์มาก - He has a lot of experience",
  },
  {
    id: "6",
    nativeWord: "โอกาส",
    englishWord: "Opportunity",
    partOfSpeech: "noun",
    level: "intermediate",
    exampleSentence: "นี่เป็นโอกาสดี - This is a good opportunity",
  },
  {
    id: "7",
    nativeWord: "ความรับผิดชอบ",
    englishWord: "Responsibility",
    partOfSpeech: "noun",
    level: "advanced",
    exampleSentence: "เขามีความรับผิดชอบสูง - He has high responsibility",
  },
  {
    id: "8",
    nativeWord: "การพัฒนา",
    englishWord: "Development",
    partOfSpeech: "noun",
    level: "advanced",
    exampleSentence: "การพัฒนาเทคโนโลยี - Technology development",
  },
  {
    id: "9",
    nativeWord: "ความเข้าใจ",
    englishWord: "Understanding",
    partOfSpeech: "noun",
    level: "advanced",
    exampleSentence: "ความเข้าใจที่ลึกซึ้ง - Deep understanding",
  },
];
```

- [ ] **Step 2: Create `src/features/flashcards/useFlashcardNavigation.ts`**

> **Note on reset strategy:** The hook resets on `cardCount` changes. This is equivalent to resetting on difficulty filter changes as long as each filter produces a distinct card count (which holds for the current mock data: 3 basic, 3 intermediate, 3 advanced, 9 total). If two difficulty levels ever have the same count the reset would silently fail to fire — this is an acceptable tradeoff given the hook's `cardCount` interface.

```ts
// src/features/flashcards/useFlashcardNavigation.ts
import { useState, useEffect, useCallback } from "react";

export function useFlashcardNavigation(cardCount: number) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // Reset to 0 whenever cardCount changes (i.e. difficulty filter changes)
  useEffect(() => {
    setCurrentCardIndex(0);
  }, [cardCount]);

  const goToPrevious = useCallback(() => {
    if (cardCount === 0) return;
    setCurrentCardIndex((prev) => (prev === 0 ? cardCount - 1 : prev - 1));
  }, [cardCount]);

  const goToNext = useCallback(() => {
    if (cardCount === 0) return;
    setCurrentCardIndex((prev) => (prev === cardCount - 1 ? 0 : prev + 1));
  }, [cardCount]);

  // Keyboard navigation — stable deps via useCallback above
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrevious();
      else if (e.key === "ArrowRight") goToNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPrevious, goToNext]);

  // Clamp index: safe when cardCount drops to 0 or below current index
  const safeIndex = cardCount === 0 ? 0 : Math.min(currentCardIndex, cardCount - 1);

  return { currentCardIndex: safeIndex, setCurrentCardIndex, goToPrevious, goToNext };
}
```

- [ ] **Step 3: Rewrite `src/components/flashcards/FlashcardViewer.tsx`**

```tsx
// src/components/flashcards/FlashcardViewer.tsx
import { Flashcard as FlashcardData } from "@/types/flashcard";
import { Flashcard } from "./Flashcard";
import Button from "@/components/ui/Button";
import { mockFlashcards } from "@/mocks/mockFlashcardData";
import { useFlashcardNavigation } from "@/features/flashcards/useFlashcardNavigation";

type DifficultyLevel = "basic" | "intermediate" | "advanced";

interface FlashcardViewerProps {
  selectedDifficulty: DifficultyLevel | null;
}

export function FlashcardViewer({ selectedDifficulty }: FlashcardViewerProps) {
  const filteredCards: FlashcardData[] = selectedDifficulty
    ? mockFlashcards.filter((card) => card.level === selectedDifficulty)
    : mockFlashcards;

  const { currentCardIndex, setCurrentCardIndex, goToPrevious, goToNext } =
    useFlashcardNavigation(filteredCards.length);

  if (filteredCards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="text-center">
          <h3 className="text-xl font-semibold text-primary-700 mb-2">
            No flashcards available
          </h3>
          <p className="text-primary-600">
            {selectedDifficulty
              ? `No cards found for ${selectedDifficulty} level`
              : "No flashcards to display"}
          </p>
        </div>
      </div>
    );
  }

  const currentCard = filteredCards[currentCardIndex];

  return (
    <div className="flex flex-col items-center space-y-6 py-8">
      <div className="text-sm text-primary-600 font-medium">
        Card {currentCardIndex + 1} of {filteredCards.length}
        {selectedDifficulty && (
          <span className="ml-2 px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs capitalize">
            {selectedDifficulty}
          </span>
        )}
      </div>

      <div className="flex justify-center">
        <Flashcard data={currentCard} />
      </div>

      <div className="flex items-center space-x-4">
        <Button variant="secondary" size="sm" onClick={goToPrevious} className="px-4 py-2">
          ← Previous
        </Button>

        <div className="flex space-x-1">
          {filteredCards.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentCardIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentCardIndex
                  ? "bg-primary-500"
                  : "bg-primary-200 hover:bg-primary-300"
              }`}
              aria-label={`Go to card ${index + 1}`}
            />
          ))}
        </div>

        <Button variant="secondary" size="sm" onClick={goToNext} className="px-4 py-2">
          Next →
        </Button>
      </div>

      <p className="text-xs text-primary-500 text-center">
        Use ← → arrow keys to navigate
      </p>
    </div>
  );
}
```

- [ ] **Step 4: Type-check**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/mocks/mockFlashcardData.ts src/features/flashcards/useFlashcardNavigation.ts src/components/flashcards/FlashcardViewer.tsx
git commit -m "refactor: extract flashcard mock data and navigation hook"
```

---

## Task 4: Dashboard Feature Pattern

**Files:**
- Create: `src/features/dashboard/useDashboard.ts`
- Modify: `src/pages/Dashboard.tsx`

- [ ] **Step 1: Create `src/features/dashboard/useDashboard.ts`**

```ts
// src/features/dashboard/useDashboard.ts
import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "@/stores/useUserStore";
import { logoutUser } from "@/features/auth/logoutUser";
import { toast } from "sonner";

export function useDashboard() {
  const { profile, loading, clearProfile } = useUserStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !profile) {
      navigate("/login");
    }
  }, [loading, profile, navigate]);

  const handleLogout = useCallback(async () => {
    const error = await logoutUser();
    if (!error) {
      clearProfile();
      toast.success("Logged out");
      navigate("/login");
    }
  }, [clearProfile, navigate]);

  return { handleLogout, loading, profile };
}
```

- [ ] **Step 2: Simplify `src/pages/Dashboard.tsx`**

```tsx
// src/pages/Dashboard.tsx
import { mockDashboardData, getXPProgressColor, getDifficultyColor } from "@/mocks/mockDashboardData";
import { useDashboard } from "@/features/dashboard/useDashboard";

import WelcomePanel from "@/components/dashboard/WelcomePanel";
import XPProgress from "@/components/dashboard/XPProgress";
import FlashcardGroups from "@/components/dashboard/FlashcardGroups";
import StudyStats from "@/components/dashboard/StudyStats";
import LogoutButton from "@/components/dashboard/LogoutButton";

export default function Dashboard() {
  const { handleLogout, loading, profile } = useDashboard();

  const { xp, flashcardGroups, studyStats } = mockDashboardData;
  const progressColorClass = getXPProgressColor(xp.progressPercentage);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-base-dark flex items-center justify-center">
        <div className="text-xl text-text-light dark:text-text-dark">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-base-dark">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <WelcomePanel profile={profile} xp={xp} studyStats={studyStats} />
        <XPProgress xp={xp} progressColorClass={progressColorClass} />
        <FlashcardGroups flashcardGroups={flashcardGroups} getDifficultyColor={getDifficultyColor} />
        <StudyStats studyStats={studyStats} />
      </div>
      <LogoutButton onLogout={handleLogout} />
    </div>
  );
}
```

- [ ] **Step 3: Type-check**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/features/dashboard/useDashboard.ts src/pages/Dashboard.tsx
git commit -m "refactor: extract dashboard business logic into useDashboard hook"
```

---

## Task 5: UI Barrel Export

**Files:**
- Create: `src/components/ui/index.ts`

> **Dependency:** Run this task only after Task 1 is complete. `src/components/ui/IconButton.tsx` must exist before this barrel can export it. Tasks 1–4 can run in parallel; Task 5 is sequential after Task 1.

- [ ] **Step 1: Create `src/components/ui/index.ts`**

```ts
// src/components/ui/index.ts
export { default as Button } from "./Button";
export { IconButton } from "./IconButton";
export { default as FormInput } from "./FormInput";
export { default as NavLink } from "./NavLink";
export { default as UserMenu } from "./UserMenu";
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 3: Run tests**

```bash
npm test
```

Expected: all existing tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/index.ts
git commit -m "feat: add UI component barrel export"
```

---

## Final Verification

- [ ] **Full build**

```bash
npm run build
```

Expected: clean build with no type errors or warnings about missing modules.

- [ ] **Lint**

```bash
npm run lint
```

Expected: no new lint errors introduced.
