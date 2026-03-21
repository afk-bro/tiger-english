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

| Route | Layout | Auth required |
|---|---|---|
| `/` | Conditional (PublicLayout / AuthLayout) | No — renders based on session |
| `/dashboard` | AuthLayout | Yes |
| `/library` | AuthLayout | Yes |
| `/study-groups` | AuthLayout | Yes |
| `/notifications` | AuthLayout | Yes |
| `/flashcards` | AuthLayout | Yes |
| `/drag-drop` | AuthLayout | Yes |
| `/ad-libs` | AuthLayout | Yes |
| `/login`, `/register` | PublicLayout | No (redirects to `/` if session exists) |
| `/about`, `/contact` | PublicLayout | No |
| `/auth/callback` | None | No |
| `/u/:username` | PublicLayout | No (future public profile page) |

### Auth Guards

**`RequireAuth`:** Reads resolved session state from the store. Shows a spinner while `sessionLoading: true`. Redirects to `/login` if no session. Renders children when session exists.

**`RequireGuest`:** Reads session from the store. Redirects to `/` if session exists. Used on `/login` and `/register` to prevent authenticated users from accessing those pages.

### `/` Conditional Render

The root route consumes resolved session state from the store. If a session exists it renders `AuthHome`; if not it renders the public landing page (`Home`). No redirect. Same URL.

### Layout Split

**`PublicLayout`:**
- Sticky header with full nav (Flashcards, About, Contact)
- Login / Register buttons
- Footer

**`AuthLayout`:**
- Slimmer header: logo, dark mode toggle, language switcher, profile/user menu, mobile sidebar toggle button
- No footer
- Right-side collapsible `AppSidebar`
- Main content area adjusts width based on sidebar state

---

## 2. Auth & Session State

### Store Structure

Auth and profile concerns are explicitly separated into two slices:

**Auth slice** (`session`, `sessionLoading`):
- Source of truth for access control
- Owned entirely by `AppInitializer`
- `sessionLoading` starts `true`, set to `false` after initial resolution

**Profile slice** (`profile`, `profileLoading`, `error`):
- Enriches the UI with user data
- Never used for access gating
- Populated after session is confirmed

### `AppInitializer` (extended)

Existing component extended to own full session lifecycle:
1. Sets `sessionLoading: true` on mount
2. Calls `supabase.auth.getSession()` for initial hydration
3. Writes resolved session to auth slice, sets `sessionLoading: false`
4. Subscribes to `supabase.auth.onAuthStateChange()` for live updates
5. On session present: calls `fetchProfile()`
6. On session absent: clears profile

---

## 3. AppSidebar Component

### Component API

```
AppSidebar
  Desktop: collapsed: boolean, onToggleCollapsed: () => void
  Mobile:  isOpen: boolean, onClose: () => void
```

`collapsed` is the persisted desktop preference (read/written via `localStorage`, reflected in Zustand store).
`isOpen` is transient mobile-only state held in `AuthLayout` local state — never persisted.

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
- Icon only in collapsed mode, icon + label in expanded

### Nav Item Behaviour

- Uses React Router `NavLink` for active state detection (not manual `pathname` comparison)
- `end` prop applied to `/` only, to prevent it matching all routes
- `NavLink`'s `isActive` callback used for subroute support

### Active State

- **Expanded mode:** filled background + primary colour text
- **Collapsed mode:** filled background + primary colour icon + left/right border accent (unambiguous without a label)

### Collapsed Mode Tooltips

- MVP: `title` attribute on icon buttons
- Future upgrade path: Radix `Tooltip` component

### Sidebar Persistence

- **Desktop collapse preference:** persisted in `localStorage` key `sidebar_collapsed`
- Read on mount; defaults to `false` (expanded) if key absent or value invalid
- **Mobile drawer open state:** local component state in `AuthLayout` only — resets on every page load and route navigation — never persisted

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

Mobile: single column, stacked in display order.

`AuthHome` is layout-only — it composes the four card components and passes mock data. No logic lives in `AuthHome` itself.

### Card Components

#### `ContinueStudyingCard` (primary — visually dominant)

**Populated state:**
- Set title + language/theme tag
- "Reviewed X of Y cards" progress bar
- "Last studied X hours/days ago" relative timestamp
- Streak or accuracy badge (if data available)
- **Continue Studying** primary CTA → navigates to `/flashcards` with `{ state: { setId } }` as route state

