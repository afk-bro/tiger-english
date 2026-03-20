# Visual System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a consistent visual design system across all pages — typography, spacing, color roles, card classes, micro-interactions, and a gradient accent line signature element.

**Architecture:** All design tokens go in `tailwind.config.js`. All CSS variables go in `src/index.css` (`@layer base`). All component utility classes (`.card`, `.text-display`, `.heading-accent`, etc.) go in `@layer components` in `src/index.css`. Pages and components are then updated to use these classes.

**Spec:** `docs/superpowers/specs/2026-03-20-visual-system-design.md`

**Tech Stack:** React 19, TypeScript, Tailwind CSS, CSS custom properties

---

## File Map

| File | Change |
|------|--------|
| `tailwind.config.js` | Remove Poppins `body` key; add `muted`/`subtle` to `semantic` |
| `index.html` | Remove Poppins Google Fonts link |
| `src/index.css` | Add `--color-muted`/`--color-subtle` CSS vars; add all `@layer components` utilities |
| `src/components/ui/Button.tsx` | Add `active:scale-95`, `focus-visible` ring; update primary to blue, secondary hover |
| `src/components/ui/NavLink.tsx` | Replace background-pill active state with text-only; add `focus-visible` ring |
| `src/components/home/HeroSection.tsx` | Container, spacing, typography, `.heading-accent-wide` |
| `src/components/home/FeaturesSection.tsx` | Container, `.card`, section heading |
| `src/components/home/FinalCtaSection.tsx` | Spacing update |
| `src/pages/FlashcardsPage.tsx` | Container width |
| `src/features/flashcards/components/FlashcardSetList.tsx` | `.card.card-interactive`, `.heading-accent` |
| `src/features/flashcards/components/FlashcardViewer.tsx` | `.card.card-lg` wrapper |
| `src/features/flashcards/components/CreateSetModal.tsx` | `.card.card-lg` on dialog element |
| `src/pages/Dashboard.tsx` | Container width |
| `src/pages/Login.tsx` | Background, `.card.card-lg` on form |
| `src/pages/Register.tsx` | Background, `.card.card-lg` on form |
| `src/pages/About.tsx` | Container, `.card.card-lg`, `.heading-accent` |
| `src/pages/Contact.tsx` | Container, `.card.card-lg`, `.heading-accent` |

**Note on testing:** These are styling-only changes with no behavioural logic changes. The test strategy is regression-only: run `npm test` before each task to confirm the baseline, and after to confirm nothing broke. No new unit tests are required for CSS class changes.

---

## Task 1: Foundation — Tokens, CSS Variables, Utility Classes

**Files:**
- Modify: `tailwind.config.js`
- Modify: `index.html`
- Modify: `src/index.css`

- [ ] **Step 1: Confirm test baseline**

```bash
npm test -- src/features/flashcards
```
Expected: 55 tests pass. (The Register test has a pre-existing failure unrelated to this work — ignore it.)

- [ ] **Step 2: Update `tailwind.config.js`**

Remove the `body` key from `fontFamily`:
```js
// BEFORE
fontFamily: {
  sans: ['Inter', 'ui-sans-serif', 'system-ui'],
  mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular'],
  display: ['"DM Serif Display"', 'serif'],
  body: ['"Poppins"', 'sans-serif'],  // ← remove this line
},

// AFTER
fontFamily: {
  sans: ['Inter', 'ui-sans-serif', 'system-ui'],
  mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular'],
  display: ['"DM Serif Display"', 'serif'],
},
```

Add `muted` and `subtle` to the `semantic` object (after the `border` entry):
```js
semantic: {
  primary:       'rgb(var(--color-primary) / <alpha-value>)',
  secondary:     'rgb(var(--color-secondary) / <alpha-value>)',
  accent:        'rgb(var(--color-accent) / <alpha-value>)',
  success:       'rgb(var(--color-success) / <alpha-value>)',
  warning:       'rgb(var(--color-warning) / <alpha-value>)',
  error:         'rgb(var(--color-error) / <alpha-value>)',
  bg:            'rgb(var(--color-bg) / <alpha-value>)',
  surface:       'rgb(var(--color-surface) / <alpha-value>)',
  'surface-2':   'rgb(var(--color-surface-2) / <alpha-value>)',
  text:          'rgb(var(--color-text) / <alpha-value>)',
  'text-muted':  'rgb(var(--color-text-muted) / <alpha-value>)',
  border:        'rgb(var(--color-border) / <alpha-value>)',
  muted:         'rgb(var(--color-muted) / <alpha-value>)',   // ← add
  subtle:        'rgb(var(--color-subtle) / <alpha-value>)',  // ← add
},
```

