# Visual System Design

**Goal:** Establish a consistent, maintainable visual design system across all pages using Tailwind-first conventions — covering typography, spacing, color roles, card system, micro-interactions, and a gradient accent line signature element.

**Architecture:** All design tokens and component classes live in `tailwind.config.js` and `@layer components` in `src/index.css`. All pages and components are updated in a single pass to use the new classes. No new libraries.

**Tech Stack:** Tailwind CSS, CSS custom properties (already in use), React + TypeScript

---

## 1. Typography

### Font Families
- **Hero headings only**: DM Serif Display — strictly the main hero headline and at most one marquee marketing section
- **Everything else**: Inter
- **Drop Poppins** from the font stack entirely

### Type Scale

| Role | Classes | Usage |
|------|---------|-------|
| Hero | `font-display text-3xl md:text-4xl lg:text-5xl leading-[1.1] md:leading-tight tracking-[-0.01em]` | Main hero headline only |
| `.text-display` | `text-2xl md:text-3xl font-semibold tracking-tight` | Section headings needing presence without DM Serif |
| Subheading / card title | `text-base md:text-lg font-semibold` | Card headers, feature titles |
| Body | `text-sm md:text-base leading-relaxed` | All paragraph text |
| Muted | `text-sm md:text-base leading-relaxed text-muted` | Secondary labels, metadata |

### Muted Text Levels
```css
--muted: #64748B;   /* secondary labels, metadata, placeholder text */
--subtle: #94A3B8;  /* tertiary, timestamps, disabled */
```
Placeholder text sits at `--muted`, never as faint as `--subtle`.

### `.text-display` utility
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
- Cards: border first (`border border-border`), shadow secondary and very soft. No colorful shadows.
- Gold appears near headings, highlights, signature moments — not on interactive elements
- Blue appears on actions and interaction states — not decorative
- **Buttons**: strongest primary usage (`bg-primary-500 hover:bg-primary-600 active:bg-primary-700`)
- **Text links**: `text-primary-600`, no underline by default, underline on hover. Never bold or button-weight.
- **Active nav**: `text-primary-600 font-medium`. No background fills. Inactive: default weight + muted. Hover: `text-primary-500`.
- Placeholder text: `--muted` (#64748B), never as faint as `--subtle`
- Gold icon glow: `hover:shadow-[0_0_12px_rgba(252,211,77,0.2)]` — soft halo, low opacity, only on feature icons and highlighted stat icons. Never on utility icons.

---

## 4. Card System

### Base Classes
```css
.card {
  @apply bg-white dark:bg-surface-dark;
  @apply rounded-2xl border border-border;
  @apply p-4 md:p-5;
  @apply shadow-sm;
  @apply transition-all duration-200 ease-out;
}

/* Only when the entire card is a clickable target */
.card-interactive {
  @apply hover:-translate-y-0.5 hover:shadow-md cursor-pointer;
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/30;
}

/* Slight elevation — stronger border, subtle accent line, elevated shadow */
.card-featured {
  @apply border-primary-200 dark:border-primary-800 shadow-md;
  /* 2px top accent line via ::before */
}
.card-featured::before {
  content: '';
  @apply block h-[2px] w-full rounded-t-2xl -mt-px mb-4;
  background: linear-gradient(to right, #326de2, #fcd34d);
}

/* Modals, major feature panels */
.card-lg {
  @apply p-6 md:p-7;
}

/* Low-emphasis inner grouping — never nested inside .card-featured */
.card-ghost {
  @apply bg-surface/50 shadow-none border border-border/50 rounded-xl;
}
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
| Secondary button | `hover:bg-surface-2` |
| Text links | underline appears on hover, no weight shift |
| Nav links | `hover:text-primary-500` |
| Feature icons (selective) | `hover:shadow-[0_0_12px_rgba(252,211,77,0.2)]` |

### Button Press
```css
@apply active:scale-95;
```
All buttons. Instant feedback, snaps back on release.

### Focus Ring (Consistent Across All Interactive Elements)
```css
@apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/40;
```
Applied to buttons, inputs, cards, links uniformly.

---

## 6. Signature Element — Gradient Accent Line

Two modes:

```css
/* Section titles — short, editorial (default) */
.heading-accent {
  @apply relative inline-block pb-2;
}
.heading-accent::after {
  content: '';
  @apply absolute bottom-0 left-0 h-[2px] w-12 rounded-full;
  background: linear-gradient(to right, #326de2, #fcd34d);
}

/* Hero / key marketing moments only — full span */
.heading-accent-wide {
  @apply relative inline-block pb-2;
}
.heading-accent-wide::after {
  content: '';
  @apply absolute bottom-0 left-0 h-[2px] w-full rounded-full;
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
- Remove Poppins references
- Apply correct container width class for page context
- Apply `.card` to all feature/content blocks currently using ad-hoc backgrounds
- Apply `focus-visible` ring to all interactive elements
- Apply `active:scale-95` to all buttons

### Home
- Hero: `max-w-6xl` container, `py-16 md:py-20`, `space-y-6`, text block `max-w-2xl`, hero title gets `.heading-accent-wide`
- Features section: each feature card → `.card`, feature icons selective gold halo
- FinalCta: `py-12 md:py-16`

### Flashcards
- `max-w-5xl` container
- Set list items → `.card .card-interactive`
- FlashcardViewer → `.card .card-lg`
- Section heading → `.heading-accent`

### Dashboard
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
