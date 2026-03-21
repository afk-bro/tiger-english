# Authenticated Home Experience — Design Spec

**Date:** 2026-03-21
**Status:** Approved for implementation

---

## Overview

When a user is authenticated, the public landing page is replaced in-place with a personalised learning hub. A persistent right-side collapsible sidebar provides app-wide navigation across all authenticated routes. The public landing page continues to serve unauthenticated visitors unchanged.

**Design principle:** The public landing page sells. The authenticated home serves.

---

## 1. Routing & Layout Structure

### Route Map

| Route | Layout | Auth required | Notes |
|---|---|---|---|
| `/` | Conditional | No | Renders `AuthHome` if session, public `Home` if not |
| `/dashboard` | AuthLayout | Yes | New flat route replacing `/u/:username` for the user's own dashboard |
| `/library` | AuthLayout | Yes | |
| `/study-groups` | AuthLayout | Yes | |
| `/notifications` | AuthLayout | Yes | |
| `/flashcards` | AuthLayout | Yes | |
| `/drag-drop` | AuthLayout | Yes | |
| `/ad-libs` | AuthLayout | Yes | |
| `/login`, `/register` | PublicLayout | No | Redirects to `/` if session exists |
| `/about`, `/contact` | PublicLayout | No | |
| `/auth/callback` | None | No | |
| `/u/:username` | PublicLayout | No | Reserved for future public learner profile page |

### Migration: `/u/:username` → `/dashboard`

The existing authenticated dashboard currently lives at `/u/:username` (guarded by `UserLayout`). This feature moves the user's own dashboard to the flat `/dashboard` route inside `AuthLayout`. The `/u/:username` route is preserved but repurposed as a future public profile page (no auth required). `UserLayout` is retired as a route guard — its redirect logic is replaced by `RequireAuth`.

### Auth Guards

**`RequireAuth`** (`src/features/auth/RequireAuth.tsx`):
Reads `session` and `sessionLoading` from the store. Shows a spinner while `sessionLoading: true`. Redirects to `/login` if no session. Renders children when session is present.

**`RequireGuest`** (`src/features/auth/RequireGuest.tsx`):
Reads `session` and `sessionLoading` from the store. Redirects to `/` if session exists. Renders children when no session. Used on `/login` and `/register`.

### `/` Conditional Render

The root route reads `session` and `sessionLoading` from the store. Shows a spinner while `sessionLoading: true`. If a session exists it renders `AuthHome`; if not it renders the public landing page (`Home`). No redirect. Same URL.

### Layout Split

**`PublicLayout`** (renamed from current `Layout`):
- Sticky header with full nav (Flashcards, About, Contact)
- Login / Register buttons
- Footer

**`AuthLayout`** (`src/components/layout/AuthLayout.tsx`):
- Slimmer header: logo, dark mode toggle, language switcher, profile/user menu, mobile sidebar toggle button
- No footer
- Right-side collapsible `AppSidebar`
- Main content area adjusts width based on sidebar collapsed state

---

## 2. Auth & Session State

### Store Structure

Auth and profile concerns are explicitly separated into two slices within `useUserStore`:

**Auth slice fields added:**
- `session: Session | null` — Supabase session object
- `sessionLoading: boolean` — true until first resolution; starts true

**Profile slice field renamed:**
- `loading` → `profileLoading` (rename to avoid ambiguity now that auth has its own loading flag)
- `profile`, `profileLoading`, `error` remain

**Migration note:** `UserLayout.tsx` currently reads `loading` directly from the store and must be updated to `profileLoading`. Any other consumers of `loading` from `useUserStore` should be audited and updated.

### `AppInitializer` (extended)

Extends the existing component to own the full session lifecycle. The known Supabase double-fire issue (where `onAuthStateChange` emits `INITIAL_SESSION` near-synchronously after subscription, overlapping with `getSession()`) is handled by using `getSession()` for the one-time initial hydration and relying on `onAuthStateChange` only for subsequent changes. A `handled` flag prevents duplicate `fetchProfile()` calls on mount:

