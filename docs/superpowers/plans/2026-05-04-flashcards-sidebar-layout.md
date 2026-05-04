# Sidebar on `/flashcards` for authenticated users — implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Authenticated users on `/flashcards` see `AppSidebar` instead of the public marketing header, while anonymous users keep the public layout for the preview path.

**Architecture:** Add a thin auth-aware route element `FlashcardsLayout` that picks `AuthLayout` or `PublicLayout` based on `useUserStore.session`, then reparent the `/flashcards` route under it. Extract `AppRoutes` from `App.tsx` so the route tree can be rendered through `MemoryRouter` for integration testing.

**Tech Stack:** React 19, React Router DOM v7, Zustand (`useUserStore`), Vitest + React Testing Library.

**Spec:** `docs/superpowers/specs/2026-05-04-flashcards-sidebar-layout-design.md`.

---

## File map

| File | Action | Why |
|---|---|---|
| `src/App.tsx` | Modify | Inline `FlashcardsLayout` (named export) + extract `AppRoutes` (named export) + reparent `/flashcards` route |
| `src/__tests__/FlashcardsLayout.test.tsx` | Create | Unit test for the conditional with mocked layouts |
| `src/__tests__/flashcardsRoute.test.tsx` | Create | Route-level integration test using `AppRoutes` + `MemoryRouter` with mocked layouts and mocked session |

No other files modified. `AuthLayout`, `PublicLayout`, `AppSidebar`, `useUserStore`, `FlashcardsPage` stay as-is.

---

## Task 1: `FlashcardsLayout` component + unit test (TDD)

**Files:**
- Create: `src/__tests__/FlashcardsLayout.test.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1.1: Write the failing unit test**

Create `src/__tests__/FlashcardsLayout.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { FlashcardsLayout } from '../App';
import { useUserStore } from '@/stores/useUserStore';

vi.mock('@/stores/useUserStore');

vi.mock('@/components/layout/AuthLayout', () => ({
  default: () => <div data-testid="mock-auth-layout">auth</div>,
}));

vi.mock('@/components/layout/PublicLayout', () => ({
  default: () => <div data-testid="mock-public-layout">public</div>,
}));

const setSession = (session: unknown) => {
  vi.mocked(useUserStore).mockImplementation((selector?: (s: { session: unknown }) => unknown) =>
    selector ? selector({ session }) : { session },
  );
};

