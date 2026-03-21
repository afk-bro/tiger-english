# Semantic Color System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 12 semantic CSS custom property tokens with automatic dark/light switching, exposed as Tailwind utility classes via the `semantic` color namespace.

**Architecture:** CSS vars (RGB channels) defined in `@layer base` in `index.css` — `:root` for light, `.dark` for dark. `tailwind.config.js` maps each var to `rgb(var(--color-xxx) / <alpha-value>)` under a `semantic` key, enabling full opacity modifier support. Purely additive — no existing classes change.

**Tech Stack:** Tailwind CSS v3, CSS custom properties

**Spec:** `docs/superpowers/specs/2026-03-19-color-system-design.md`

---

## File Map

| File | Action |
|------|--------|
| `src/index.css` | Modify — add `@layer base` block with `:root` and `.dark` vars |
| `tailwind.config.js` | Modify — add `semantic` block inside `theme.extend.colors` |

---

## Task 1: Add CSS Custom Properties

**Files:**
- Modify: `src/index.css`

- [ ] **Step 1: Read the current file**

Read `src/index.css` to confirm its current contents before editing. It should contain `@tailwind base/components/utilities` and a `@layer utilities` block for 3D card transforms. Do not touch the utilities block.

- [ ] **Step 2: Add the `@layer base` block**

Append a **new, separate** `@layer base` block after the closing `}` of the existing `@layer utilities` block. Do not place it inside the utilities block — it must be its own top-level `@layer base { ... }` declaration:

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

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat: add semantic color CSS custom properties"
```

---

## Task 2: Wire Tokens into Tailwind

**Files:**
- Modify: `tailwind.config.js`

- [ ] **Step 1: Read the current file**

Read `tailwind.config.js` to locate `theme.extend.colors`. The existing keys are `primary`, `accent`, `success`, `base`, `text`, `surface`, `tiger`, `gold`. The new `semantic` block goes alongside them — do not remove or replace any existing key.

- [ ] **Step 2: Add the `semantic` block**

Inside `theme.extend.colors`, add the following object alongside the existing color keys:

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
},
```

This generates Tailwind utilities like `bg-semantic-primary`, `text-semantic-text-muted`, `border-semantic-border`, `bg-semantic-error/10` etc.

- [ ] **Step 3: Build to verify Tailwind picks up the tokens**

```bash
cd /home/x/dev/projects/gain-english && npm run build
```

Expected: clean build with no errors. If Tailwind throws a warning about `<alpha-value>`, check that the string uses angle brackets exactly: `<alpha-value>` (not `{alpha-value}` or `$alpha-value`).

- [ ] **Step 4: Verify tokens resolve correctly**

Since no component files use the new semantic classes yet, Tailwind won't generate them in the build output (it only generates classes referenced in source). Instead, temporarily add a safelist to `tailwind.config.js` to force generation, grep, then remove it:

```js
// Add temporarily to tailwind.config.js (top level, alongside plugins):
safelist: [
  { pattern: /^(bg|text|border|ring)-semantic-/ },
],
```

Then rebuild and check:

```bash
npm run build && grep -o '\.bg-semantic-[a-z0-9-]*' dist/assets/*.css | sort | head -20
```

Expected: at least `bg-semantic-primary`, `bg-semantic-surface`, `bg-semantic-error` etc.

After confirming, remove the temporary safelist entry before the commit in Step 5.

- [ ] **Step 5: Commit**

```bash
git add tailwind.config.js
git commit -m "feat: wire semantic color tokens into Tailwind config"
```

---

## Final Verification

- [ ] **Type-check**

```bash
npm run type-check
```

Expected: same pre-existing errors as before (5 known errors in ErrorBoundary.tsx, WelcomePanel.tsx, utils.ts, FlashcardsPage.tsx). No new errors.

- [ ] **Confirm dark mode vars**

Open browser dev tools on the running dev server (`npm run dev`), toggle the `.dark` class on `<html>`, and inspect any element. Confirm `--color-primary` switches from `50 109 226` to `90 138 233`.