1. Sets `sessionLoading: true` on mount
2. Calls `supabase.auth.getSession()` for initial hydration — writes session to store, sets `sessionLoading: false`
3. Subscribes to `supabase.auth.onAuthStateChange()` — on subsequent events (not the initial `INITIAL_SESSION` on mount), updates session and calls `fetchProfile()` or `clearProfile()` as appropriate
4. On unmount: unsubscribes

### Sidebar State Store

Sidebar collapse preference is managed in a dedicated `useSidebarStore` (`src/stores/useSidebarStore.ts`) to keep it separate from user/auth concerns:

```ts
useSidebarStore {
  collapsed: boolean          // desktop preference, persisted in localStorage
  toggleCollapsed: () => void // writes to both store and localStorage
}
```

On store init, reads `localStorage` key `sidebar_collapsed`. Defaults to `false` (expanded) if key is absent or value is not a valid boolean string. Handles invalid stored value safely (falls back to default without throwing).

---

## 3. AppSidebar Component

### Component API

```ts
AppSidebar props {
  // Desktop
  collapsed: boolean
  onToggleCollapsed: () => void
  // Mobile
  isOpen: boolean
  onClose: () => void
}
```

`collapsed` — persisted desktop preference from `useSidebarStore`.
`isOpen` — transient mobile-only state held in `AuthLayout` local state. Never persisted. Resets on every page load and route navigation.

### Structure

Three vertical zones:

**Top zone:**
- Tiger English logo mark (always visible)
- "Tiger English" wordmark (visible in expanded mode only)
- Collapse toggle button

**Nav zone (middle, scrollable):**

| Icon (lucide-react) | Label | Route |
|---|---|---|
| `Home` | Home | `/` |
| `LayoutDashboard` | Dashboard | `/dashboard` |
| `BookOpen` | Library | `/library` |
| `Users` | Study Groups | `/study-groups` |
| `Bell` | Notifications | `/notifications` |
| `Layers` | Flashcards | `/flashcards` |
| `MousePointer2` | Drag & Drop | `/drag-drop` |
| `FileText` | Ad Libs | `/ad-libs` |

**Bottom utility zone:**
- Settings, Help, Profile, Logout
- Stubbed UI only in this implementation — no routing or functionality yet
- Icon only in collapsed mode, icon + label in expanded mode

### Nav Item Behaviour

Uses React Router `NavLink` for active state — not manual `pathname` comparison. The `end` prop is applied to `/` only, preventing it from matching all routes. `NavLink`'s `isActive` callback handles subroute matching correctly.

### Active State

- **Expanded mode:** filled background + primary colour text
- **Collapsed mode:** filled background + primary colour icon + left/right border accent (unambiguous without a label)

### Collapsed Mode Tooltips

- MVP: `title` attribute on icon buttons
- Future upgrade path: Radix `Tooltip` component

### Sidebar Persistence

- **Desktop collapse preference:** persisted in `localStorage` key `sidebar_collapsed` via `useSidebarStore`
- **Mobile drawer open state:** local `isOpen` state in `AuthLayout` only — resets every page load — never persisted

### Motion

- Desktop width transition: `width 150ms ease-in-out`
- Mobile drawer: `transform: translateX` transition `200ms ease-in-out`
- Overlay fade: `opacity 200ms ease-in-out`

### Accessibility

- Active nav item: `aria-current="page"`
- Collapsed icon-only buttons: `aria-label` with item name
- Mobile drawer: `role="dialog"`, `aria-modal="true"`, focus trap while open
- On drawer close: focus returns to the header toggle button that opened it
- Full keyboard navigation with visible focus rings

---

## 4. AuthHome Page

`AuthHome` is layout-only — it composes the four card components and passes mock data. No logic lives in `AuthHome` itself. Each card receives an `isLoading: boolean` prop that triggers its skeleton state. With mock data `isLoading` is always `false`; it will be driven by async fetch state when real data is wired up.

### Layout