describe('FlashcardsLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders PublicLayout when session is null', () => {
    setSession(null);
    const { getByTestId, queryByTestId } = render(<FlashcardsLayout />);
    expect(getByTestId('mock-public-layout')).toBeInTheDocument();
    expect(queryByTestId('mock-auth-layout')).not.toBeInTheDocument();
  });

  it('renders AuthLayout when session is truthy', () => {
    setSession({ user: { id: 'u-1' }, access_token: 'token' });
    const { getByTestId, queryByTestId } = render(<FlashcardsLayout />);
    expect(getByTestId('mock-auth-layout')).toBeInTheDocument();
    expect(queryByTestId('mock-public-layout')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 1.2: Run the test, verify it fails**

```bash
npm test -- --run src/__tests__/FlashcardsLayout.test.tsx
```

Expected: FAIL with `Module ... does not export 'FlashcardsLayout'` (or similar). The test imports a named export from `../App` that doesn't exist yet.

- [ ] **Step 1.3: Add `FlashcardsLayout` to `src/App.tsx`**

Open `src/App.tsx`. Two changes:

(a) Add an import at the top (after the existing imports):

```tsx
import { useUserStore } from '@/stores/useUserStore';
```

(b) Define and export `FlashcardsLayout` as a small inline component near the existing `StubPage` helper (around line 27). Add this just below `StubPage`:

```tsx
// Auth-aware layout for /flashcards: public marketing chrome for anon
// users, full app shell for authenticated users. The route stays
// publicly reachable; only the chrome flips. See spec at
// docs/superpowers/specs/2026-05-04-flashcards-sidebar-layout-design.md.
export function FlashcardsLayout() {
  const session = useUserStore((s) => s.session);
  return session ? <AuthLayout /> : <PublicLayout />;
}
```

`AuthLayout` and `PublicLayout` are already imported at the top of the file — no new imports beyond `useUserStore`.

- [ ] **Step 1.4: Run the test, verify it passes**

```bash
npm test -- --run src/__tests__/FlashcardsLayout.test.tsx
```

Expected: 2/2 pass.

- [ ] **Step 1.5: Run type-check**

```bash
npm run type-check
```

Expected: clean.

- [ ] **Step 1.6: Commit**

```bash
git add src/App.tsx src/__tests__/FlashcardsLayout.test.tsx
git commit -m "feat(app): add FlashcardsLayout auth-aware route element"
```

(`FlashcardsLayout` is exported but not yet wired into a route — that's Task 2. Type-check still passes because nothing imports it yet at runtime; the unit test consumes it.)

---

## Task 2: Reparent `/flashcards` route + extract `AppRoutes` + integration test (TDD)

**Files:**
- Modify: `src/App.tsx` (extract `AppRoutes`, reparent `/flashcards` route)
- Create: `src/__tests__/flashcardsRoute.test.tsx`

- [ ] **Step 2.1: Write the failing integration test**

Create `src/__tests__/flashcardsRoute.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../App';
import { useUserStore } from '@/stores/useUserStore';

vi.mock('@/stores/useUserStore');

// Mock the layouts so the test asserts which one mounts via the route
// tree, without rendering full chrome (sidebar contents, header, etc.).
vi.mock('@/components/layout/AuthLayout', () => ({
  default: () => <div data-testid="mock-auth-layout">auth-layout</div>,
}));

vi.mock('@/components/layout/PublicLayout', () => ({
  default: () => <div data-testid="mock-public-layout">public-layout</div>,
}));

const setSession = (session: unknown) => {
  vi.mocked(useUserStore).mockImplementation((selector?: (s: { session: unknown }) => unknown) =>
    selector ? selector({ session }) : { session },
  );
};

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );

describe('/flashcards route layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the authenticated chrome (AuthLayout) when session is truthy', async () => {
    setSession({ user: { id: 'u-1' }, access_token: 'token' });
    const { findByTestId, queryByTestId } = renderAt('/flashcards');
    expect(await findByTestId('mock-auth-layout')).toBeInTheDocument();
    expect(queryByTestId('mock-public-layout')).not.toBeInTheDocument();
  });

  it('renders the public chrome (PublicLayout) when session is null', async () => {
    setSession(null);
    const { findByTestId, queryByTestId } = renderAt('/flashcards');
    expect(await findByTestId('mock-public-layout')).toBeInTheDocument();
    expect(queryByTestId('mock-auth-layout')).not.toBeInTheDocument();
  });

  it('still renders PublicLayout for other public routes regardless of session (regression check on /about)', async () => {
    setSession({ user: { id: 'u-1' }, access_token: 'token' });
    const { findByTestId, queryByTestId } = renderAt('/about');
    // /about is inside the PublicLayout block; it should NOT pick up
    // the FlashcardsLayout's auth-aware behavior.
    expect(await findByTestId('mock-public-layout')).toBeInTheDocument();
    expect(queryByTestId('mock-auth-layout')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2.2: Run the test, verify it fails**

```bash
npm test -- --run src/__tests__/flashcardsRoute.test.tsx
```

Expected: FAIL with `Module ... does not export 'AppRoutes'` first (since `AppRoutes` is the next change). Once that's added in Step 2.3, the second failure mode would be the `/flashcards` test asserting `mock-auth-layout` but finding `mock-public-layout` (because the route is still under PublicLayout). After the route reparent in Step 2.4, all 3 tests pass.

For TDD discipline, run the test after Step 2.3 to confirm the first failure (route still wrong), then again after Step 2.4 (route fixed).

- [ ] **Step 2.3: Extract `AppRoutes` from `src/App.tsx`**

Currently `src/App.tsx` looks roughly:

```tsx
function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AppInitializer />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            ... all the routes ...
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
}
```

Pull the `<Suspense>` block out into a named export so tests can wrap it in `MemoryRouter` without `BrowserRouter` getting in the way:

```tsx
// Exported so route-level integration tests can render the route tree
// inside a MemoryRouter without needing the BrowserRouter shell.
export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        ... all the routes (existing block, no logic change here yet) ...
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AppInitializer />
        <AppRoutes />
      </Router>
    </ErrorBoundary>
  );
}
```

This is a pure refactor in this step — no route logic changes yet.

- [ ] **Step 2.4: Reparent the `/flashcards` route**

Inside `AppRoutes`, edit the `<Routes>` body:

(a) Remove the `/flashcards` line from the `<Route element={<PublicLayout />}>` block. Before:

```tsx
<Route element={<PublicLayout />}>
  <Route path="/" element={<Home />} />
  <Route path="/about" element={<About />} />
  <Route path="/contact" element={<Contact />} />
  <Route path="/flashcards" element={<FlashcardsPage />} />   {/* delete this line */}
  <Route path="/u/:username" element={<StubPage titleKey="common.stub.public_profile" />} />
  <Route path="/login" element={<RequireGuest><Login /></RequireGuest>} />
  <Route path="/register" element={<RequireGuest><Register /></RequireGuest>} />
</Route>
```

After:

```tsx
<Route element={<PublicLayout />}>
  <Route path="/" element={<Home />} />
  <Route path="/about" element={<About />} />
  <Route path="/contact" element={<Contact />} />
  <Route path="/u/:username" element={<StubPage titleKey="common.stub.public_profile" />} />
  <Route path="/login" element={<RequireGuest><Login /></RequireGuest>} />
  <Route path="/register" element={<RequireGuest><Register /></RequireGuest>} />
</Route>
```

(b) Add a new sibling block immediately after the `PublicLayout` block (before the `/auth/callback` route):

```tsx
{/* /flashcards: auth-aware chrome — sidebar when signed in, public layout otherwise */}
<Route path="/flashcards" element={<FlashcardsLayout />}>
  <Route index element={<FlashcardsPage />} />
</Route>
```

The `<Route index>` makes `<FlashcardsPage />` render at `/flashcards` itself (not at a sub-path).

- [ ] **Step 2.5: Run the integration test, verify all 3 pass**

```bash
npm test -- --run src/__tests__/flashcardsRoute.test.tsx
```

Expected: 3/3 pass.

- [ ] **Step 2.6: Run the full flashcards test slice as a regression check**

```bash
npm test -- --run src/__tests__ src/features/flashcards
```

Expected: green. Existing flashcards tests don't touch routing chrome, so no failures. Login.test, Register.test, AuthCallback.test, etc., still hit the same paths.

- [ ] **Step 2.7: Run type-check + lint**

```bash
npm run type-check
npm run lint
```

Expected: both clean.

- [ ] **Step 2.8: Commit**

```bash
git add src/App.tsx src/__tests__/flashcardsRoute.test.tsx
git commit -m "feat(app): reparent /flashcards under FlashcardsLayout"
```

---

## Task 3: Verify, push, open PR

This is the final task. The feature is fully implemented at this point.

- [ ] **Step 3.1: Run the full test suite**

```bash
npm test -- --run
```

Expected: all green. Frontend test count goes up by 5 (2 unit tests + 3 integration tests).

- [ ] **Step 3.2: Run type-check, lint, build**

```bash
npm run type-check
npm run lint
npm run build
```

Expected: all clean. The build's pre-existing chunk-size warning is unrelated and stays as-is.

- [ ] **Step 3.3: Manual smoke test**

In two terminals, run `npm run dev` and (if needed for unrelated paths) the backend. Then:

1. **Logged in, click `Flashcards` from sidebar** → land on `/flashcards`, sidebar still visible.
2. **Logged in, hard-reload `/flashcards`** → very brief PublicLayout flash (acceptable per spec), then sidebar appears.
3. **Logged out, navigate to `/flashcards`** → public `Header` visible, no sidebar.
4. **Logged out, click `Login`, log in** → routed to authenticated home; navigate to `/flashcards` from sidebar → sidebar visible (no flash on SPA navigation).

If any of these fail, debug — most likely cause is the route nesting being subtly off (e.g., forgetting `<Route index>` in 2.4(b)).

- [ ] **Step 3.4: Push the branch**

```bash
git push -u origin feat/flashcards-sidebar-layout
```

- [ ] **Step 3.5: Open the PR**

```bash
gh pr create --title "feat(app): show sidebar on /flashcards for authenticated users" --body "$(cat <<'EOF'
## Summary

Authenticated users on \`/flashcards\` now see the same \`AppSidebar\` chrome they have on every other in-app page. Anonymous users still get the public \`Header\` + \`Footer\` for the preview path. The fix is a small auth-aware route element (\`FlashcardsLayout\`) that picks the layout based on \`useUserStore.session\`, plus a route reparent so \`/flashcards\` no longer lives under \`PublicLayout\` unconditionally.

The sidebar already had a \`/flashcards\` link (\`AppSidebar.tsx:27\`); the destination just wasn't using sidebar chrome. Now it does.

Spec: \`docs/superpowers/specs/2026-05-04-flashcards-sidebar-layout-design.md\`
Plan: \`docs/superpowers/plans/2026-05-04-flashcards-sidebar-layout.md\`

## Architecture

- New \`FlashcardsLayout\` (named export from \`src/App.tsx\`, ~6 lines): \`session ? <AuthLayout /> : <PublicLayout />\`.
- Extracted \`AppRoutes\` from \`App\` so the route tree can be rendered through \`MemoryRouter\` for integration testing without the production \`BrowserRouter\` shell.
- Reparented \`/flashcards\` from a child of \`<PublicLayout />\` to a child of \`<FlashcardsLayout />\` with \`<Route index>\` rendering \`<FlashcardsPage />\`.

## Trade-off accepted

A logged-in user cold-reloading \`/flashcards\` sees ~100-300ms of PublicLayout chrome before \`supabase.auth.getSession()\` resolves and the layout flips to AuthLayout. Content underneath isn't replaced. Spec discusses why we accept this rather than block on a loading spinner.

## Routes explicitly NOT touched

- \`/auth/callback\` is a top-level sibling route with no layout wrapper at all in \`App.tsx\`. This change does not affect the OAuth callback flow.
- All other \`PublicLayout\`-wrapped routes (\`/\`, \`/about\`, \`/contact\`, \`/login\`, \`/register\`, \`/u/:username\`) keep their public chrome regardless of auth state.
- All \`RequireAuth\` + \`AuthLayout\` routes are untouched.

## Test plan
- [x] \`npm test\` — all green; +2 unit tests for \`FlashcardsLayout\`, +3 integration tests for the route layout
- [x] \`npm run type-check\` — clean
- [x] \`npm run lint\` — clean
- [x] \`npm run build\` — succeeds
- [ ] **Manual: logged-in user clicks Flashcards in sidebar — sidebar stays on the destination**
- [ ] **Manual: logged-in user hard-reloads /flashcards — sidebar appears after the brief auth-hydration window**
- [ ] **Manual: anonymous user on /flashcards — public Header + Footer, no sidebar**

## Out of scope

- Eliminating the chrome-flash on cold reload (would need a synchronous auth state read; cross-cuts other layouts).
- Other UX gaps from \`project_pending_ux_followups.md\` like the missing "next lesson" CTA after section completion.
EOF
)"
```

Expected: PR opened against \`main\`.

---

## Self-review notes

**Spec coverage:**
- Goal #1 (auth users see sidebar) → Task 2.4 reparent + integration test 1.
- Goal #2 (anon users keep PublicLayout) → integration test 2.
- Goal #3 (surgical, only \`/flashcards\` affected) → integration test 3 (\`/about\` regression check).
- Architecture (\`FlashcardsLayout\` component, route reparent) → Task 1 + Task 2.4.
- Components section (component + route changes only, no other files touched) → file map at top of plan.
- Testing section (unit + integration with mocked layouts and mocked session) → Tasks 1 + 2 each include their respective tests.
- "Routes explicitly NOT touched" → integration test 3 covers \`/about\` as a sentinel; the PR description re-states the explicit list for reviewer clarity.
- Acceptance criteria → Step 3.3 manual smoke covers all four bullets; Step 3.1 + 3.2 cover the test/lint/build bullet.

**Type/identifier consistency:**
- \`FlashcardsLayout\` is the exact name used across the test, the App.tsx export, and the route element prop.
- \`AppRoutes\` is the exact name used in the integration test and the App.tsx export.
- \`useUserStore\` is imported with the same path (\`@/stores/useUserStore\`) in tests and in the new App.tsx code.
- The \`session\` selector signature in the unit test matches the one in the component (\`(s) => s.session\`).

**Commit cadence:**
- 3 task-level commits: \`FlashcardsLayout\` + unit test (Task 1), route reparent + integration test (Task 2), then push + PR (Task 3 has no commit; just verification + push). Plus the existing spec commit \`d15bb2f\` and review-update commit \`b3bac14\` already on the branch.
