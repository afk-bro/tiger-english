# Authenticated Home Experience Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the public landing page with a personalised learning hub for authenticated users, add a persistent collapsible sidebar across all authenticated routes, and introduce proper session-based auth guards throughout the app.

**Architecture:** A new `AuthLayout` wraps all authenticated routes and renders an `AppSidebar`. Session state is resolved once in `AppInitializer` and written to `useUserStore`; all auth guards read this resolved state. The root `/` route renders `AuthHome` or the public `Home` based on session presence without redirecting.

**Tech Stack:** React 19, TypeScript, Vite, React Router v7, Zustand, Tailwind CSS, lucide-react, sonner, Supabase JS v2, Vitest, React Testing Library

---

## File Map

| File | Action | Purpose |
|---|---|---|
| `src/stores/useUserStore.ts` | Modify | Add `session`/`sessionLoading`/`setSession`/`setSessionLoading`; rename `loading` → `profileLoading` |
| `src/stores/__tests__/useUserStore.test.ts` | Modify | Update field names after rename |
| `src/stores/useSidebarStore.ts` | Create | Desktop collapse preference persisted in localStorage |
| `src/stores/__tests__/useSidebarStore.test.ts` | Create | Store behaviour tests |
| `src/components/AppInitializer.tsx` | Modify | Own full session lifecycle; deduplicate INITIAL_SESSION |
| `src/components/__tests__/AppInitializer.test.tsx` | Create | Session hydration tests |
| `src/features/auth/RequireAuth.tsx` | Create | Session-based route guard |
| `src/features/auth/RequireGuest.tsx` | Create | Inverse guard for /login and /register |
| `src/features/auth/__tests__/RequireAuth.test.tsx` | Create | Guard tests |
| `src/features/auth/__tests__/RequireGuest.test.tsx` | Create | Guard tests |
| `src/features/dashboard/useDashboard.ts` | Modify | `loading` → `profileLoading` |
| `src/routes/UserLayout.tsx` | Modify | `loading` → `profileLoading` (kept until routing task retires it) |
| `src/components/Layout.tsx` | Rename→ `PublicLayout.tsx` | Rename only; no logic changes |
| `src/components/layout/AuthLayout.tsx` | Create | Authenticated shell with sidebar + slim header |
| `src/components/sidebar/SidebarNavItem.tsx` | Create | Single nav item with NavLink, active state, aria |
| `src/components/sidebar/AppSidebar.tsx` | Create | Full sidebar with 3 zones, collapse, mobile drawer |
| `src/components/sidebar/__tests__/AppSidebar.test.tsx` | Create | Sidebar behaviour tests |
| `src/lib/invite.ts` | Create | `buildInviteUrl` pure helper |
| `src/components/home/authenticated/types.ts` | Create | Shared data interfaces for auth home cards |
| `src/mocks/authHome.mock.ts` | Create | Typed mock data for all four cards |
| `src/components/home/authenticated/ContinueStudyingCard.tsx` | Create | Last studied set card |
| `src/components/home/authenticated/RecommendedNextCard.tsx` | Create | Recommended next card |
| `src/components/home/authenticated/InviteFriendsCard.tsx` | Create | Invite link card |
| `src/components/home/authenticated/StudyGroupsCard.tsx` | Create | Study groups card |
| `src/components/home/authenticated/__tests__/ContinueStudyingCard.test.tsx` | Create | Card tests |
| `src/components/home/authenticated/__tests__/RecommendedNextCard.test.tsx` | Create | Card tests |
| `src/components/home/authenticated/__tests__/InviteFriendsCard.test.tsx` | Create | Card tests |
| `src/components/home/authenticated/__tests__/StudyGroupsCard.test.tsx` | Create | Card tests |
| `src/pages/AuthHome.tsx` | Create | Layout composition for auth home |
| `src/App.tsx` | Modify | Rewire all routes; add new flat authenticated routes |
| `src/pages/Home.tsx` | Modify | Conditional render based on session |

---

## Task 1: Extend useUserStore — add session fields, rename `loading` → `profileLoading`

**Files:**
- Modify: `src/stores/useUserStore.ts`
- Modify: `src/stores/__tests__/useUserStore.test.ts`
- Modify: `src/features/dashboard/useDashboard.ts`
- Modify: `src/routes/UserLayout.tsx`

- [ ] **Step 1: Update the store test file first (it uses `loading` directly in `setState`)**

Open `src/stores/__tests__/useUserStore.test.ts`. Find `useUserStore.setState({ profile: null, loading: false, error: null })` and the assertion `expect(state.loading).toBe(false)`. Update to `profileLoading`:

```ts
// beforeEach
useUserStore.setState({ profile: null, profileLoading: false, error: null });

// assertion in both test cases
expect(state.profileLoading).toBe(false);
```

- [ ] **Step 2: Run existing store tests to confirm they fail (field name not updated yet)**

```bash
npm test -- src/stores/__tests__/useUserStore.test.ts
```
Expected: FAIL — `profileLoading` does not exist yet.

- [ ] **Step 3: Update `useUserStore.ts`**

Replace the entire file:

```ts
// src/stores/useUserStore.ts
import { create } from "zustand";
import { supabase } from "@/lib/supabase";
import type { Session } from "@supabase/supabase-js";

type UserProfile = {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  username: string;
};

type UserStore = {
  // Auth slice
  session: Session | null;
  sessionLoading: boolean;
  setSession: (session: Session | null) => void;
  setSessionLoading: (loading: boolean) => void;
  // Profile slice
  profile: UserProfile | null;
  profileLoading: boolean;
  error: string | null;
  fetchProfile: () => Promise<void>;
  clearProfile: () => void;
};

export const useUserStore = create<UserStore>((set) => ({
  // Auth slice
  session: null,
  sessionLoading: true,
  setSession: (session) => set({ session }),
  setSessionLoading: (sessionLoading) => set({ sessionLoading }),

  // Profile slice
  profile: null,
  profileLoading: true,
  error: null,

  fetchProfile: async () => {
    set({ profileLoading: true, error: null });
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      set({ profile: null, profileLoading: false });
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select("id, first_name, last_name, email, username")
      .eq("id", session.user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        set({ profile: null, error: null, profileLoading: false });
      } else {
        set({ error: error.message, profile: null, profileLoading: false });
      }
    } else {
      set({
        profile: {
          id: data.id,
          email: data.email,
          first_name: data.first_name,
          last_name: data.last_name,
          username: data.username,
        },
        error: null,
        profileLoading: false,
      });
    }
  },

  clearProfile: () => set({ profile: null, error: null, profileLoading: false }),
}));
```

- [ ] **Step 4: Run store tests — should pass now**

```bash
npm test -- src/stores/__tests__/useUserStore.test.ts
```
Expected: PASS (2 tests)

- [ ] **Step 5: Update `useDashboard.ts` — rename `loading` → `profileLoading`**

```ts
// src/features/dashboard/useDashboard.ts
export function useDashboard() {
  const { profile, profileLoading, clearProfile } = useUserStore();
  // ...
  useEffect(() => {
    if (!profileLoading && !profile) {
      navigate("/login");
    }
  }, [profileLoading, profile, navigate]);
  // ...
  return { handleLogout, loading: profileLoading, profile };
  // Note: return key stays as `loading` to preserve Dashboard.tsx API
}
```

