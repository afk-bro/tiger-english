# Visual System Design

**Goal:** Establish a consistent, maintainable visual design system across all pages using Tailwind-first conventions — covering typography, spacing, color roles, card system, micro-interactions, and a gradient accent line signature element.

**Architecture:**
- Color/font tokens → `tailwind.config.js`
- CSS variable additions → `src/index.css` (`:root` and `.dark` blocks)
- Component utility classes (`.card`, `.text-display`, `.heading-accent`, etc.) → `@layer components` in `src/index.css`
- All pages and components updated in a single pass to use the new classes. No new libraries.

**Tech Stack:** Tailwind CSS, CSS custom properties (already in use), React + TypeScript

---

## 1. Typography

### Font Families
- **Hero headings only**: DM Serif Display — strictly the main hero headline and at most one marquee marketing section
- **Everything else**: Inter
- **Drop Poppins entirely**: remove `body: ['"Poppins"', 'sans-serif']` from `fontFamily` in `tailwind.config.js` and remove the Poppins `<link>` from `index.html`

### Type Scale

| Role | Classes | Usage |
|------|---------|-------|
| Hero | `font-display text-3xl md:text-4xl lg:text-5xl leading-[1.1] md:leading-tight tracking-[-0.01em]` | Main hero headline only |
| `.text-display` | `text-2xl md:text-3xl font-semibold tracking-tight` | Section headings needing presence without DM Serif |
| Subheading / card title | `text-base md:text-lg font-semibold` | Card headers, feature titles |
| Body | `text-sm md:text-base leading-relaxed` | All paragraph text |
| Muted | `text-sm md:text-base leading-relaxed text-semantic-muted` | Secondary labels, metadata |

### Muted Text Levels

Add to `src/index.css` `:root` and `.dark` blocks:

```css
/* src/index.css — add to :root */
:root {
  /* ... existing vars ... */
  --color-muted: 100 116 139;   /* #64748B — secondary labels, metadata, placeholder text */
  --color-subtle: 148 163 184;  /* #94A3B8 — tertiary, timestamps, disabled */
}

.dark {
  /* ... existing vars ... */
  --color-muted: 148 163 184;   /* #94A3B8 */
  --color-subtle: 100 116 139;  /* #64748B */
}
```

Then add to the `semantic` object in `tailwind.config.js`:
```js
// inside theme.extend.colors.semantic
muted:  'rgb(var(--color-muted) / <alpha-value>)',
subtle: 'rgb(var(--color-subtle) / <alpha-value>)',
```

This produces Tailwind utilities `text-semantic-muted` and `text-semantic-subtle`. Use these class names throughout. **Do not** rename or remove the existing `--color-text-muted` variable — it is used elsewhere; these are additive.

Placeholder text sits at `--color-muted`, never as faint as `--color-subtle`.

### `.text-display` utility (add to `@layer components` in `src/index.css`)
```css
.text-display {
  @apply text-2xl md:text-3xl font-semibold tracking-tight;
}
```

---

## 2. Spacing

### Tiers

| Tier | Value | Usage |
|------|-------|-------|
| Micro | `gap-1` / `space-y-1` | Label→input, icon+text inline, badges, metadata |
| Tight | `gap-2` / `space-y-2` | Within card element groups |
| Card stack | `space-y-3` | Between items inside a card |
| Normal | `gap-4 md:gap-6` | Between cards, form fields, list items |
| Section (default) | `py-12 md:py-16` | Standard page sections |
| Section (important) | `py-16 md:py-20` | Hero, key marketing sections |

### Container Widths by Context
| Context | Class |
|---------|-------|
| Marketing hero | `max-w-6xl mx-auto px-4 md:px-6` |
| App / dashboard | `max-w-5xl mx-auto px-4 md:px-6` |
| Content-heavy (About, Contact, Login, Register) | `max-w-4xl mx-auto px-4 md:px-6` |

### Horizontal Rhythm Rules
- Card padding: `p-4 md:p-5` (large cards / modals: `p-6 md:p-7`)
- Section horizontal padding: `px-4 md:px-6`
- Grid gaps: `gap-4 md:gap-6`