**Empty state:** "Start your first set" CTA

---

#### `RecommendedNextCard`

**Populated state:**
- Up to 3 recommendation items
- Each item: set title + reason label
- Each item has a **Study** button
- Recommendation priority order (for real data): 1) weak cards needing review, 2) next set in sequence, 3) related theme

**Empty state:** "Complete a set to unlock recommendations"

---

#### `InviteFriendsCard`

**Actions:**
- **Copy Invite Link** (primary) — copies invite URL to clipboard, fires success toast via `sonner`
- **Invite a Friend** (secondary, optional) — stub for now
- Copy failure → error toast with fallback message
- Clipboard API unavailable → error toast with fallback message (intentional, not silent)
- Invite URL generated from a mock helper in `src/mocks/authHome.mock.ts`, ready to swap for real endpoint

---

#### `StudyGroupsCard`

**Populated state:**
- **Create Study Group** (primary button)
- **Invite to Group** (secondary, disabled if no groups exist)
- Pending invites badge count

**Empty state:** "No study groups yet" supporting text + prominent **Create Study Group** CTA (action always obvious)

---

### Card States (all four cards)

Each card handles three states:
1. **Skeleton** — pulsing placeholder matching card dimensions
2. **Empty** — icon + message + primary CTA
3. **Populated** — full content

---

## 5. Data Layer

### Types

Each card has a typed interface in a co-located `types.ts`:

```ts
ContinueStudyingData {
  setId: string
  title: string
  theme: string
  reviewedCount: number
  totalCards: number
  lastStudiedAt: string  // ISO timestamp
  streak?: number
  accuracy?: number
}

RecommendedItem {
  setId: string
  title: string
  reasonType: 'review' | 'sequence' | 'related'
  reasonLabel?: string  // display string; falls back to default per reasonType
  priority: number
}

InviteFriendsData {
  inviteUrl: string
}

StudyGroupsData {
  groups: StudyGroup[]
  pendingInviteCount: number
}
```

### Mock Data

`src/mocks/authHome.mock.ts` — exports typed mock objects for each card. Mirrors the existing `mockDashboardData` pattern. When real endpoints are ready, only the data-fetching layer changes.

---

## 6. Testing Plan

### `AppInitializer`
- Initializes with `sessionLoading: true`
- Calls `getSession()` on mount, resolves session, sets `sessionLoading: false`
- Subscribes to `onAuthStateChange`, updates session on auth change
- Guarded routes stop showing spinner after initialization

### `AppSidebar`
- Renders all 8 nav items
- Reads persisted `collapsed` state from `localStorage` on mount
- Defaults to expanded when `localStorage` key is absent
- Handles invalid stored value safely (falls back to default)
- Toggle writes new collapsed value to `localStorage`
- Active nav item receives `aria-current="page"`
- Collapsed mode: nav items have accessible `aria-label`
- Mobile drawer has `role="dialog"` and `aria-modal="true"` when open
- Focus returns to trigger button on drawer close

### `ContinueStudyingCard`
- Renders populated state correctly
- Renders empty state with CTA
- Renders skeleton state
- Continue Studying navigates to `/flashcards` with `{ state: { setId } }` payload

### `RecommendedNextCard`
- Renders up to 3 items in populated state
- Renders empty state

### `InviteFriendsCard`
- Calls `navigator.clipboard.writeText` with correct invite URL
- Fires success toast on copy
- Fires error toast on clipboard write failure
- Fires error toast when clipboard API unavailable

### `StudyGroupsCard`
- Empty state renders with Create Study Group CTA visible
- Pending invites badge renders correct count

### `RequireAuth`
- Shows spinner while `sessionLoading: true`
- Redirects to `/login` when no session
- Renders children when session present

### `RequireGuest`
- Redirects to `/` when session exists
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
      PublicLayout.tsx        # renamed from Layout.tsx
    sidebar/
      AppSidebar.tsx
      SidebarNavItem.tsx
      __tests__/
        AppSidebar.test.tsx
  pages/
    AuthHome.tsx
  features/
    auth/
      RequireAuth.tsx
      RequireGuest.tsx
  components/
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
  mocks/
    authHome.mock.ts
  stores/
    useUserStore.ts           # add sessionLoading, session to auth slice
```