- [ ] **Step 6: Update `UserLayout.tsx` — rename `loading` → `profileLoading`**

```ts
const { profile, profileLoading, fetchProfile } = useUserStore();

useEffect(() => {
  if (!profile && !profileLoading) {
    fetchProfile();
  }
}, [profile, profileLoading, fetchProfile]);

if (profileLoading) return <div>Loading...</div>;
```

- [ ] **Step 7: Run full test suite to check nothing is broken**

```bash
npm test
```
Expected: all existing tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/stores/useUserStore.ts src/stores/__tests__/useUserStore.test.ts \
  src/features/dashboard/useDashboard.ts src/routes/UserLayout.tsx
git commit -m "feat(store): add session slice to useUserStore; rename loading to profileLoading"
```

---

## Task 2: Extend AppInitializer — own full session lifecycle

**Files:**
- Modify: `src/components/AppInitializer.tsx`
- Create: `src/components/__tests__/AppInitializer.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/__tests__/AppInitializer.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';

const { mockGetSession, mockOnAuthStateChange, mockSetSession, mockSetSessionLoading, mockFetchProfile, mockClearProfile } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockOnAuthStateChange: vi.fn(),
  mockSetSession: vi.fn(),
  mockSetSessionLoading: vi.fn(),
  mockFetchProfile: vi.fn(),
  mockClearProfile: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
    },
  },
}));

const mockUseUserStore = vi.fn();
vi.mock('@/stores/useUserStore', () => ({
  useUserStore: (selector: (s: unknown) => unknown) => mockUseUserStore(selector),
}));

import AppInitializer from '../AppInitializer';

function setup() {
  mockUseUserStore.mockImplementation((selector: (s: unknown) => unknown) =>
    selector({
      setSession: mockSetSession,
      setSessionLoading: mockSetSessionLoading,
      fetchProfile: mockFetchProfile,
      clearProfile: mockClearProfile,
    })
  );
  mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
}

beforeEach(() => {
  vi.clearAllMocks();
  setup();
});