### Hero Internal Spacing
- Stack: `space-y-6`
- Text block max width: `max-w-2xl`

### Hard Rule
All sections align to the same left container edge. No ad-hoc centering of individual elements outside the container.

---

## 3. Color Roles

### Primary Interactive Scale
| State | Application |
|-------|-------------|
| Default | `primary-500` (`#326de2`) |
| Hover | `primary-600` |
| Pressed | `primary-700` |
| Focus ring | `ring-2 ring-primary-400/40` |

### Brand Roles
| Role | Color | Usage |
|------|-------|-------|
| Primary | `#326de2` | Actions, interaction states, CTAs, progress indicators |
| Neutral | surface/border/muted vars | Backgrounds, card borders, dividers, secondary text, disabled |
| Accent | `#fcd34d` (gold) | Headings, highlights, curated moments — 1 element per section max |

### Semantic Roles
| Role | Usage |
|------|-------|
| Success | Positive feedback states |
| Warning | Caution feedback states |
| Danger | Error / destructive feedback |
| Info | Informational feedback |

Semantic roles are for feedback states only — never used as decoration.

### Hard Rules
- Cards: border first (`border border-semantic-border`), shadow secondary and very soft. No colorful shadows.
- Gold appears near headings, highlights, signature moments — not on interactive elements
- Blue appears on actions and interaction states — not decorative
- **Buttons**: strongest primary usage (`bg-primary-500 hover:bg-primary-600 active:bg-primary-700`)
- **Text links**: `text-primary-600`, no underline by default, underline on hover. Never bold or button-weight.
- **Active nav**: `text-primary-600 font-medium`. No background fills. Inactive: default weight + muted. Hover: `text-primary-500`.
- Placeholder text: `--color-muted` (#64748B), never as faint as `--color-subtle`
- Gold icon glow: `hover:shadow-[0_0_12px_rgba(252,211,77,0.2)]` — soft halo, low opacity, only on feature icons and highlighted stat icons. Never on utility icons.

---

## 4. Card System

All card classes go in `@layer components` in `src/index.css`.

The existing `tailwind.config.js` uses namespaced keys (`semantic.surface`, `semantic.border`). Card classes use the full Tailwind class names derived from those keys: `bg-semantic-surface`, `border-semantic-border`, etc. The one exception is `.card` light mode, which uses literal `bg-white` rather than a semantic token — this is intentional for maximum contrast against page backgrounds.

```css
/* @layer components in src/index.css */

.card {
  @apply bg-white dark:bg-semantic-surface;
  @apply rounded-2xl border border-semantic-border;
  @apply p-4 md:p-5;
  @apply shadow-sm;
  @apply transition-all duration-200 ease-out;
}
/* Note: light mode intentionally uses bg-white, not bg-semantic-surface,
   for maximum contrast on page backgrounds. */

/* Only applied when the entire card is a clickable target */
.card-interactive {
  @apply hover:-translate-y-0.5 hover:shadow-md cursor-pointer;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/40;
}

/* Slight elevation — stronger border, 2px top accent line, elevated shadow */
.card-featured {
  @apply border-primary-200 dark:border-primary-800 shadow-md;
  position: relative;
  overflow: hidden;
}
/* Accent line rendered as absolute top strip, not block flow, to work reliably
   with the card's rounded-2xl corners and any internal padding. */
.card-featured::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(to right, #326de2, #fcd34d);
}
/* 0.5rem top margin on the first child adds visual breathing room below the
   2px accent strip — this is intentional, not a pixel-exact offset. */
.card-featured > :first-child {
  margin-top: 0.5rem;
}

/* Modals, major feature panels — overrides .card padding */
.card-lg {
  @apply p-6 md:p-7;
}

/* Low-emphasis inner grouping — never nested inside .card-featured.
   50% opacity over the parent card surface is intentional in both light and dark
   mode — produces a subtle recessed inset. The dark mode value resolves
   automatically via --color-surface. */
.card-ghost {
  background-color: rgb(var(--color-surface) / 0.5);
  border: 1px solid rgb(var(--color-border) / 0.5);
  @apply shadow-none rounded-xl;
}
/* Note: --color-muted (100 116 139) shares the same channel values as
   --color-secondary. This is intentional — muted is a semantic alias for
   this grey, used specifically for text contexts. */
```

### Rules
- Every feature lives in a card — flashcard sets, stat blocks, form sections, feature highlights
- Cards never nest more than one level deep. Use `.card-ghost` for inner groupings.
- `.card-interactive` only when the whole card is a clickable target — not on static content
- No floating elements, except: badges attached to a card edge, dropdown/popover surfaces, toast notifications, clearly intentional decorative accents

### Card Anatomy Convention
- **Header**: title, badge, metadata row
- **Body**: primary content
- **Footer**: actions, secondary links, timestamps

Not every card uses all three, but this is the mental model for consistent internal layout.

---

## 5. Micro-interactions

All micro-interaction utility classes go in `@layer components` in `src/index.css`.

### Global Transition Baseline
```css
.transition-base {
  @apply transition-all duration-200 ease-out;
}
```
Applied to buttons, cards, nav links, inputs, icons. Nothing slower than 200ms except page-level fades.

### Hover States
| Element | Behaviour |
|---------|-----------|
| `.card-interactive` | `hover:-translate-y-0.5 hover:shadow-md` |
| Primary button | `hover:bg-primary-600` |
| Secondary button | `hover:bg-semantic-surface-2` |
| Text links | underline appears on hover, no weight shift |
| Nav links | `hover:text-primary-500` |
| Feature icons (selective) | `hover:shadow-[0_0_12px_rgba(252,211,77,0.2)]` |

### Button Press and Focus
`active:scale-95` and `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/40` must be added directly to the shared `src/components/ui/Button.tsx` component — not at individual call sites. This ensures every button in the app inherits these states automatically. The same principle applies to `NavLink.tsx` (add active/hover/focus states there, not per-page).

---

## 6. Signature Element — Gradient Accent Line

Add to `@layer components` in `src/index.css`:

```css
/* Section titles — short, editorial (default) */
.heading-accent {
  @apply relative inline-block pb-2;
}
.heading-accent::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  height: 2px;
  width: 3rem; /* w-12 */
  border-radius: 9999px;
  background: linear-gradient(to right, #326de2, #fcd34d);
}

/* Hero / key marketing moments only — full text span */
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
```

**Usage:**
- `.heading-accent` (short `w-12`): section titles on Home, About, Flashcards, Dashboard — the default
- `.heading-accent-wide` (full width): hero headline and at most one other marquee moment per page
- Never applied to subheadings, card titles, or body text

---

## 7. Page-by-Page Application

### All pages
- Remove Poppins `<link>` from `index.html`; remove `body` key from `fontFamily` in `tailwind.config.js`
- Apply correct container width class for page context
- Apply `.card` to all feature/content blocks currently using ad-hoc backgrounds
- `active:scale-95` and `focus-visible` ring handled at component level in `Button.tsx` and `NavLink.tsx` — not per page

### Home
- Hero (`HeroSection.tsx`): `max-w-6xl` container, `py-16 md:py-20`, `space-y-6`, text block `max-w-2xl`, hero title gets `.heading-accent-wide`
- Features section (`FeaturesSection.tsx`): each feature card → `.card`, feature icons selective gold halo
- FinalCta (`FinalCtaSection.tsx`): `py-12 md:py-16`

### Flashcards (`FlashcardsPage.tsx` + feature components)
- `max-w-5xl` container
- `FlashcardSetList`: set list items → `.card .card-interactive`
- `FlashcardViewer`: outer wrapper → `.card .card-lg`
- `CreateSetModal`: dialog inner div → `.card .card-lg` (replaces current ad-hoc background/border/shadow)
- Section heading → `.heading-accent`

### Dashboard (`Dashboard.tsx`)
- `max-w-5xl` container
- Stat blocks → `.card`
- Highlighted stat icon → selective gold halo
- Section heading → `.heading-accent`

### Login / Register
- `max-w-4xl` container
- Form section → `.card .card-lg`

### About / Contact
- `max-w-4xl` container
- Content blocks → `.card`
- Section headings → `.heading-accent`
