# Sidebar on `/flashcards` for authenticated users — design

**Status:** approved (spec under review)
**Author:** afk-bro
**Last updated:** 2026-05-04

## Problem

A logged-in user lands on `/flashcards` and sees the public marketing-style `Header` instead of the authenticated `AppSidebar` they have on every other in-app page. The sidebar even has a `/flashcards` link (`AppSidebar.tsx:27`) that takes the user there — but the destination drops the chrome the user clicked from. That's the disorienting bit.

The route is correctly bucketed as "public" because anonymous users *can* visit `/flashcards` and try a few flashcards before signing in. The problem is purely chrome selection: the bucket forces `PublicLayout` for everyone, regardless of auth state.

## Goals

1. Authenticated users on `/flashcards` see `AppSidebar` (same chrome as `/dashboard`, `/lessons`, `/settings`).
2. Anonymous users on `/flashcards` keep seeing `PublicLayout` (header + footer) — the public preview path stays intact.
3. The change is surgical: only `/flashcards` is affected. Other public routes (`/`, `/about`, `/contact`, `/u/:username`, auth flows) stay on `PublicLayout` regardless of auth state.

## Non-goals

- Restructuring all routes into a unified auth-aware shell. Larger refactor that would touch every layout choice; not needed here.
- Adding a `/flashcards` link to the sidebar — already exists at `AppSidebar.tsx:27`.
- Treating other public routes (`/`, `/about`, `/contact`) as app pages when authenticated — those are intentional marketing pages where the public header is correct.
- Eliminating the brief chrome-flash window on initial mount before `supabase.auth.getSession()` resolves. Trade-off documented below; we accept the flash.

## Approach

Add a thin auth-aware route element that picks the layout based on session state, and reparent `/flashcards` under it. Both existing layouts already render `<Outlet />` for nested routes, so the wrapper just delegates.

```tsx
// inline in src/App.tsx
function FlashcardsLayout() {
  const session = useUserStore((s) => s.session);
  return session ? <AuthLayout /> : <PublicLayout />;
}
```

Route tree change:

```tsx
// before
<Route element={<PublicLayout />}>
  ...
  <Route path="/flashcards" element={<FlashcardsPage />} />
  ...
</Route>

// after
<Route element={<PublicLayout />}>
  // /flashcards removed from this block
</Route>
<Route path="/flashcards" element={<FlashcardsLayout />}>
  <Route index element={<FlashcardsPage />} />
</Route>
```

`FlashcardsLayout` does not gate auth — anonymous users still reach `<FlashcardsPage />` through `PublicLayout`. The wrapper only chooses the chrome.

## Architecture / data flow

```
Browser hits /flashcards
    ↓
React Router resolves <FlashcardsLayout />
    ↓
useUserStore.session
  ├── null (anon or pre-hydration) → <PublicLayout /> → <Outlet /> → <FlashcardsPage />
  └── truthy (authenticated)       → <AuthLayout />   → <Outlet /> → <FlashcardsPage />
```

`useUserStore.session` is populated by `AppInitializer` via `supabase.auth.getSession()` (async) and `onAuthStateChange` (event-driven). On initial mount, the store starts with `session = null` until `getSession()` resolves.

## Trade-off: the chrome flash

A logged-in user landing fresh on `/flashcards` (cold reload, not a SPA navigation from `/home`) will:

1. See `PublicLayout` for ~100-300ms (the time `supabase.auth.getSession()` takes to read from `localStorage` and resolve).
2. Re-render once `setSession(...)` fires, swapping to `AuthLayout`.

The flash is on chrome only — the flashcards content underneath renders normally and isn't replaced. Two options considered:

- **Accept the flash (chosen).** Brief, content not affected, no loader on what is fundamentally a public-preview-capable page.
- **Block on `useUserStore.sessionLoading`.** No flash, but a ~200ms spinner before the page chrome resolves. Adds latency to every visit, including anonymous, for a chrome-only change. Not worth it.

If a future quality-of-life pass wants to eliminate the flash, the right move would be persisting last-known-auth-state in `localStorage` so the first render can pick a layout synchronously. That's larger scope and cross-cuts other layouts; not in this design.

## Components

### `FlashcardsLayout` (new)

- **Location:** inlined in `src/App.tsx` near the existing `StubPage` helper. No new file. Single-purpose, six lines.
- **Inputs:** none. Reads `session` from `useUserStore`.
- **Outputs:** `<AuthLayout />` or `<PublicLayout />`.
- **Why inline rather than its own file:** YAGNI. One use site, one responsibility, no logic worth a dedicated file.

### `App.tsx` route tree (modify)

- Remove the `<Route path="/flashcards" ...>` line from inside the `<Route element={<PublicLayout />}>` block.
- Add a new sibling `<Route path="/flashcards" element={<FlashcardsLayout />}>` block with an index child rendering `<FlashcardsPage />`.

### Other components

No changes to `AuthLayout`, `PublicLayout`, `AppSidebar`, `FlashcardsPage`, or `useUserStore`.

## Testing

- **New unit test:** `src/__tests__/FlashcardsLayout.test.tsx` (or co-located in `App.test.tsx` if such a file exists). Covers the two branches:
  - `session = null` → renders `PublicLayout`'s child marker.
  - `session = { ... }` → renders `AuthLayout`'s child marker.
  Both layouts get mocked at the module level so the test asserts which one mounts without rendering their full chrome.
- **Existing tests:** `AppSidebar.test.tsx` doesn't test routing-layout coupling, no impact. `FlashcardsPage`-touching tests don't render outer chrome, no impact.
- **Manual verify:**
  1. Logged in, click `Flashcards` from sidebar → land on `/flashcards` with sidebar still visible.
  2. Logged in, hard-reload `/flashcards` → see brief PublicLayout flash, then sidebar appears.
  3. Logged out, navigate to `/flashcards` → see public header + footer, no sidebar.
  4. Logged out, click `Login`, log in → routed to authenticated home; navigate back to `/flashcards` from sidebar → sidebar visible.

## Acceptance criteria

- [ ] Authenticated user clicking `Flashcards` from the sidebar stays in the sidebar layout on the destination.
- [ ] Authenticated user reloading `/flashcards` ends up with the sidebar after the brief auth-hydration window.
- [ ] Anonymous user on `/flashcards` sees the public `Header` and can still browse curated sets.
- [ ] All other public routes (`/`, `/about`, `/contact`, `/login`, `/register`, `/u/:username`, `/auth/callback`) render identically before and after this change.
- [ ] `npm test` and `npm run type-check` clean.