```
┌─────────────────────────┬─────────────────┐
│  ContinueStudyingCard   │  RecommendedNext │
│       (2/3 width)       │   (1/3 width)   │
├─────────────────────────┼─────────────────┤
│    InviteFriendsCard    │ StudyGroupsCard  │
│       (1/2 width)       │  (1/2 width)    │
└─────────────────────────┴─────────────────┘
```

Mobile: single column, stacked in display order. `ContinueStudyingCard` is visually dominant and always renders first.

### Card Components

#### `ContinueStudyingCard`

Props: `data: ContinueStudyingData | null, isLoading: boolean`

**Skeleton state:** `isLoading: true`
**Empty state:** `data === null` — "Start your first set" CTA
**Populated state:** `data` present

Populated content:
- Set title + language/theme tag
- "Reviewed X of Y cards" progress bar (`reviewedCount / totalCards`)
- Boundary: if `totalCards === 0`, render progress bar at 0% (guard against division by zero)
- Boundary: if `reviewedCount === totalCards` (100%), render the card in populated state with a "completed" visual indicator — do not switch to empty state
- "Last studied X hours/days ago" relative timestamp
- Streak or accuracy badge (optional, rendered only if data present)
- **Continue Studying** primary CTA → navigates to `/flashcards` with `{ state: { setId } }` as route state

---

#### `RecommendedNextCard`

Props: `data: RecommendedItem[] | null, isLoading: boolean`

**Skeleton state:** `isLoading: true`
**Empty state:** `data === null || data.length === 0` — "Complete a set to unlock recommendations"
**Populated state:** renders up to 3 items

Each item displays:
- Set title
- Reason label: uses `reasonLabel` if present, otherwise falls back to a default string per `reasonType`:
  - `'review'` → "Needs review"
  - `'sequence'` → "Next in sequence"
  - `'related'` → "Related to recent study"
- **Study** button

---

#### `InviteFriendsCard`

Props: `data: InviteFriendsData, isLoading: boolean`

**Invite URL format:** `https://tiger-english.com/invite?ref={userId}` — generated by a helper `buildInviteUrl(userId: string): string` exported from `src/lib/invite.ts`. This helper is the swap point for a real endpoint. It is called once when constructing mock data to produce the `inviteUrl` string stored in `InviteFriendsData`. The card component uses `data.inviteUrl` directly and never imports from the mocks directory.

Actions:
- **Copy Invite Link** (primary) — calls `navigator.clipboard.writeText(data.inviteUrl)`
  - Success → `toast.success("Invite link copied!")`
  - Write failure → `toast.error("Failed to copy link. Please copy it manually.")`
  - Clipboard API unavailable (e.g. non-HTTPS) → `toast.error("Clipboard not available. Please copy the link manually.")` — intentional, not silent
- **Invite a Friend** (secondary) — stub only in this implementation

---

#### `StudyGroupsCard`

Props: `data: StudyGroupsData, isLoading: boolean`

**Skeleton state:** `isLoading: true`
**Empty state:** `data.groups.length === 0` — "No study groups yet" + supporting text + prominent **Create Study Group** CTA (action remains obvious in empty state)
**Populated state:** group list + pending invites badge

Actions:
- **Create Study Group** (primary)
- **Invite to Group** (secondary, disabled if `data.groups.length === 0`)
- Pending invites badge: shows `data.pendingInviteCount` (hidden if 0)

---

### Card States (all four cards)

Each card handles three states driven by props:
1. **Skeleton** — `isLoading: true` — pulsing placeholder matching card dimensions
2. **Empty** — data absent or empty — icon + message + primary CTA
3. **Populated** — full content

---

## 5. Data Layer

### Types (`src/components/home/authenticated/types.ts`)

```ts
interface ContinueStudyingData {
  setId: string
  title: string
  theme: string
  reviewedCount: number
  totalCards: number
  lastStudiedAt: string    // ISO 8601 timestamp
  streak?: number
  accuracy?: number        // 0–100
}

type ReasonType = 'review' | 'sequence' | 'related'

interface RecommendedItem {
  setId: string
  title: string
  reasonType: ReasonType
  reasonLabel?: string     // display string; falls back to default per reasonType if absent
  priority: number
}

interface InviteFriendsData {
  inviteUrl: string
}

interface StudyGroup {
  id: string
  name: string
  memberCount: number
}

interface StudyGroupsData {
  groups: StudyGroup[]
  pendingInviteCount: number
}
```