- [ ] **Step 3: Remove Poppins from `index.html`**

```html
<!-- BEFORE — two separate font links: -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=JetBrains+Mono&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=Poppins:wght@400;600&display=swap" rel="stylesheet">

<!-- AFTER — remove Poppins from the second link: -->
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=JetBrains+Mono&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&display=swap" rel="stylesheet">
```

- [ ] **Step 4: Add CSS variables to `src/index.css`**

Inside the existing `@layer base` block, add `--color-muted` and `--color-subtle` to both `:root` and `.dark`:

```css
@layer base {
  :root {
    --color-primary:    50 109 226;
    --color-secondary:  100 116 139;
    --color-accent:     252 211 77;
    --color-success:    16 185 129;
    --color-warning:    245 158 11;
    --color-error:      239 68 68;
    --color-bg:         254 254 254;
    --color-surface:    248 250 252;
    --color-surface-2:  241 245 249;
    --color-text:       31 41 55;
    --color-text-muted: 107 114 128;
    --color-border:     226 232 240;
    --color-muted:      100 116 139;   /* #64748B — secondary labels, placeholder text */
    --color-subtle:     148 163 184;   /* #94A3B8 — tertiary, timestamps, disabled */
  }

  .dark {
    --color-primary:    90 138 233;
    --color-secondary:  148 163 184;
    --color-accent:     252 211 77;
    --color-success:    52 211 153;
    --color-warning:    251 191 36;
    --color-error:      248 113 113;
    --color-bg:         17 24 39;
    --color-surface:    30 41 59;
    --color-surface-2:  51 65 85;
    --color-text:       243 244 246;
    --color-text-muted: 156 163 175;
    --color-border:     51 65 85;
    --color-muted:      148 163 184;   /* inverted in dark mode */
    --color-subtle:     100 116 139;
  }
}
```

- [ ] **Step 5: Add `@layer components` to `src/index.css`**

Append this block after the existing `@layer utilities` block:

```css
@layer components {
  /* ── Typography ─────────────────────────────────────────────────────────── */

  .text-display {
    @apply text-2xl md:text-3xl font-semibold tracking-tight;
  }

  /* ── Cards ──────────────────────────────────────────────────────────────── */

  /* Base card — light mode uses bg-white intentionally for max contrast */
  .card {
    @apply bg-white dark:bg-semantic-surface;
    @apply rounded-2xl border border-semantic-border;
    @apply p-4 md:p-5;
    @apply shadow-sm;
    @apply transition-all duration-200 ease-out;
  }

  /* Add to a .card only when the ENTIRE card is a clickable target */
  .card-interactive {
    @apply hover:-translate-y-0.5 hover:shadow-md cursor-pointer;
    @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/40;
  }

  /* Featured card — stronger border, 2px top accent stripe */
  .card-featured {
    @apply border-primary-200 dark:border-primary-800 shadow-md;
    position: relative;
    overflow: hidden;
  }
  .card-featured::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 2px;
    background: linear-gradient(to right, #326de2, #fcd34d);
  }
  /* 0.5rem top breathing room below the 2px strip — intentional, not pixel-exact */
  .card-featured > :first-child {
    margin-top: 0.5rem;
  }

  /* Large card — for modals and major feature panels */
  .card-lg {
    @apply p-6 md:p-7;
  }

  /* Ghost card — low-emphasis inner grouping; never nest inside .card-featured */
  .card-ghost {
    background-color: rgb(var(--color-surface) / 0.5);
    border: 1px solid rgb(var(--color-border) / 0.5);
    @apply shadow-none rounded-xl;
  }

  /* ── Signature element ──────────────────────────────────────────────────── */

  /* Section headings — short editorial accent line (default) */
  .heading-accent {
    @apply relative inline-block pb-2;
  }
  .heading-accent::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    height: 2px;
    width: 3rem;
    border-radius: 9999px;
    background: linear-gradient(to right, #326de2, #fcd34d);
  }

  /* Hero / marquee moments only — full-width accent line */
  .heading-accent-wide {
    @apply relative inline-block pb-2;
  }
  .heading-accent-wide::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 0;
    height: 2px;
    width: 100%;
    border-radius: 9999px;
    background: linear-gradient(to right, #326de2, #fcd34d);
  }

  /* ── Transitions ────────────────────────────────────────────────────────── */

  .transition-base {
    @apply transition-all duration-200 ease-out;
  }
}
```