describe('AppInitializer', () => {
  it('calls setSessionLoading(false) after getSession resolves', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: '1' } } } });

    await act(async () => {
      render(<AppInitializer />);
    });

    expect(mockSetSessionLoading).toHaveBeenCalledWith(false);
  });

  it('calls setSession with the resolved session on mount', async () => {
    const session = { user: { id: '1' } };
    mockGetSession.mockResolvedValue({ data: { session } });

    await act(async () => {
      render(<AppInitializer />);
    });

    expect(mockSetSession).toHaveBeenCalledWith(session);
  });

  it('calls fetchProfile when session exists on mount', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: '1' } } } });

    await act(async () => {
      render(<AppInitializer />);
    });

    expect(mockFetchProfile).toHaveBeenCalledTimes(1);
  });

  it('does not call fetchProfile when no session on mount', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    await act(async () => {
      render(<AppInitializer />);
    });

    expect(mockFetchProfile).not.toHaveBeenCalled();
  });

  it('skips INITIAL_SESSION from onAuthStateChange to avoid double-firing', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    let capturedCallback: ((event: string, session: unknown) => void) | null = null;
    mockOnAuthStateChange.mockImplementation((cb) => {
      capturedCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    await act(async () => {
      render(<AppInitializer />);
      capturedCallback?.('INITIAL_SESSION', { user: { id: '1' } });
    });

    // fetchProfile must NOT have been called from INITIAL_SESSION event
    expect(mockFetchProfile).not.toHaveBeenCalled();
  });

  it('calls fetchProfile on SIGNED_IN event from onAuthStateChange', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    let capturedCallback: ((event: string, session: unknown) => void) | null = null;
    mockOnAuthStateChange.mockImplementation((cb) => {
      capturedCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    await act(async () => {
      render(<AppInitializer />);
    });

    await act(async () => {
      capturedCallback?.('SIGNED_IN', { user: { id: '1' } });
    });

    expect(mockFetchProfile).toHaveBeenCalledTimes(1);
  });

  it('calls clearProfile on SIGNED_OUT event', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    let capturedCallback: ((event: string, session: unknown) => void) | null = null;
    mockOnAuthStateChange.mockImplementation((cb) => {
      capturedCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    await act(async () => {
      render(<AppInitializer />);
    });

    await act(async () => {
      capturedCallback?.('SIGNED_OUT', null);
    });

    expect(mockClearProfile).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- src/components/__tests__/AppInitializer.test.tsx
```
Expected: FAIL

- [ ] **Step 3: Rewrite `AppInitializer.tsx`**

```tsx
// src/components/AppInitializer.tsx
import { useEffect } from "react";
import { useUserStore } from "@/stores/useUserStore";
import { supabase } from "@/lib/supabase";

export default function AppInitializer() {
  const setSession = useUserStore((s) => s.setSession);
  const setSessionLoading = useUserStore((s) => s.setSessionLoading);
  const fetchProfile = useUserStore((s) => s.fetchProfile);
  const clearProfile = useUserStore((s) => s.clearProfile);

  useEffect(() => {
    // Subscribe first — skip INITIAL_SESSION to avoid double-firing with getSession()
    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') return;
      setSession(session);
      if (session) {
        fetchProfile();
      } else {
        clearProfile();
      }
    });

    // Initial hydration — getSession() is the single source of truth on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSessionLoading(false);
      if (session) {
        fetchProfile();
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [setSession, setSessionLoading, fetchProfile, clearProfile]);

  return null;
}
```

- [ ] **Step 4: Run AppInitializer tests — should pass**

```bash
npm test -- src/components/__tests__/AppInitializer.test.tsx
```
Expected: PASS (7 tests)

- [ ] **Step 5: Run full suite**

```bash
npm test
```
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/AppInitializer.tsx src/components/__tests__/AppInitializer.test.tsx
git commit -m "feat(auth): extend AppInitializer to own session lifecycle with deduplication"
```

---

## Task 3: Create useSidebarStore

**Files:**
- Create: `src/stores/useSidebarStore.ts`
- Create: `src/stores/__tests__/useSidebarStore.test.ts`

- [ ] **Step 1: Write failing tests**

Create `src/stores/__tests__/useSidebarStore.test.ts`:

```ts
import { describe, it, expect, beforeEach, vi } from 'vitest';

const mockGetItem = vi.fn();
const mockSetItem = vi.fn();

vi.stubGlobal('localStorage', {
  getItem: mockGetItem,
  setItem: mockSetItem,
});

// Re-import fresh store instance each test via resetModules
beforeEach(() => {
  vi.clearAllMocks();
  vi.resetModules();
});

describe('useSidebarStore', () => {
  it('defaults to collapsed: false when localStorage key is absent', async () => {
    mockGetItem.mockReturnValue(null);
    const { useSidebarStore } = await import('../useSidebarStore');
    expect(useSidebarStore.getState().collapsed).toBe(false);
  });

  it('reads persisted collapsed: true from localStorage on init', async () => {
    mockGetItem.mockReturnValue('true');
    const { useSidebarStore } = await import('../useSidebarStore');
    expect(useSidebarStore.getState().collapsed).toBe(true);
  });

  it('reads persisted collapsed: false from localStorage on init', async () => {
    mockGetItem.mockReturnValue('false');
    const { useSidebarStore } = await import('../useSidebarStore');
    expect(useSidebarStore.getState().collapsed).toBe(false);
  });

  it('defaults to false when localStorage value is invalid', async () => {
    mockGetItem.mockReturnValue('not-a-boolean');
    const { useSidebarStore } = await import('../useSidebarStore');
    expect(useSidebarStore.getState().collapsed).toBe(false);
  });

  it('toggleCollapsed flips collapsed and writes to localStorage', async () => {
    mockGetItem.mockReturnValue('false');
    const { useSidebarStore } = await import('../useSidebarStore');
    useSidebarStore.getState().toggleCollapsed();
    expect(useSidebarStore.getState().collapsed).toBe(true);
    expect(mockSetItem).toHaveBeenCalledWith('sidebar_collapsed', 'true');
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm test -- src/stores/__tests__/useSidebarStore.test.ts
```
Expected: FAIL — module not found.

- [ ] **Step 3: Create `src/stores/useSidebarStore.ts`**

```ts
// src/stores/useSidebarStore.ts
import { create } from "zustand";

const LS_KEY = "sidebar_collapsed";

function readPersistedCollapsed(): boolean {
  try {
    const value = localStorage.getItem(LS_KEY);
    if (value === 'true') return true;
    if (value === 'false') return false;
    return false; // absent or invalid
  } catch {
    return false;
  }
}

type SidebarStore = {
  collapsed: boolean;
  toggleCollapsed: () => void;
};

export const useSidebarStore = create<SidebarStore>((set, get) => ({
  collapsed: readPersistedCollapsed(),
  toggleCollapsed: () => {
    const next = !get().collapsed;
    set({ collapsed: next });
    try {
      localStorage.setItem(LS_KEY, String(next));
    } catch {
      // ignore storage errors
    }
  },
}));
```

- [ ] **Step 4: Run tests — should pass**

```bash
npm test -- src/stores/__tests__/useSidebarStore.test.ts
```
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/stores/useSidebarStore.ts src/stores/__tests__/useSidebarStore.test.ts
git commit -m "feat(store): add useSidebarStore with localStorage persistence"
```

---

## Task 4: Create RequireAuth and RequireGuest

**Files:**
- Create: `src/features/auth/RequireAuth.tsx`
- Create: `src/features/auth/RequireGuest.tsx`
- Create: `src/features/auth/__tests__/RequireAuth.test.tsx`
- Create: `src/features/auth/__tests__/RequireGuest.test.tsx`

- [ ] **Step 1: Write failing RequireAuth tests**

Create `src/features/auth/__tests__/RequireAuth.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate, Navigate: ({ to }: { to: string }) => <div>redirect:{to}</div> };
});

const mockUseUserStore = vi.fn();
vi.mock('@/stores/useUserStore', () => ({
  useUserStore: (selector: (s: unknown) => unknown) => mockUseUserStore(selector),
}));

import RequireAuth from '../RequireAuth';

function renderGuard() {
  return render(
    <MemoryRouter>
      <RequireAuth><div>protected content</div></RequireAuth>
    </MemoryRouter>
  );
}

describe('RequireAuth', () => {
  it('shows spinner while sessionLoading is true', () => {
    mockUseUserStore.mockImplementation((sel: (s: unknown) => unknown) =>
      sel({ session: null, sessionLoading: true })
    );
    renderGuard();
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
  });

  it('redirects to /login when session is null and not loading', () => {
    mockUseUserStore.mockImplementation((sel: (s: unknown) => unknown) =>
      sel({ session: null, sessionLoading: false })
    );
    renderGuard();
    expect(screen.getByText('redirect:/login')).toBeInTheDocument();
  });

  it('renders children when session exists', () => {
    mockUseUserStore.mockImplementation((sel: (s: unknown) => unknown) =>
      sel({ session: { user: { id: '1' } }, sessionLoading: false })
    );
    renderGuard();
    expect(screen.getByText('protected content')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Write failing RequireGuest tests**

Create `src/features/auth/__tests__/RequireGuest.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, Navigate: ({ to }: { to: string }) => <div>redirect:{to}</div> };
});

const mockUseUserStore = vi.fn();
vi.mock('@/stores/useUserStore', () => ({
  useUserStore: (selector: (s: unknown) => unknown) => mockUseUserStore(selector),
}));

import RequireGuest from '../RequireGuest';

function renderGuard() {
  return render(
    <MemoryRouter>
      <RequireGuest><div>guest content</div></RequireGuest>
    </MemoryRouter>
  );
}

describe('RequireGuest', () => {
  it('shows spinner while sessionLoading is true', () => {
    mockUseUserStore.mockImplementation((sel: (s: unknown) => unknown) =>
      sel({ session: null, sessionLoading: true })
    );
    renderGuard();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('redirects to / when session exists', () => {
    mockUseUserStore.mockImplementation((sel: (s: unknown) => unknown) =>
      sel({ session: { user: { id: '1' } }, sessionLoading: false })
    );
    renderGuard();
    expect(screen.getByText('redirect:/')).toBeInTheDocument();
  });

  it('renders children when no session', () => {
    mockUseUserStore.mockImplementation((sel: (s: unknown) => unknown) =>
      sel({ session: null, sessionLoading: false })
    );
    renderGuard();
    expect(screen.getByText('guest content')).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run both test files to confirm failure**

```bash
npm test -- src/features/auth/__tests__/RequireAuth.test.tsx
npm test -- src/features/auth/__tests__/RequireGuest.test.tsx
```
Expected: FAIL — modules not found.

- [ ] **Step 4: Create `RequireAuth.tsx`**

```tsx
// src/features/auth/RequireAuth.tsx
import { Navigate } from "react-router-dom";
import { useUserStore } from "@/stores/useUserStore";
import type { ReactNode } from "react";

export default function RequireAuth({ children }: { children: ReactNode }) {
  const session = useUserStore((s) => s.session);
  const sessionLoading = useUserStore((s) => s.sessionLoading);

  if (sessionLoading) {
    return (
      <div role="status" className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace />;

  return <>{children}</>;
}
```

- [ ] **Step 5: Create `RequireGuest.tsx`**

```tsx
// src/features/auth/RequireGuest.tsx
import { Navigate } from "react-router-dom";
import { useUserStore } from "@/stores/useUserStore";
import type { ReactNode } from "react";

export default function RequireGuest({ children }: { children: ReactNode }) {
  const session = useUserStore((s) => s.session);
  const sessionLoading = useUserStore((s) => s.sessionLoading);

  if (sessionLoading) {
    return (
      <div role="status" className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (session) return <Navigate to="/" replace />;

  return <>{children}</>;
}
```

- [ ] **Step 6: Run guard tests — should pass**

```bash
npm test -- src/features/auth/__tests__/
```
Expected: PASS (6 tests)

- [ ] **Step 7: Commit**

```bash
git add src/features/auth/RequireAuth.tsx src/features/auth/RequireGuest.tsx \
  src/features/auth/__tests__/RequireAuth.test.tsx src/features/auth/__tests__/RequireGuest.test.tsx
git commit -m "feat(auth): add RequireAuth and RequireGuest session-based route guards"
```

---

## Task 5: Rename Layout → PublicLayout

**Files:**
- Rename: `src/components/Layout.tsx` → `src/components/layout/PublicLayout.tsx`
- Modify: `src/App.tsx` (import path only)

- [ ] **Step 1: Create `src/components/layout/` directory and move the file**

```bash
mkdir -p src/components/layout
mv src/components/Layout.tsx src/components/layout/PublicLayout.tsx
```

- [ ] **Step 2: Update the component name in the file**

Open `src/components/layout/PublicLayout.tsx`. Change the function name from `Layout` to `PublicLayout` and the export:

```tsx
export default function PublicLayout({ children }: { children: ReactNode }) {
```

- [ ] **Step 3: Update import in `App.tsx`**

```tsx
// old
import Layout from "./components/Layout";
// new
import PublicLayout from "./components/layout/PublicLayout";
```

And in the JSX, replace `<Layout>` with `<PublicLayout>` (and `</Layout>` with `</PublicLayout>`).

- [ ] **Step 4: Run full test suite to verify nothing broke**

```bash
npm test
```
Expected: all pass.

- [ ] **Step 5: Commit**

```bash
git add src/components/layout/PublicLayout.tsx src/App.tsx
git rm src/components/Layout.tsx 2>/dev/null || true
git commit -m "refactor(layout): rename Layout to PublicLayout, move to layout/ folder"
```

---

## Task 6: Create SidebarNavItem and AppSidebar

**Files:**
- Create: `src/components/sidebar/SidebarNavItem.tsx`
- Create: `src/components/sidebar/AppSidebar.tsx`
- Create: `src/components/sidebar/__tests__/AppSidebar.test.tsx`

- [ ] **Step 1: Write failing AppSidebar tests**

Create `src/components/sidebar/__tests__/AppSidebar.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    NavLink: ({ to, children, 'aria-label': ariaLabel, end: _end, ...props }: {
      to: string; children: React.ReactNode; 'aria-label'?: string; end?: boolean;
    }) => (
      <a href={to} aria-label={ariaLabel} aria-current={to === '/' ? undefined : undefined} {...props}>
        {children}
      </a>
    ),
  };
});

import AppSidebar from '../AppSidebar';

function renderSidebar(props = {}) {
  return render(
    <MemoryRouter>
      <AppSidebar
        collapsed={false}
        onToggleCollapsed={vi.fn()}
        isOpen={false}
        onClose={vi.fn()}
        {...props}
      />
    </MemoryRouter>
  );
}

describe('AppSidebar', () => {
  it('renders all 8 nav items', () => {
    renderSidebar();
    const navLabels = ['Home', 'Dashboard', 'Library', 'Study Groups', 'Notifications', 'Flashcards', 'Drag & Drop', 'Ad Libs'];
    for (const label of navLabels) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('shows labels in expanded mode', () => {
    renderSidebar({ collapsed: false });
    expect(screen.getByText('Dashboard')).toBeVisible();
  });

  it('hides labels in collapsed mode and exposes aria-label on nav items', () => {
    renderSidebar({ collapsed: true });
    // Labels are visually hidden; aria-labels present
    expect(screen.getByLabelText('Dashboard')).toBeInTheDocument();
  });

  it('calls onToggleCollapsed when toggle button is clicked', () => {
    const onToggle = vi.fn();
    renderSidebar({ onToggleCollapsed: onToggle });
    fireEvent.click(screen.getByRole('button', { name: /collapse|expand/i }));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('mobile drawer has role=dialog and aria-modal=true when open', () => {
    renderSidebar({ isOpen: true });
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('calls onClose when overlay is clicked in mobile mode', () => {
    const onClose = vi.fn();
    renderSidebar({ isOpen: true, onClose });
    fireEvent.click(screen.getByTestId('sidebar-overlay'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm test -- src/components/sidebar/__tests__/AppSidebar.test.tsx
```
Expected: FAIL

- [ ] **Step 3: Create `SidebarNavItem.tsx`**

```tsx
// src/components/sidebar/SidebarNavItem.tsx
import { NavLink } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

interface SidebarNavItemProps {
  to: string;
  label: string;
  icon: LucideIcon;
  collapsed: boolean;
  end?: boolean;
}

export default function SidebarNavItem({ to, label, icon: Icon, collapsed, end = false }: SidebarNavItemProps) {
  return (
    <NavLink
      to={to}
      end={end}
      aria-label={collapsed ? label : undefined}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        [
          "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
          isActive
            ? collapsed
              ? "bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 border-r-2 border-primary-500"
              : "bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400"
            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800",
        ].join(" ")
      }
      aria-current={undefined} // NavLink handles this internally via className isActive
    >
      {({ isActive }) => (
        <>
          <Icon
            className={["w-5 h-5 flex-shrink-0", isActive ? "text-primary-600 dark:text-primary-400" : ""].join(" ")}
          />
          {!collapsed && <span>{label}</span>}
        </>
      )}
    </NavLink>
  );
}
```

- [ ] **Step 4: Create `AppSidebar.tsx`**

```tsx
// src/components/sidebar/AppSidebar.tsx
import { useRef, useEffect } from "react";
import {
  Home, LayoutDashboard, BookOpen, Users, Bell,
  Layers, MousePointer2, FileText,
  Settings, HelpCircle, User, LogOut,
  ChevronLeft, ChevronRight, X,
} from "lucide-react";
import SidebarNavItem from "./SidebarNavItem";
import Logo from "@/assets/TE-logo.png";

interface AppSidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { to: "/",              label: "Home",         icon: Home,           end: true },
  { to: "/dashboard",     label: "Dashboard",    icon: LayoutDashboard },
  { to: "/library",       label: "Library",      icon: BookOpen },
  { to: "/study-groups",  label: "Study Groups", icon: Users },
  { to: "/notifications", label: "Notifications",icon: Bell },
  { to: "/flashcards",    label: "Flashcards",   icon: Layers },
  { to: "/drag-drop",     label: "Drag & Drop",  icon: MousePointer2 },
  { to: "/ad-libs",       label: "Ad Libs",      icon: FileText },
] as const;

const UTILITY_ITEMS = [
  { label: "Settings",  icon: Settings },
  { label: "Help",      icon: HelpCircle },
  { label: "Profile",   icon: User },
  { label: "Logout",    icon: LogOut },
] as const;

export default function AppSidebar({ collapsed, onToggleCollapsed, isOpen, onClose }: AppSidebarProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Return focus to close button on drawer close (mobile)
  const prevIsOpen = useRef(isOpen);
  useEffect(() => {
    if (prevIsOpen.current && !isOpen) {
      closeButtonRef.current?.focus();
    }
    prevIsOpen.current = isOpen;
  }, [isOpen]);

  const sidebarContent = (
    <div
      className={[
        "flex flex-col h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700",
        "transition-[width] duration-150 ease-in-out",
        collapsed ? "w-16" : "w-60",
      ].join(" ")}
    >
      {/* Top zone */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 min-w-0">
          <img src={Logo} alt="Tiger English" className="w-8 h-8 flex-shrink-0" />
          {!collapsed && (
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
              Tiger English
            </span>
          )}
        </div>
        <button
          onClick={onToggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 flex-shrink-0"
        >
          {collapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav zone */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {NAV_ITEMS.map((item) => (
          <SidebarNavItem
            key={item.to}
            to={item.to}
            label={item.label}
            icon={item.icon}
            collapsed={collapsed}
            end={'end' in item ? item.end : false}
          />
        ))}
      </nav>

      {/* Bottom utility zone */}
      <div className="px-2 py-3 border-t border-gray-200 dark:border-gray-700 space-y-1">
        {UTILITY_ITEMS.map((item) => (
          <button
            key={item.label}
            aria-label={collapsed ? item.label : undefined}
            title={collapsed ? item.label : undefined}
            disabled
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-400 dark:text-gray-600 cursor-not-allowed"
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </div>
    </div>
  );

  // Desktop: inline panel
  const desktopPanel = (
    <div className="hidden md:flex h-full">
      {sidebarContent}
    </div>
  );

  // Mobile: off-canvas overlay drawer
  const mobileDrawer = (
    <div className="md:hidden">
      {isOpen && (
        <>
          <div
            data-testid="sidebar-overlay"
            className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-200"
            onClick={onClose}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="fixed right-0 top-0 h-full z-50 transition-transform duration-200"
          >
            <div className="flex items-start">
              <button
                ref={closeButtonRef}
                onClick={onClose}
                aria-label="Close navigation"
                className="m-2 p-2 rounded-full bg-white dark:bg-gray-800 shadow"
              >
                <X className="w-4 h-4" />
              </button>
              {sidebarContent}
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      {desktopPanel}
      {mobileDrawer}
    </>
  );
}
```

- [ ] **Step 5: Run sidebar tests**

```bash
npm test -- src/components/sidebar/__tests__/AppSidebar.test.tsx
```
Expected: PASS (6 tests)

- [ ] **Step 6: Commit**

```bash
git add src/components/sidebar/SidebarNavItem.tsx src/components/sidebar/AppSidebar.tsx \
  src/components/sidebar/__tests__/AppSidebar.test.tsx
git commit -m "feat(sidebar): add AppSidebar with collapsible desktop panel and mobile drawer"
```

---

## Task 7: Create AuthLayout

**Files:**
- Create: `src/components/layout/AuthLayout.tsx`

No dedicated tests — AuthLayout is a thin shell; its children (AppSidebar) are tested separately.

- [ ] **Step 1: Create `AuthLayout.tsx`**

```tsx
// src/components/layout/AuthLayout.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { useSidebarStore } from "@/stores/useSidebarStore";
import AppSidebar from "@/components/sidebar/AppSidebar";
import DarkModeToggle from "@/components/DarkModeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import UserMenu from "@/components/ui/UserMenu";
import Logo from "@/assets/TE-logo.png";
import { Menu } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { collapsed, toggleCollapsed } = useSidebarStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-base-light dark:bg-base-dark text-text-light dark:text-text-dark">
      {/* Slim authenticated header */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-base-dark/95 backdrop-blur-sm border-b border-primary-100 dark:border-primary-800/30 shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={Logo} alt="Tiger English" className="h-9 w-auto" />
          </Link>
          <div className="flex items-center gap-2">
            <DarkModeToggle />
            <LanguageSwitcher />
            <UserMenu />
            {/* Mobile sidebar toggle */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Content + sidebar */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
        <AppSidebar
          collapsed={collapsed}
          onToggleCollapsed={toggleCollapsed}
          isOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/AuthLayout.tsx
git commit -m "feat(layout): add AuthLayout with slim header and AppSidebar"
```

---

## Task 8: Data layer — types, buildInviteUrl, mock data

**Files:**
- Create: `src/lib/invite.ts`
- Create: `src/components/home/authenticated/types.ts`
- Create: `src/mocks/authHome.mock.ts`

- [ ] **Step 1: Create `src/lib/invite.ts`**

```ts
// src/lib/invite.ts

/**
 * Builds a referral invite URL for sharing.
 * Swap point for a real endpoint when available.
 */
export function buildInviteUrl(userId: string): string {
  return `https://tiger-english.com/invite?ref=${encodeURIComponent(userId)}`;
}
```

- [ ] **Step 2: Create `src/components/home/authenticated/types.ts`**

```ts
// src/components/home/authenticated/types.ts

export interface ContinueStudyingData {
  setId: string;
  title: string;
  theme: string;
  reviewedCount: number;
  totalCards: number;
  lastStudiedAt: string;  // ISO 8601
  streak?: number;
  accuracy?: number;      // 0–100
}

export type ReasonType = 'review' | 'sequence' | 'related';

export interface RecommendedItem {
  setId: string;
  title: string;
  reasonType: ReasonType;
  reasonLabel?: string;
  priority: number;
}

export interface InviteFriendsData {
  inviteUrl: string;
}

export interface StudyGroup {
  id: string;
  name: string;
  memberCount: number;
}

export interface StudyGroupsData {
  groups: StudyGroup[];
  pendingInviteCount: number;
}
```

- [ ] **Step 3: Create `src/mocks/authHome.mock.ts`**

```ts
// src/mocks/authHome.mock.ts
import { buildInviteUrl } from "@/lib/invite";
import type {
  ContinueStudyingData,
  RecommendedItem,
  InviteFriendsData,
  StudyGroupsData,
} from "@/components/home/authenticated/types";

export const mockContinueStudying: ContinueStudyingData = {
  setId: "set-001",
  title: "Travel Basics",
  theme: "Travel",
  reviewedCount: 18,
  totalCards: 30,
  lastStudiedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
  streak: 5,
  accuracy: 82,
};

export const mockRecommendedItems: RecommendedItem[] = [
  { setId: "set-002", title: "Airport Vocabulary", reasonType: "sequence", priority: 1 },
  { setId: "set-003", title: "Hotel Phrases", reasonType: "related", reasonLabel: "Because you studied Travel Basics", priority: 2 },
  { setId: "set-004", title: "Travel Basics — Weak Cards", reasonType: "review", priority: 3 },
];

export const mockInviteFriends: InviteFriendsData = {
  inviteUrl: buildInviteUrl("mock-user-id"),
};

export const mockStudyGroups: StudyGroupsData = {
  groups: [],
  pendingInviteCount: 0,
};
```

- [ ] **Step 4: Type-check**

```bash
npm run type-check
```
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/lib/invite.ts src/components/home/authenticated/types.ts src/mocks/authHome.mock.ts
git commit -m "feat(data): add AuthHome types, buildInviteUrl helper, and mock data"
```

---

## Task 9: ContinueStudyingCard

**Files:**
- Create: `src/components/home/authenticated/ContinueStudyingCard.tsx`
- Create: `src/components/home/authenticated/__tests__/ContinueStudyingCard.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/home/authenticated/__tests__/ContinueStudyingCard.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import ContinueStudyingCard from '../ContinueStudyingCard';
import type { ContinueStudyingData } from '../types';

const mockData: ContinueStudyingData = {
  setId: 'set-1',
  title: 'Travel Basics',
  theme: 'Travel',
  reviewedCount: 18,
  totalCards: 30,
  lastStudiedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  streak: 5,
  accuracy: 82,
};

function renderCard(props: Partial<React.ComponentProps<typeof ContinueStudyingCard>> = {}) {
  return render(
    <MemoryRouter>
      <ContinueStudyingCard data={mockData} isLoading={false} {...props} />
    </MemoryRouter>
  );
}

describe('ContinueStudyingCard', () => {
  it('renders skeleton when isLoading is true', () => {
    renderCard({ isLoading: true });
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    expect(screen.queryByText('Travel Basics')).not.toBeInTheDocument();
  });

  it('renders empty state when data is null', () => {
    renderCard({ data: null });
    expect(screen.getByText(/start your first set/i)).toBeInTheDocument();
  });

  it('renders set title in populated state', () => {
    renderCard();
    expect(screen.getByText('Travel Basics')).toBeInTheDocument();
  });

  it('renders "Reviewed 18 of 30 cards"', () => {
    renderCard();
    expect(screen.getByText(/reviewed 18 of 30 cards/i)).toBeInTheDocument();
  });

  it('renders progress bar at 0% when totalCards is 0', () => {
    renderCard({ data: { ...mockData, totalCards: 0, reviewedCount: 0 } });
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '0');
  });

  it('shows completed indicator when reviewedCount equals totalCards', () => {
    renderCard({ data: { ...mockData, reviewedCount: 30, totalCards: 30 } });
    expect(screen.getByText(/completed/i)).toBeInTheDocument();
  });

  it('navigates to /flashcards with setId state on Continue Studying click', () => {
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: /continue studying/i }));
    expect(mockNavigate).toHaveBeenCalledWith('/flashcards', { state: { setId: 'set-1' } });
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm test -- src/components/home/authenticated/__tests__/ContinueStudyingCard.test.tsx
```
Expected: FAIL

- [ ] **Step 3: Create `ContinueStudyingCard.tsx`**

```tsx
// src/components/home/authenticated/ContinueStudyingCard.tsx
import { useNavigate } from "react-router-dom";
import type { ContinueStudyingData } from "./types";

interface Props {
  data: ContinueStudyingData | null;
  isLoading: boolean;
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "Less than an hour ago";
  if (hours === 1) return "1 hour ago";
  if (hours < 24) return `${hours} hours ago`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "1 day ago" : `${days} days ago`;
}

export default function ContinueStudyingCard({ data, isLoading }: Props) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div data-testid="skeleton" className="rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse h-48" />
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Continue Studying</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">You haven't studied any sets yet.</p>
        <button
          onClick={() => navigate("/flashcards")}
          className="self-start px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium"
        >
          Start your first set
        </button>
      </div>
    );
  }

  const progress = data.totalCards === 0 ? 0 : Math.round((data.reviewedCount / data.totalCards) * 100);
  const isComplete = data.totalCards > 0 && data.reviewedCount === data.totalCards;

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-4 bg-white dark:bg-gray-900">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{data.title}</h2>
          <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">{data.theme}</span>
        </div>
        <div className="flex gap-2">
          {data.streak !== undefined && (
            <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">
              🔥 {data.streak} day streak
            </span>
          )}
          {data.accuracy !== undefined && (
            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
              {data.accuracy}% accuracy
            </span>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Reviewed {data.reviewedCount} of {data.totalCards} cards</span>
          {isComplete && <span className="text-green-600 dark:text-green-400 font-medium">Completed ✓</span>}
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 dark:text-gray-500">{timeAgo(data.lastStudiedAt)}</span>
        <button
          onClick={() => navigate("/flashcards", { state: { setId: data.setId } })}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Continue Studying
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests — should pass**

```bash
npm test -- src/components/home/authenticated/__tests__/ContinueStudyingCard.test.tsx
```
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/home/authenticated/ContinueStudyingCard.tsx \
  src/components/home/authenticated/__tests__/ContinueStudyingCard.test.tsx
git commit -m "feat(home): add ContinueStudyingCard with skeleton/empty/populated states"
```

---

## Task 10: RecommendedNextCard

**Files:**
- Create: `src/components/home/authenticated/RecommendedNextCard.tsx`
- Create: `src/components/home/authenticated/__tests__/RecommendedNextCard.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/home/authenticated/__tests__/RecommendedNextCard.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RecommendedNextCard from '../RecommendedNextCard';
import type { RecommendedItem } from '../types';

const mockItems: RecommendedItem[] = [
  { setId: 's1', title: 'Airport Vocab', reasonType: 'sequence', priority: 1 },
  { setId: 's2', title: 'Hotel Phrases', reasonType: 'related', reasonLabel: 'Because you studied Travel Basics', priority: 2 },
  { setId: 's3', title: 'Weak Cards', reasonType: 'review', priority: 3 },
];

function renderCard(props = {}) {
  return render(
    <MemoryRouter>
      <RecommendedNextCard data={mockItems} isLoading={false} {...props} />
    </MemoryRouter>
  );
}

describe('RecommendedNextCard', () => {
  it('renders skeleton when isLoading', () => {
    renderCard({ isLoading: true });
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('renders empty state when data is empty array', () => {
    renderCard({ data: [] });
    expect(screen.getByText(/complete a set/i)).toBeInTheDocument();
  });

  it('renders empty state when data is null', () => {
    renderCard({ data: null });
    expect(screen.getByText(/complete a set/i)).toBeInTheDocument();
  });

  it('renders up to 3 items', () => {
    renderCard();
    expect(screen.getByText('Airport Vocab')).toBeInTheDocument();
    expect(screen.getByText('Hotel Phrases')).toBeInTheDocument();
    expect(screen.getByText('Weak Cards')).toBeInTheDocument();
  });

  it('shows reasonLabel when provided', () => {
    renderCard();
    expect(screen.getByText('Because you studied Travel Basics')).toBeInTheDocument();
  });

  it('falls back to default label for sequence when reasonLabel absent', () => {
    renderCard();
    expect(screen.getByText('Next in sequence')).toBeInTheDocument();
  });

  it('falls back to default label for review', () => {
    const reviewOnly: RecommendedItem[] = [{ setId: 'x', title: 'Test', reasonType: 'review', priority: 1 }];
    renderCard({ data: reviewOnly });
    expect(screen.getByText('Needs review')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm test -- src/components/home/authenticated/__tests__/RecommendedNextCard.test.tsx
```
Expected: FAIL

- [ ] **Step 3: Create `RecommendedNextCard.tsx`**

```tsx
// src/components/home/authenticated/RecommendedNextCard.tsx
import { useNavigate } from "react-router-dom";
import type { RecommendedItem, ReasonType } from "./types";

const REASON_DEFAULTS: Record<ReasonType, string> = {
  review: "Needs review",
  sequence: "Next in sequence",
  related: "Related to recent study",
};

interface Props {
  data: RecommendedItem[] | null;
  isLoading: boolean;
}

export default function RecommendedNextCard({ data, isLoading }: Props) {
  const navigate = useNavigate();

  if (isLoading) {
    return <div data-testid="skeleton" className="rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse h-48" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-3">
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">Recommended Next</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Complete a set to unlock recommendations.</p>
      </div>
    );
  }

  const items = data.slice(0, 3);

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-4 bg-white dark:bg-gray-900">
      <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">Recommended Next</h2>
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.setId} className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{item.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {item.reasonLabel ?? REASON_DEFAULTS[item.reasonType]}
              </p>
            </div>
            <button
              onClick={() => navigate("/flashcards", { state: { setId: item.setId } })}
              className="flex-shrink-0 px-3 py-1 text-xs bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
            >
              Study
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests — should pass**

```bash
npm test -- src/components/home/authenticated/__tests__/RecommendedNextCard.test.tsx
```
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/home/authenticated/RecommendedNextCard.tsx \
  src/components/home/authenticated/__tests__/RecommendedNextCard.test.tsx
git commit -m "feat(home): add RecommendedNextCard with reasonType label fallback"
```

---

## Task 11: InviteFriendsCard

**Files:**
- Create: `src/components/home/authenticated/InviteFriendsCard.tsx`
- Create: `src/components/home/authenticated/__tests__/InviteFriendsCard.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/home/authenticated/__tests__/InviteFriendsCard.test.tsx`:

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
import { toast } from 'sonner';

import InviteFriendsCard from '../InviteFriendsCard';

const mockData = { inviteUrl: 'https://tiger-english.com/invite?ref=user-1' };

beforeEach(() => { vi.clearAllMocks(); });

describe('InviteFriendsCard', () => {
  it('renders skeleton when isLoading', () => {
    render(<InviteFriendsCard data={mockData} isLoading={true} />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('calls clipboard.writeText with the invite URL on copy click', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    render(<InviteFriendsCard data={mockData} isLoading={false} />);
    fireEvent.click(screen.getByRole('button', { name: /copy invite link/i }));

    await waitFor(() => expect(writeText).toHaveBeenCalledWith(mockData.inviteUrl));
  });

  it('shows success toast on successful copy', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    render(<InviteFriendsCard data={mockData} isLoading={false} />);
    fireEvent.click(screen.getByRole('button', { name: /copy invite link/i }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith('Invite link copied!'));
  });

  it('shows error toast when clipboard.writeText rejects', async () => {
    const writeText = vi.fn().mockRejectedValue(new Error('denied'));
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });

    render(<InviteFriendsCard data={mockData} isLoading={false} />);
    fireEvent.click(screen.getByRole('button', { name: /copy invite link/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Failed to copy link. Please copy it manually.'));
  });

  it('shows error toast when clipboard API is unavailable', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });

    render(<InviteFriendsCard data={mockData} isLoading={false} />);
    fireEvent.click(screen.getByRole('button', { name: /copy invite link/i }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith('Clipboard not available. Please copy the link manually.'));
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm test -- src/components/home/authenticated/__tests__/InviteFriendsCard.test.tsx
```
Expected: FAIL

- [ ] **Step 3: Create `InviteFriendsCard.tsx`**

```tsx
// src/components/home/authenticated/InviteFriendsCard.tsx
import { toast } from "sonner";
import { Link } from "lucide-react";
import type { InviteFriendsData } from "./types";

interface Props {
  data: InviteFriendsData;
  isLoading: boolean;
}

export default function InviteFriendsCard({ data, isLoading }: Props) {
  if (isLoading) {
    return <div data-testid="skeleton" className="rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse h-40" />;
  }

  const handleCopy = async () => {
    if (!navigator.clipboard) {
      toast.error("Clipboard not available. Please copy the link manually.");
      return;
    }
    try {
      await navigator.clipboard.writeText(data.inviteUrl);
      toast.success("Invite link copied!");
    } catch {
      toast.error("Failed to copy link. Please copy it manually.");
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-4 bg-white dark:bg-gray-900">
      <div className="flex items-center gap-2">
        <Link className="w-5 h-5 text-primary-500" />
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">Invite Friends</h2>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">
        Know someone who wants to learn English? Invite them to Tiger English.
      </p>
      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          Copy Invite Link
        </button>
        <button
          disabled
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400 rounded-lg text-sm font-medium cursor-not-allowed"
        >
          Invite a Friend
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests — should pass**

```bash
npm test -- src/components/home/authenticated/__tests__/InviteFriendsCard.test.tsx
```
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/home/authenticated/InviteFriendsCard.tsx \
  src/components/home/authenticated/__tests__/InviteFriendsCard.test.tsx
git commit -m "feat(home): add InviteFriendsCard with clipboard copy and error handling"
```

---

## Task 12: StudyGroupsCard

**Files:**
- Create: `src/components/home/authenticated/StudyGroupsCard.tsx`
- Create: `src/components/home/authenticated/__tests__/StudyGroupsCard.test.tsx`

- [ ] **Step 1: Write failing tests**

Create `src/components/home/authenticated/__tests__/StudyGroupsCard.test.tsx`:

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import StudyGroupsCard from '../StudyGroupsCard';
import type { StudyGroupsData } from '../types';

const emptyData: StudyGroupsData = { groups: [], pendingInviteCount: 0 };
const populatedData: StudyGroupsData = {
  groups: [{ id: 'g1', name: 'English Beginners', memberCount: 4 }],
  pendingInviteCount: 2,
};

describe('StudyGroupsCard', () => {
  it('renders skeleton when isLoading', () => {
    render(<StudyGroupsCard data={emptyData} isLoading={true} />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });

  it('renders empty state with Create Study Group CTA when groups is empty', () => {
    render(<StudyGroupsCard data={emptyData} isLoading={false} />);
    expect(screen.getByText(/no study groups yet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create study group/i })).toBeInTheDocument();
  });

  it('disables Invite to Group when groups array is empty', () => {
    render(<StudyGroupsCard data={emptyData} isLoading={false} />);
    expect(screen.getByRole('button', { name: /invite to group/i })).toBeDisabled();
  });

  it('renders pending invites badge with correct count', () => {
    render(<StudyGroupsCard data={populatedData} isLoading={false} />);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('hides pending invites badge when count is 0', () => {
    render(<StudyGroupsCard data={emptyData} isLoading={false} />);
    expect(screen.queryByTestId('pending-badge')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run to confirm failure**

```bash
npm test -- src/components/home/authenticated/__tests__/StudyGroupsCard.test.tsx
```
Expected: FAIL

- [ ] **Step 3: Create `StudyGroupsCard.tsx`**

```tsx
// src/components/home/authenticated/StudyGroupsCard.tsx
import { Users } from "lucide-react";
import type { StudyGroupsData } from "./types";

interface Props {
  data: StudyGroupsData;
  isLoading: boolean;
}

export default function StudyGroupsCard({ data, isLoading }: Props) {
  if (isLoading) {
    return <div data-testid="skeleton" className="rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse h-40" />;
  }

  const hasGroups = data.groups.length > 0;

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-4 bg-white dark:bg-gray-900">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-primary-500" />
          <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">Study Groups</h2>
        </div>
        {data.pendingInviteCount > 0 && (
          <span
            data-testid="pending-badge"
            className="text-xs bg-primary-500 text-white px-2 py-0.5 rounded-full font-medium"
          >
            {data.pendingInviteCount}
          </span>
        )}
      </div>

      {!hasGroups && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No study groups yet. Create one to study with friends.
        </p>
      )}

      <div className="flex gap-2">
        <button
          disabled
          className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium opacity-60 cursor-not-allowed"
        >
          Create Study Group
        </button>
        <button
          disabled={!hasGroups}
          className={[
            "px-4 py-2 border rounded-lg text-sm font-medium transition-colors",
            hasGroups
              ? "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              : "border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-600 cursor-not-allowed",
          ].join(" ")}
        >
          Invite to Group
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Run tests — should pass**

```bash
npm test -- src/components/home/authenticated/__tests__/StudyGroupsCard.test.tsx
```
Expected: PASS (5 tests)

- [ ] **Step 5: Commit**

```bash
git add src/components/home/authenticated/StudyGroupsCard.tsx \
  src/components/home/authenticated/__tests__/StudyGroupsCard.test.tsx
git commit -m "feat(home): add StudyGroupsCard with empty state and pending invites badge"
```

---

## Task 13: AuthHome page

**Files:**
- Create: `src/pages/AuthHome.tsx`

- [ ] **Step 1: Create `AuthHome.tsx`**

```tsx
// src/pages/AuthHome.tsx
import ContinueStudyingCard from "@/components/home/authenticated/ContinueStudyingCard";
import RecommendedNextCard from "@/components/home/authenticated/RecommendedNextCard";
import InviteFriendsCard from "@/components/home/authenticated/InviteFriendsCard";
import StudyGroupsCard from "@/components/home/authenticated/StudyGroupsCard";
import {
  mockContinueStudying,
  mockRecommendedItems,
  mockInviteFriends,
  mockStudyGroups,
} from "@/mocks/authHome.mock";

export default function AuthHome() {
  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Top row: 2/3 + 1/3 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <ContinueStudyingCard data={mockContinueStudying} isLoading={false} />
        </div>
        <div className="md:col-span-1">
          <RecommendedNextCard data={mockRecommendedItems} isLoading={false} />
        </div>
      </div>

      {/* Bottom row: 1/2 + 1/2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InviteFriendsCard data={mockInviteFriends} isLoading={false} />
        <StudyGroupsCard data={mockStudyGroups} isLoading={false} />
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Type-check**

```bash
npm run type-check
```
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/AuthHome.tsx
git commit -m "feat(home): add AuthHome page composing all four authenticated cards"
```

---

## Task 14: Wire up App.tsx routing and Home.tsx conditional render

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/pages/Home.tsx`

- [ ] **Step 1: Update `Home.tsx` to conditionally render AuthHome**

```tsx
// src/pages/Home.tsx
import { lazy, Suspense } from "react";
import { useUserStore } from "@/stores/useUserStore";
import HeroSection from "../components/home/HeroSection";
import FeaturesSection from "../components/home/FeaturesSection";
import FinalCtaSection from "../components/home/FinalCtaSection";

const AuthHome = lazy(() => import("./AuthHome"));

export default function Home() {
  const session = useUserStore((s) => s.session);
  const sessionLoading = useUserStore((s) => s.sessionLoading);

  if (sessionLoading) {
    return (
      <div role="status" className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (session) {
    return (
      <Suspense fallback={<div role="status" className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>}>
        <AuthHome />
      </Suspense>
    );
  }

  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <FinalCtaSection />
    </>
  );
}
```

- [ ] **Step 2: Rewrite `App.tsx` with new routing structure**

```tsx
// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import AppInitializer from "./components/AppInitializer";
import PublicLayout from "./components/layout/PublicLayout";
import AuthLayout from "./components/layout/AuthLayout";
import RequireAuth from "./features/auth/RequireAuth";
import RequireGuest from "./features/auth/RequireGuest";
import ErrorBoundary from "./components/ErrorBoundary";

const Home        = lazy(() => import("@/pages/Home"));
const Register    = lazy(() => import("@/pages/Register"));
const Login       = lazy(() => import("@/pages/Login"));
const AuthCallback = lazy(() => import("@/pages/AuthCallback"));
const Dashboard   = lazy(() => import("./pages/Dashboard"));
const About       = lazy(() => import("@/pages/About"));
const Contact     = lazy(() => import("@/pages/Contact"));
const FlashcardsPage = lazy(() => import("./pages/FlashcardsPage"));

// Stub pages for new authenticated routes — placeholder until built
const StubPage = ({ title }: { title: string }) => (
  <div className="p-8 text-2xl font-semibold text-gray-700 dark:text-gray-300">{title} — coming soon</div>
);

const PageLoader = () => (
  <div className="min-h-screen bg-semantic-bg flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AppInitializer />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/u/:username" element={<StubPage title="Public Profile" />} />
              <Route path="/login" element={<RequireGuest><Login /></RequireGuest>} />
              <Route path="/register" element={<RequireGuest><Register /></RequireGuest>} />
            </Route>

            {/* Auth callback — no layout wrapper */}
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Authenticated routes */}
            <Route element={<RequireAuth><AuthLayout><Suspense fallback={<PageLoader />}><Routes>{/* inner routes rendered by Outlet */}</Routes></Suspense></AuthLayout></RequireAuth>}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/library" element={<StubPage title="Library" />} />
              <Route path="/study-groups" element={<StubPage title="Study Groups" />} />
              <Route path="/notifications" element={<StubPage title="Notifications" />} />
              <Route path="/flashcards" element={<FlashcardsPage />} />
              <Route path="/drag-drop" element={<StubPage title="Drag & Drop" />} />
              <Route path="/ad-libs" element={<StubPage title="Ad Libs" />} />
            </Route>
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
```

**Note on React Router v7 nested layout pattern:** `PublicLayout` and `AuthLayout` need to render `<Outlet />` instead of `{ children }` when used as route elements. Update both layout components: replace `{ children }: { children: ReactNode }` with no props, and replace `{children}` in the JSX with `<Outlet />`. Import `Outlet` from `react-router-dom`.

- [ ] **Step 3: Update `PublicLayout.tsx` and `AuthLayout.tsx` to use `<Outlet />`**

In `PublicLayout.tsx`:
```tsx
import { Outlet } from "react-router-dom";
// replace `{ children }: { children: ReactNode }` signature with no props
// replace `{children}` in JSX with `<Outlet />`
```

In `AuthLayout.tsx`:
```tsx
import { Outlet } from "react-router-dom";
// same changes
```

- [ ] **Step 4: Type-check**

```bash
npm run type-check
```
Expected: no errors.

- [ ] **Step 5: Run full test suite**

```bash
npm test
```
Expected: all pass.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx src/pages/Home.tsx src/components/layout/PublicLayout.tsx src/components/layout/AuthLayout.tsx
git commit -m "feat(routing): wire up AuthLayout, RequireAuth/Guest guards, and conditional AuthHome render"
```

---

## Task 15: Final cleanup — retire UserLayout, run full suite

**Files:**
- Delete: `src/routes/UserLayout.tsx` (replaced by RequireAuth)

- [ ] **Step 1: Verify UserLayout is no longer referenced anywhere**

```bash
grep -r "UserLayout" src/
```
Expected: no output (it should have been removed from App.tsx in Task 14).

- [ ] **Step 2: Delete UserLayout**

```bash
git rm src/routes/UserLayout.tsx
```

- [ ] **Step 3: Run full test suite one final time**

```bash
npm test
```
Expected: all tests pass. Note the exact count.

- [ ] **Step 4: Type-check**

```bash
npm run type-check
```
Expected: no errors.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat(auth): retire UserLayout; authenticated home experience complete"
```