### Mock Data

`src/mocks/authHome.mock.ts` — exports typed mock objects for each card and the `buildInviteUrl` helper. Mirrors the existing `mockDashboardData` pattern. When real endpoints are ready, only the data-fetching layer changes — card components and their interfaces remain unchanged.

---

## 6. Testing Plan

### `AppInitializer`
- Initializes with `sessionLoading: true`
- Calls `getSession()` on mount, resolves session, sets `sessionLoading: false`
- Subscribes to `onAuthStateChange`, updates session on subsequent auth changes
- Does not call `fetchProfile()` twice on mount (deduplication guard)
- Guarded routes stop showing spinner after initialization

### `useSidebarStore`
- Reads persisted `collapsed` state from `localStorage` on init
- Defaults to `false` (expanded) when `localStorage` key is absent
- Handles invalid stored value safely (falls back to `false`)
- `toggleCollapsed` writes updated value to `localStorage`

### `AppSidebar`
- Renders all 8 nav items
- Active nav item receives `aria-current="page"`
- Collapsed mode: nav items have accessible `aria-label` with item name
- Mobile drawer has `role="dialog"` and `aria-modal="true"` when open
- Focus returns to trigger button on drawer close

### `ContinueStudyingCard`
- Renders skeleton state when `isLoading: true`
- Renders empty state when `data` is null
- Renders populated state with correct content
- Progress bar renders at 0% when `totalCards === 0`
- Shows completed indicator when `reviewedCount === totalCards`
- Continue Studying navigates to `/flashcards` with `{ state: { setId } }` payload

### `RecommendedNextCard`
- Renders skeleton state
- Renders up to 3 items in populated state
- Renders empty state when data is empty
- Renders default `reasonType` label when `reasonLabel` is absent

### `InviteFriendsCard`
- Calls `navigator.clipboard.writeText` with correct invite URL on copy
- Fires success toast on copy
- Fires error toast on clipboard write failure
- Fires error toast when clipboard API is unavailable (`navigator.clipboard` is undefined)

### `StudyGroupsCard`
- Renders skeleton state
- Empty state renders with Create Study Group CTA visible
- Invite to Group button is disabled when groups array is empty
- Pending invites badge renders correct count; hidden when count is 0

### `RequireAuth`
- Shows spinner while `sessionLoading: true`
- Redirects to `/login` when session is null and not loading
- Renders children when session is present

### `RequireGuest`
- Shows spinner while `sessionLoading: true`
- Redirects to `/` when session exists and not loading
- Renders children when no session

### `AuthHome`
- Renders all four card components
- Correct layout grid classes present

---

## 7. File Structure

```
src/
  components/
    layout/
      AuthLayout.tsx
      PublicLayout.tsx              # renamed from Layout.tsx
    sidebar/
      AppSidebar.tsx
      SidebarNavItem.tsx
      __tests__/
        AppSidebar.test.tsx
    home/
      authenticated/
        ContinueStudyingCard.tsx
        RecommendedNextCard.tsx
        InviteFriendsCard.tsx
        StudyGroupsCard.tsx
        types.ts
        __tests__/
          ContinueStudyingCard.test.tsx
          RecommendedNextCard.test.tsx
          InviteFriendsCard.test.tsx
          StudyGroupsCard.test.tsx
  pages/
    AuthHome.tsx
    Home.tsx                        # existing, unchanged
  features/
    auth/
      RequireAuth.tsx
      RequireGuest.tsx
      logoutUser.ts                 # existing
  stores/
    useUserStore.ts                 # add session, sessionLoading; rename loading → profileLoading
    useSidebarStore.ts              # new
  lib/
    invite.ts                       # new — buildInviteUrl helper
  mocks/
    authHome.mock.ts                # new — imports buildInviteUrl to construct mock InviteFriendsData
    mockDashboardData.ts            # existing, unchanged
```