- [ ] **Step 6: Verify tests still pass**

```bash
npm test -- src/features/flashcards
```
Expected: 55 tests pass (same as baseline).

- [ ] **Step 7: Commit**

```bash
git add tailwind.config.js index.html src/index.css
git commit -m "feat: add visual system tokens, CSS variables, and utility classes"
```

---

## Task 2: Shared UI — Button and NavLink

**Files:**
- Modify: `src/components/ui/Button.tsx`
- Modify: `src/components/ui/NavLink.tsx`

- [ ] **Step 1: Confirm test baseline**

```bash
npm test -- src/features/flashcards
```
Expected: 55 pass.

- [ ] **Step 2: Update `src/components/ui/Button.tsx`**

Replace the entire file:

```tsx
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
    "inline-flex items-center justify-center gap-2 font-semibold rounded-xl " +
    "transition-all duration-200 ease-out " +
    "active:scale-95 " +
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/40";

  const styles = {
    primary:
      "bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white shadow-sm hover:shadow-md",
    secondary:
      "bg-white hover:bg-semantic-surface-2 text-semantic-text dark:bg-semantic-surface dark:hover:bg-semantic-surface-2 dark:text-semantic-text border border-semantic-border",
    ghost:
      "text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300",
    outline:
      "border border-white text-white hover:text-white/80 hover:border-white/50",
    white:
      "bg-white text-primary-600 hover:bg-primary-50 shadow-sm hover:shadow-md",
    danger:
      "bg-red-500 hover:bg-red-600 text-white dark:bg-red-600 dark:hover:bg-red-700",
  };

  const sizeStyles = {
    xs: "px-2 py-1 text-xs rounded-md",
    sm: "px-4 py-2 text-sm rounded-lg",
    md: "px-6 py-3 text-base rounded-xl",
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

Key changes from current:
- Base gains `active:scale-95` and `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/40`
- `primary` variant: gold gradient → `bg-primary-500 hover:bg-primary-600 active:bg-primary-700 text-white`
- `secondary` variant: `hover:bg-slate-200` → `hover:bg-semantic-surface-2`, uses semantic tokens
- `white` variant: removes `transform hover:-translate-y-1` (handled by card-interactive if needed)
- Size styles: each size now sets its own `rounded-*` to avoid the base `rounded-xl` being overridden

- [ ] **Step 3: Update `src/components/ui/NavLink.tsx`**

Replace the entire file:

```tsx
import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import clsx from "clsx";

interface NavLinkProps {
  to: string;
  children: ReactNode;
  icon?: ReactNode;
  exact?: boolean;
}

export default function NavLink({ to, children, icon, exact = false }: NavLinkProps) {
  const { pathname } = useLocation();
  const isActive = exact ? pathname === to : pathname.startsWith(to);

  return (
    <RouterNavLink
      to={to}
      className={clsx(
        "flex items-center gap-2 px-3 py-2 text-sm transition-all duration-200 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/40 rounded-lg",
        isActive
          ? "text-primary-600 dark:text-primary-400 font-medium"
          : "text-semantic-muted hover:text-primary-500 dark:text-semantic-muted dark:hover:text-primary-400"
      )}
    >
      {icon}
      {children}
    </RouterNavLink>
  );
}
```

Key changes:
- Active state: no background pill → `text-primary-600 font-medium` only
- Inactive: `text-semantic-muted hover:text-primary-500`
- `focus-visible` ring added; `rounded-lg` kept only for the focus ring to look good
- No hover background fill

- [ ] **Step 4: Verify tests still pass**

```bash
npm test -- src/features/flashcards
```
Expected: 55 pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/Button.tsx src/components/ui/NavLink.tsx
git commit -m "feat: apply visual system to Button and NavLink components"
```

---

## Task 3: Home Page Sections

**Files:**
- Modify: `src/components/home/HeroSection.tsx`
- Modify: `src/components/home/FeaturesSection.tsx`
- Modify: `src/components/home/FinalCtaSection.tsx`

- [ ] **Step 1: Confirm test baseline**

```bash
npm test -- src/features/flashcards
```
Expected: 55 pass.

