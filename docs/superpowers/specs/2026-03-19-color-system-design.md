# Semantic Color System — Design Spec

**Date:** 2026-03-19
**Scope:** Add a semantic color token layer on top of the existing Tailwind palette. Two files change. Purely additive — no existing classes are removed or migrated.

---

## Problem

The codebase uses raw palette steps directly (`text-primary-600`, `dark:bg-surface-dark`, `text-gray-500`) meaning:
- Dark mode requires explicit `dark:` classes everywhere
- Semantic intent is unclear (`primary-600` vs `primary-400` vs `gray-500` all used for "muted" text)
- No named tokens for `warning`, `error`, `border`, or `text-muted`

## Solution

CSS custom properties (RGB channels) defined in `:root` and `.dark`, referenced by Tailwind via `rgb(var(--color-xxx) / <alpha-value>)`. This gives:
- Auto dark/light switching — components use `bg-surface`, never `dark:bg-surface-dark`
- Full Tailwind opacity modifier support (`bg-primary/50`, `text-text-muted/70`)
- A complete, named token set for the 12 semantic roles

---

## Token Definitions

### Light mode (`:root`) / Dark mode (`.dark`)

| Token | Role | Light value | Light hex | Dark value | Dark hex |
|-------|------|-------------|-----------|------------|----------|
| `--color-primary` | Brand / primary actions | `50 109 226` | `#326de2` | `90 138 233` | `#5a8ae9` |
| `--color-secondary` | Secondary actions / neutral | `100 116 139` | `#64748b` | `148 163 184` | `#94a3b8` |
| `--color-accent` | Brand gold / decorative highlights | `252 211 77` | `#fcd34d` | `252 211 77` | `#fcd34d` |
| `--color-success` | Positive states | `16 185 129` | `#10b981` | `52 211 153` | `#34d399` |
| `--color-warning` | Caution states | `245 158 11` | `#f59e0b` | `251 191 36` | `#fbbf24` |
| `--color-error` | Error / destructive states | `239 68 68` | `#ef4444` | `248 113 113` | `#f87171` |
| `--color-bg` | App background | `254 254 254` | `#fefefe` | `17 24 39` | `#111827` |
| `--color-surface` | Cards, panels (level 1) | `248 250 252` | `#f8fafc` | `30 41 59` | `#1e293b` |
| `--color-surface-2` | Nested cards / elevated surface (level 2) | `241 245 249` | `#f1f5f9` | `51 65 85` | `#334155` |
| `--color-text` | Primary content text | `31 41 55` | `#1f2937` | `243 244 246` | `#f3f4f6` |
| `--color-text-muted` | Secondary / muted text | `107 114 128` | `#6b7280` | `156 163 175` | `#9ca3af` |
| `--color-border` | Dividers, input borders | `226 232 240` | `#e2e8f0` | `51 65 85` | `#334155` |

---

## Implementation

### `src/index.css`

Add inside `@layer base` after the existing `@tailwind` directives. Using `@layer base` is the canonical Tailwind placement — it ensures variables are injected into the base layer cascade alongside Tailwind's own preflight:

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
  }
}
```

### `tailwind.config.js`

Add a `semantic` block inside `theme.extend.colors`:

```js
semantic: {
  primary:    'rgb(var(--color-primary) / <alpha-value>)',
  secondary:  'rgb(var(--color-secondary) / <alpha-value>)',
  accent:     'rgb(var(--color-accent) / <alpha-value>)',
  success:    'rgb(var(--color-success) / <alpha-value>)',
  warning:    'rgb(var(--color-warning) / <alpha-value>)',
  error:      'rgb(var(--color-error) / <alpha-value>)',
  bg:         'rgb(var(--color-bg) / <alpha-value>)',
  surface:    'rgb(var(--color-surface) / <alpha-value>)',
  'surface-2':'rgb(var(--color-surface-2) / <alpha-value>)',
  text:       'rgb(var(--color-text) / <alpha-value>)',
  'text-muted':'rgb(var(--color-text-muted) / <alpha-value>)',
  border:     'rgb(var(--color-border) / <alpha-value>)',
},
```

Tailwind utility classes generated:
- `bg-semantic-primary`, `text-semantic-primary`, `border-semantic-primary`, `bg-semantic-primary/50` …
- `bg-semantic-surface`, `bg-semantic-surface-2`, `bg-semantic-bg` …
- `text-semantic-text`, `text-semantic-text-muted` …
- `border-semantic-border` …
- `bg-semantic-error`, `bg-semantic-warning`, `bg-semantic-success` …

---

## Backward Compatibility

The existing `primary-50…900`, `accent`, `success`, `surface`, `text`, `base`, `tiger`, `gold` scales in `tailwind.config.js` are **not removed**. Existing components continue to work. Migration to semantic tokens is optional and incremental.

---

## Out of Scope

- No migration of existing components to use semantic tokens
- No changes to any component files
- No CSS variable usage in JavaScript/TypeScript
- No removal of existing palette scale entries