- [ ] **Step 2: Update `src/components/home/HeroSection.tsx`**

Replace with:

```tsx
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "../ui/Button";

export default function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-primary-900/20 dark:via-semantic-bg dark:to-accent-900/20" />
      <div className="relative py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-4 py-2 rounded-full text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              {t("hero.badge")}
            </div>
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl leading-[1.1] md:leading-tight tracking-[-0.01em] text-semantic-text dark:text-semantic-text heading-accent-wide">
              {t("hero.title")}
            </h1>
            <p className="text-sm md:text-base leading-relaxed text-semantic-text-muted dark:text-semantic-text-muted">
              {t("hero.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <Button to="/register" variant="primary" iconRight={<ArrowRight />}>
                {t("hero.cta")}
              </Button>
              <Link
                to="/about"
                className="text-primary-600 dark:text-primary-400 hover:underline text-sm md:text-base py-2 transition-colors duration-200"
              >
                {t("hero.learn_more")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

Key changes:
- Left-aligned content (remove `text-center`)
- `max-w-6xl mx-auto px-4 md:px-6` container
- `max-w-2xl space-y-6` inner text block
- `py-16 md:py-20` section padding
- Heading: DM Serif, type scale, `heading-accent-wide`, remove gradient text
- Subtitle: body text size, `text-semantic-text-muted`
- CTA aligned left; "Learn More" is a plain text link

- [ ] **Step 3: Update `src/components/home/FeaturesSection.tsx`**

Replace with:

```tsx
import { useTranslation } from 'react-i18next';
import { BookOpenCheck, UserCheck, Brain } from 'lucide-react';

export default function FeaturesSection() {
  const { t } = useTranslation();

  return (
    <section className="py-12 md:py-16 bg-semantic-surface dark:bg-semantic-surface">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="mb-10">
          <h2 className="text-display heading-accent">
            {t('features.heading')}
          </h2>
          <p className="text-sm md:text-base leading-relaxed text-semantic-muted dark:text-semantic-muted mt-4 max-w-2xl">
            {t('features.subheading')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          {/* Flashcards — `group` on the card enables the icon halo on card hover */}
          <div className="card space-y-4 group">
            <div className="w-14 h-14 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-800 dark:to-primary-700 rounded-2xl flex items-center justify-center transition-all duration-200 group-hover:shadow-[0_0_12px_rgba(252,211,77,0.2)]">
              <BookOpenCheck className="w-7 h-7 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-base md:text-lg font-semibold text-semantic-text dark:text-semantic-text">
              {t('features.cards.flashcards.title')}
            </h3>
            <p className="text-sm md:text-base leading-relaxed text-semantic-muted dark:text-semantic-muted">
              {t('features.cards.flashcards.desc')}
            </p>
          </div>

          {/* Tutoring */}
          <div className="card space-y-4">
            <div className="w-14 h-14 bg-gradient-to-br from-accent-100 to-accent-200 dark:from-accent-800 dark:to-accent-700 rounded-2xl flex items-center justify-center">
              <UserCheck className="w-7 h-7 text-accent-600 dark:text-accent-400" />
            </div>
            <h3 className="text-base md:text-lg font-semibold text-semantic-text dark:text-semantic-text">
              {t('features.cards.tutoring.title')}
            </h3>
            <p className="text-sm md:text-base leading-relaxed text-semantic-muted dark:text-semantic-muted">
              {t('features.cards.tutoring.desc')}
            </p>
          </div>

          {/* AI Learning */}
          <div className="card space-y-4">
            <div className="w-14 h-14 bg-gradient-to-br from-success-100 to-success-200 dark:from-success-800 dark:to-success-700 rounded-2xl flex items-center justify-center">
              <Brain className="w-7 h-7 text-success-600 dark:text-success-400" />
            </div>
            <h3 className="text-base md:text-lg font-semibold text-semantic-text dark:text-semantic-text">
              {t('features.cards.ai.title')}
            </h3>
            <p className="text-sm md:text-base leading-relaxed text-semantic-muted dark:text-semantic-muted">
              {t('features.cards.ai.desc')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
```

Key changes:
- `py-12 md:py-16`, `max-w-6xl mx-auto px-4 md:px-6`
- Section heading uses `.text-display .heading-accent`; left-aligned
- Feature cards use `.card` (not `.card-interactive` — they're static display, not clickable)
- Removed `hover:-translate-y-2` and `hover:shadow-xl` from static cards
- Kept selective gold halo class on the primary feature icon (Flashcards) as the curated feature icon
- Typography uses body text scale and semantic colour tokens
- `space-y-4` for card-internal spacing

- [ ] **Step 4: Update `src/components/home/FinalCtaSection.tsx`**

Replace `py-24` with `py-12 md:py-16`:

```tsx
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "../ui/Button";

export default function FinalCtaSection() {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 dark:from-primary-400 dark:via-primary-600 dark:to-accent-700" />
      <div className="relative py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-display text-white">
              {t("cta.heading")}
            </h2>
            <p className="text-sm md:text-base leading-relaxed text-white/90">
              {t("cta.desc")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button to="/register" variant="white" iconRight={<ArrowRight />}>
                {t("cta.button")}
              </Button>
              <Button to="/contact" variant="outline" iconRight={<ArrowRight />}>
                {t("cta.contact")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

Note: the snippet above has the correct single `ArrowRight` import from `lucide-react`. The original file had an additional `{ Link }` import from `react-router-dom` — that is no longer needed since `Button to=` handles navigation internally.

- [ ] **Step 5: Verify tests pass**

```bash
npm test -- src/features/flashcards
```
Expected: 55 pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/home/HeroSection.tsx src/components/home/FeaturesSection.tsx src/components/home/FinalCtaSection.tsx
git commit -m "feat: apply visual system to home page sections"
```

---

## Task 4: Flashcard Feature Components

**Files:**
- Modify: `src/pages/FlashcardsPage.tsx`
- Modify: `src/features/flashcards/components/FlashcardSetList.tsx`
- Modify: `src/features/flashcards/components/FlashcardViewer.tsx`
- Modify: `src/features/flashcards/components/CreateSetModal.tsx`

- [ ] **Step 1: Confirm test baseline**

```bash
npm test -- src/features/flashcards
```
Expected: 55 pass.

- [ ] **Step 2: Update `src/pages/FlashcardsPage.tsx`**

Change `max-w-6xl` to `max-w-5xl`:

```tsx
// Change this line:
<div className="container mx-auto px-4 py-8 max-w-6xl">
// To:
<div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
```

- [ ] **Step 3: Update `src/features/flashcards/components/FlashcardSetList.tsx`**

Replace with:

```tsx
import type { FlashcardSet } from '../types';
import Button from '@/components/ui/Button';

interface FlashcardSetListProps {
  sets: FlashcardSet[];
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  onSelectSet: (setId: string) => void;
  onCreateSet: () => void;
}

export function FlashcardSetList({
  sets,
  loading,
  error,
  isAuthenticated,
  onSelectSet,
  onCreateSet,
}: FlashcardSetListProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-semantic-muted">Loading sets…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-semantic-error">Failed to load sets: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-display heading-accent">Flashcard Sets</h2>
        {isAuthenticated && (
          <Button variant="primary" size="sm" onClick={onCreateSet}>
            + Create set
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {sets.map((set) => (
          <button
            key={set.id}
            onClick={() => onSelectSet(set.id)}
            className="card card-interactive text-left space-y-3"
          >
            <h3 className="text-base md:text-lg font-semibold text-semantic-text dark:text-semantic-text">
              {set.title}
            </h3>
            {set.description && (
              <p className="text-sm leading-relaxed text-semantic-muted dark:text-semantic-muted">
                {set.description}
              </p>
            )}
            <p className="text-xs text-primary-600 dark:text-primary-400 font-medium">
              {set.cardCount} {set.cardCount === 1 ? 'card' : 'cards'}
            </p>
          </button>
        ))}
      </div>

      {sets.length === 0 && (
        <p className="text-center text-semantic-muted py-12">
          No sets available yet.
        </p>
      )}
    </div>
  );
}
```

Key changes:
- Heading: `.text-display .heading-accent`
- Set cards: `.card .card-interactive` (entire button IS the clickable target — correct usage)
- `space-y-3` for card-internal content
- Semantic text tokens

- [ ] **Step 4: Update `src/features/flashcards/components/FlashcardViewer.tsx`**

Wrap the non-empty return in a `.card .card-lg` container:

```tsx
import { Flashcard } from '@/components/flashcards/Flashcard';
import Button from '@/components/ui/Button';
import { useFlashcardNavigation } from '../useFlashcardNavigation';
import type { FlashcardCard, CardProgress } from '../types';

interface FlashcardViewerProps {
  setId: string;
  cards: FlashcardCard[];
  progressMap: Record<string, CardProgress>;
  onMarkKnown: (cardId: string) => void;
  onMarkUnknown: (cardId: string) => void;
  onBack: () => void;
  isAuthenticated: boolean;
}

export function FlashcardViewer({
  setId,
  cards,
  progressMap,
  onMarkKnown,
  onMarkUnknown,
  onBack,
  isAuthenticated,
}: FlashcardViewerProps) {
  const { currentCardIndex, setCurrentCardIndex, goToPrevious, goToNext } =
    useFlashcardNavigation(cards.length, setId);

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 space-y-4">
        <p className="text-semantic-muted">No cards in this set yet.</p>
        <Button variant="secondary" size="sm" onClick={onBack}>
          ← Back to sets
        </Button>
      </div>
    );
  }

  const currentCard = cards[currentCardIndex];
  const progress = progressMap[currentCard.id];

  const handleMarkKnown = () => {
    onMarkKnown(currentCard.id);
    goToNext();
  };

  const handleMarkUnknown = () => {
    onMarkUnknown(currentCard.id);
    goToNext();
  };

  return (
    <div className="card card-lg flex flex-col items-center space-y-6">
      <div className="flex items-center justify-between w-full">
        <Button variant="secondary" size="sm" onClick={onBack}>
          ← Back
        </Button>
        <div className="flex items-center gap-2 text-sm text-semantic-muted font-medium">
          Card {currentCardIndex + 1} of {cards.length}
          {progress && (
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              progress.status === 'known'
                ? 'bg-success-100 text-success-700 dark:bg-success-900/30 dark:text-success-300'
                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
            }`}>
              {progress.status}
            </span>
          )}
        </div>
      </div>

      <div className="flex justify-center w-full">
        <Flashcard data={currentCard} />
      </div>

      <div className="flex items-center gap-4">
        <Button variant="secondary" size="sm" onClick={goToPrevious}>
          ← Previous
        </Button>

        <div className="flex gap-1">
          {cards.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentCardIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/40 ${
                index === currentCardIndex
                  ? 'bg-primary-500'
                  : 'bg-primary-200 hover:bg-primary-300'
              }`}
              aria-label={`Go to card ${index + 1}`}
            />
          ))}
        </div>

        <Button variant="secondary" size="sm" onClick={goToNext}>
          Next →
        </Button>
      </div>

      {isAuthenticated && (
        <div className="flex gap-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleMarkUnknown}
            className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
          >
            Still learning
          </Button>
          <Button variant="primary" size="sm" onClick={handleMarkKnown}>
            I know this
          </Button>
        </div>
      )}

      <p className="text-xs text-semantic-muted text-center">
        Use ← → arrow keys to navigate
      </p>
    </div>
  );
}
```

Key change: outer div gains `card card-lg` (removes ad-hoc `py-8`, padding handled by `.card-lg`).

- [ ] **Step 5: Update `src/features/flashcards/components/CreateSetModal.tsx`**

Change the inner dialog div's class from the ad-hoc styles to `.card .card-lg`:

```tsx
// BEFORE
<div
  ref={dialogRef}
  role="dialog"
  aria-modal="true"
  aria-labelledby="create-set-modal-title"
  className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6"
>

// AFTER
<div
  ref={dialogRef}
  role="dialog"
  aria-modal="true"
  aria-labelledby="create-set-modal-title"
  className="card card-lg w-full max-w-md"
>
```

- [ ] **Step 6: Verify all flashcard tests pass**

```bash
npm test -- src/features/flashcards
```
Expected: 55 pass.

- [ ] **Step 7: Commit**

```bash
git add src/pages/FlashcardsPage.tsx \
        src/features/flashcards/components/FlashcardSetList.tsx \
        src/features/flashcards/components/FlashcardViewer.tsx \
        src/features/flashcards/components/CreateSetModal.tsx
git commit -m "feat: apply visual system to flashcard feature components"
```

---

## Task 5: Dashboard

**Files:**
- Modify: `src/pages/Dashboard.tsx`

- [ ] **Step 1: Confirm test baseline**

```bash
npm test -- src/features/flashcards
```
Expected: 55 pass.

- [ ] **Step 2: Update `src/pages/Dashboard.tsx`**

Change the container and background:

```tsx
// BEFORE loading state:
<div className="min-h-screen bg-slate-50 dark:bg-base-dark flex items-center justify-center">

// AFTER:
<div className="min-h-screen bg-semantic-bg dark:bg-semantic-bg flex items-center justify-center">
```

```tsx
// BEFORE outer wrapper:
<div className="min-h-screen bg-slate-50 dark:bg-base-dark">
  <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

// AFTER:
<div className="min-h-screen bg-semantic-bg dark:bg-semantic-bg">
  <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
```

Open each dashboard sub-component below and apply the changes described:

**`src/components/dashboard/WelcomePanel.tsx`**, **`XPProgress.tsx`**, **`FlashcardGroups.tsx`**, **`StudyStats.tsx`:**

In each file, find the outermost div that has any combination of `bg-white`, `rounded-*`, `shadow-*`, or `border border-gray-*` classes (these are the ad-hoc card styles). Replace those class combinations with `card`:

```tsx
// BEFORE — any variant of this pattern:
<div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6 ...">

// AFTER:
<div className="card">
```

If a sub-component has a section heading (e.g. "Study Stats", "Flashcard Groups") using `text-xl font-semibold` or similar, apply `.text-display .heading-accent` to it:

```tsx
// BEFORE:
<h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">Study Stats</h2>

// AFTER:
<h2 className="text-display heading-accent">Study Stats</h2>
```

**`src/components/dashboard/StudyStats.tsx` or `XPProgress.tsx` — highlighted stat icon:**
The spec calls for a selective gold halo on one highlighted stat icon. Find the icon in the stat that represents the most important metric (e.g. XP total or study streak). Add `hover:shadow-[0_0_12px_rgba(252,211,77,0.2)]` to that icon's wrapper div only:
```tsx
<div className="... transition-all duration-200 hover:shadow-[0_0_12px_rgba(252,211,77,0.2)]">
  <TrophyIcon ... />
</div>
```
Apply this to one icon only — not every stat icon.

**`src/components/dashboard/LogoutButton.tsx`** and any purely-structural layout wrappers: intentionally excluded — they are not content cards.

- [ ] **Step 3: Verify tests pass**

```bash
npm test -- src/features/flashcards
```
Expected: 55 pass.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Dashboard.tsx src/components/dashboard/
git commit -m "feat: apply visual system to dashboard"
```

---

## Task 6: Auth Pages — Login and Register

**Files:**
- Modify: `src/pages/Login.tsx`
- Modify: `src/pages/Register.tsx`

- [ ] **Step 1: Confirm test baseline**

```bash
npm test -- src/features/flashcards
```
Expected: 55 pass.

- [ ] **Step 2: Update `src/pages/Login.tsx`**

The spec calls for a `max-w-4xl` page container on auth pages. Add a container wrapper between the `<section>` and the form card. The section handles vertical centering; the container provides the horizontal constraint; the form card remains `max-w-md` centered within it:

```tsx
// BEFORE:
<section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50 dark:from-base-dark dark:to-primary-900/20 px-6 py-20">
  <div className="w-full max-w-md bg-white dark:bg-base-dark border border-primary-100 dark:border-primary-700/40 rounded-2xl shadow-md p-8 space-y-6">

// AFTER:
<section className="min-h-screen flex items-center justify-center bg-semantic-bg dark:bg-semantic-bg px-4 md:px-6 py-12 md:py-16">
  <div className="w-full max-w-4xl mx-auto flex justify-center">
    <div className="card card-lg w-full max-w-md space-y-6">
```

Close the extra wrapper div before `</section>`:
```tsx
    </div>  {/* end max-w-md card */}
  </div>    {/* end max-w-4xl container */}
</section>
```

- [ ] **Step 3: Update `src/pages/Register.tsx`**

Apply the same three-level structure as Login:

```tsx
// BEFORE:
<section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50 dark:from-base-dark dark:to-primary-900/20 px-6 py-20">
  <div className="w-full max-w-md bg-white dark:bg-base-dark border border-primary-100 dark:border-primary-700/40 rounded-2xl shadow-md p-8 space-y-6">

// AFTER:
<section className="min-h-screen flex items-center justify-center bg-semantic-bg dark:bg-semantic-bg px-4 md:px-6 py-12 md:py-16">
  <div className="w-full max-w-4xl mx-auto flex justify-center">
    <div className="card card-lg w-full max-w-md space-y-6">
```

Add closing divs before `</section>` in the same pattern as Login.

```tsx
// BEFORE form card:
<div className="w-full max-w-md bg-white dark:bg-base-dark border border-primary-100 dark:border-primary-700/40 rounded-2xl shadow-md p-8 space-y-6">

// AFTER:
<div className="card card-lg w-full max-w-md space-y-6">
```

- [ ] **Step 4: Verify tests pass**

```bash
npm test -- src/features/flashcards
```
Expected: 55 pass.

- [ ] **Step 5: Commit**

```bash
git add src/pages/Login.tsx src/pages/Register.tsx
git commit -m "feat: apply visual system to login and register pages"
```

---

## Task 7: Content Pages — About and Contact

**Files:**
- Modify: `src/pages/About.tsx`
- Modify: `src/pages/Contact.tsx`

- [ ] **Step 1: Confirm test baseline**

```bash
npm test -- src/features/flashcards
```
Expected: 55 pass.

- [ ] **Step 2: Update `src/pages/About.tsx`**

Apply these changes:

```tsx
// BEFORE outer wrapper:
<div className="max-w-4xl mx-auto px-6 py-12">

// AFTER:
<div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-16">
```

```tsx
// BEFORE article:
<article className="bg-white dark:bg-surface-dark shadow-lg rounded-2xl p-8 sm:p-10 border border-gray-100 dark:border-gray-700">

// AFTER:
<article className="card card-lg">
```

Replace section headings that use `text-2xl font-semibold text-primary-600 dark:text-primary-400` with `.text-display .heading-accent`:
```tsx
// BEFORE:
<h2 className="text-2xl font-semibold text-primary-600 dark:text-primary-400 mb-6">
  Skills & Technologies
</h2>

// AFTER (apply to all h2 section headings in About):
<h2 className="text-display heading-accent mb-6">
  Skills & Technologies
</h2>
```

Apply `.card` to the tech grid items:
```tsx
// BEFORE tech item:
<div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center border border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-primary-600 transition-colors">

// AFTER:
<div className="card text-center">
```

- [ ] **Step 3: Update `src/pages/Contact.tsx`**

```tsx
// BEFORE outer wrapper:
<div className="max-w-4xl mx-auto px-6 py-12">

// AFTER:
<div className="max-w-4xl mx-auto px-4 md:px-6 py-12 md:py-16">
```

Apply `.card .card-lg` to both the form section and the info section:
```tsx
// BEFORE form section:
<section className="bg-white dark:bg-surface-dark shadow-lg rounded-2xl p-8 border border-gray-100 dark:border-gray-700">

// AFTER:
<section className="card card-lg">
```

```tsx
// BEFORE info section:
<section className="bg-white dark:bg-surface-dark shadow-lg rounded-2xl p-8 border border-gray-100 dark:border-gray-700">

// AFTER:
<section className="card card-lg">
```

Replace section headings with `.text-display .heading-accent`:
```tsx
// All h1/h2 headings inside Contact that use primary-600 text-2xl/text-3xl font-bold/semibold:
<h1 className="text-display heading-accent mb-2">Get In Touch</h1>
<h2 className="text-display heading-accent mb-4">Let's Connect</h2>
```

Subheadings (h3 in the info section) use `text-base md:text-lg font-semibold`:
```tsx
<h3 className="text-base md:text-lg font-semibold text-semantic-text dark:text-semantic-text mb-4">
  Direct Contact
</h3>
```

- [ ] **Step 4: Verify tests pass**

```bash
npm test -- src/features/flashcards
```
Expected: 55 pass.

- [ ] **Step 5: Commit**

```bash
git add src/pages/About.tsx src/pages/Contact.tsx
git commit -m "feat: apply visual system to about and contact pages"
```

---

## Final Verification

- [ ] **Run full test suite**

```bash
npm test -- src/features/flashcards
```
Expected: 55 pass.

- [ ] **TypeScript check**

```bash
npm run type-check
```
Expected: no errors. If you see "Cannot find name 'text-semantic-muted'" style errors, those are class name strings — not TS issues. Only fix actual TypeScript errors.

- [ ] **Build check**

```bash
npm run build
```
Expected: build succeeds. If Tailwind warns about unknown classes at build time, verify the new class names match exactly what was added to `tailwind.config.js` (e.g., `text-semantic-muted` requires the `muted` key in the `semantic` object).
