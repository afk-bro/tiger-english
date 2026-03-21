# Google OAuth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add "Continue with Google" sign-in, with a Postgres trigger as the single provisioning path for all user `profiles` + `user_stats` rows.

**Architecture:** A `SECURITY DEFINER` Postgres trigger fires on every `auth.users` INSERT and creates `profiles` + `user_stats`. FastAPI stops inserting those rows directly and instead passes `user_metadata` when calling `admin.create_user`. A new `/auth/callback` page handles post-OAuth redirects with an explicit state machine that polls the Zustand store until `profile.username` is set.

**Tech Stack:** Supabase (Postgres trigger + `signInWithOAuth`), React + Zustand, FastAPI/Python, Vitest + React Testing Library

---

## File Map

| Action | File | Purpose |
|--------|------|---------|
| Create | `supabase/migrations/20260320000001_google_oauth_provisioning.sql` | Trigger function + trigger |
| Modify | `backend/app/services/auth_service.py` | Pass `user_metadata`, remove profile/stats inserts |
| Modify | `src/stores/useUserStore.ts` | Treat PGRST116 as `null` not error |
| Create | `src/stores/__tests__/useUserStore.test.ts` | Test PGRST116 behaviour |
| Create | `src/components/ui/GoogleAuthButton.tsx` | Google OAuth button |
| Create | `src/components/ui/__tests__/GoogleAuthButton.test.tsx` | Button tests |
| Create | `src/pages/AuthCallback.tsx` | OAuth callback state machine |
| Create | `src/pages/__tests__/AuthCallback.test.tsx` | Callback state machine tests |
| Modify | `src/App.tsx` | Add `/auth/callback` route |
| Modify | `src/pages/Login.tsx` | Add GoogleAuthButton + divider |
| Modify | `src/pages/Register.tsx` | Add GoogleAuthButton + divider |

---

## Task 1: Postgres Migration — User Provisioning Trigger

**Files:**
- Create: `supabase/migrations/20260320000001_google_oauth_provisioning.sql`

- [ ] **Step 1: Write the migration**

```sql
-- ============================================================
-- CANONICAL PROVISIONING PATH
-- This trigger creates public.profiles and public.user_stats
-- for every new auth.users row. App code (FastAPI, frontend)
-- must never directly insert into these tables during
-- registration. FastAPI passes username/first_name/last_name
-- via user_metadata; the trigger applies explicit precedence.
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_username_meta text;
  v_use_path_a    bool;
  v_email_base    text;
  v_first_name    text;
  v_last_name     text;
  v_full_name     text;
  v_tokens        text[];
  v_candidate     text;
  v_inserted      bool := false;
  i               int;
BEGIN
  -- ── Idempotency guard ─────────────────────────────────────
  -- If profile already exists, ensure user_stats exists and exit.
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    INSERT INTO public.user_stats (user_id, xp, level, study_streak, last_login)
      VALUES (NEW.id, 0, 1, 0, NOW())
      ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
  END IF;

  -- ── Resolve first_name / last_name ────────────────────────
  -- Precedence: raw_user_meta_data.first_name
  --           → split full_name (best-effort)
  --           → email prefix fallback
  v_first_name := trim(NEW.raw_user_meta_data->>'first_name');
  v_last_name  := trim(coalesce(NEW.raw_user_meta_data->>'last_name', ''));

  IF v_first_name IS NULL OR v_first_name = '' THEN
    v_full_name := trim(coalesce(NEW.raw_user_meta_data->>'full_name', ''));
    IF v_full_name <> '' THEN
      -- Best-effort: first token → first_name, rest → last_name.
      -- Handles single-word names, middle names, non-Western formats gracefully.
      v_tokens     := regexp_split_to_array(v_full_name, '\s+');
      v_first_name := v_tokens[1];
      v_last_name  := CASE WHEN array_length(v_tokens, 1) > 1
                           THEN array_to_string(v_tokens[2:], ' ')
                           ELSE '' END;
    ELSE
      -- Final fallback: use email prefix
      v_first_name := split_part(NEW.email, '@', 1);
      v_last_name  := '';
    END IF;
  END IF;

  v_first_name := coalesce(v_first_name, '');
  v_last_name  := coalesce(v_last_name, '');

  -- ── Determine username path ───────────────────────────────
  -- Path A (metadata passthrough): raw_user_meta_data.username present and non-empty.
  --   Used for FastAPI-registered users. No suffix appended.
  -- Path B (generation):           no username in metadata (Google OAuth users).
  --   Sanitize email prefix + random 6-char hex suffix.
  v_username_meta := lower(trim(coalesce(NEW.raw_user_meta_data->>'username', '')));
  v_use_path_a    := (v_username_meta <> '');

  IF NOT v_use_path_a THEN
    -- Build sanitized base once; fresh suffix is appended per attempt in the loop.
    v_email_base := lower(split_part(NEW.email, '@', 1));
    v_email_base := regexp_replace(v_email_base, '[^a-z0-9]', '_', 'g');
    v_email_base := regexp_replace(v_email_base, '_+',        '_', 'g');
    v_email_base := trim(both '_' from v_email_base);
    v_email_base := left(v_email_base, 15);
    IF v_email_base = '' THEN
      v_email_base := 'user';
    END IF;
  END IF;

  -- ── Retry loop: INSERT profiles with unique username ──────
  -- The loop wraps the INSERT so a fresh suffix is generated on each
  -- unique_violation. Path A produces a deterministic candidate; a conflict
  -- there signals a genuine duplicate-registration race (exception on exhaustion
  -- is the correct outcome).
  FOR i IN 1..5 LOOP
    v_candidate := CASE
      WHEN v_use_path_a THEN v_username_meta
      ELSE v_email_base || '_' || substr(md5(random()::text), 1, 6)
    END;

    BEGIN
      INSERT INTO public.profiles (id, email, first_name, last_name, username)
        VALUES (NEW.id, NEW.email, v_first_name, v_last_name, v_candidate);
      v_inserted := true;
      EXIT; -- success — leave loop
    EXCEPTION WHEN unique_violation THEN
      NULL; -- username taken; regenerate on next iteration
    END;
  END LOOP;

  IF NOT v_inserted THEN
    RAISE EXCEPTION
      'handle_new_user: could not generate unique username for % after 5 attempts',
      NEW.email;
  END IF;

  -- ── Insert user_stats (once, after profiles succeeds) ─────
  -- Single conflict target — valid Postgres syntax.
  -- Canonical defaults live here and nowhere else.
  INSERT INTO public.user_stats (user_id, xp, level, study_streak, last_login)
    VALUES (NEW.id, 0, 1, 0, NOW())
    ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Wire the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

- [ ] **Step 2: Apply the migration**

Apply via the Supabase dashboard SQL editor or Supabase CLI:
```bash
supabase db push
# or paste the SQL directly into the Supabase Dashboard → SQL Editor
```

- [ ] **Step 3: Smoke-test the trigger manually**

Create a test user via the **Supabase Dashboard → Authentication → Users → Add user** (do NOT use SQL — there is no `supabase_admin.create_user` SQL function). Use any email with no extra metadata to simulate a Google OAuth user.

Then verify in the **SQL Editor**:

```sql
-- Replace with the email you used above
-- Verify profile row was created with auto-generated username
SELECT id, email, first_name, last_name, username
FROM public.profiles
WHERE email = 'triggertest@example.com';
-- Expected: 1 row, username like 'triggertest_a3f9c1'

-- Verify user_stats row was created
SELECT user_id, xp, level, study_streak
FROM public.user_stats
WHERE user_id = (SELECT id FROM public.profiles WHERE email = 'triggertest@example.com');
-- Expected: 1 row with xp=0, level=1, study_streak=0

-- Clean up (deletes the profile/stats rows via cascade, then the auth user)
DELETE FROM auth.users WHERE email = 'triggertest@example.com';
```

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260320000001_google_oauth_provisioning.sql
git commit -m "feat(db): add handle_new_user trigger for unified profile provisioning"
```

---

## Task 2: FastAPI — Simplify `register_user`

**Files:**
- Modify: `backend/app/services/auth_service.py`

The trigger now owns profile/stats creation. FastAPI's job shrinks to: pre-check username → create auth user with metadata → rollback auth user if that fails.

- [ ] **Step 1: Update `register_user` in `auth_service.py`**

Replace the `register_user` method with:

```python
async def register_user(self, user_data: UserRegister) -> dict:
    """Register a new user. Profile and user_stats are created by the
    handle_new_user DB trigger — do not insert into those tables here."""

    # Pre-check username before creating the auth user
    if not await self.check_username_availability(user_data.username):
        raise AuthException("Username is already taken", field="username")

    # Create Supabase auth user with metadata so the trigger can use it
    try:
        auth_response = self.supabase.auth.admin.create_user({
            "email": user_data.email,
            "password": user_data.password,
            "email_confirm": True,
            "user_metadata": {
                "username": user_data.username,
                "first_name": user_data.first_name,
                "last_name": user_data.last_name,
            },
        })

        if not auth_response.user:
            raise AuthException("Failed to create user account")

    except AuthException:
        raise
    except Exception as e:
        error_message = str(e).lower()
        if "already registered" in error_message or "user already exists" in error_message:
            raise AuthException("Email is already registered", field="email")
        raise AuthException(f"Registration failed: {str(e)}")

    # The trigger has already created profiles + user_stats at this point.
    return {
        "success": True,
        "message": "Account created successfully! Please log in to continue.",
    }
```

Also remove the `_cleanup_auth_user` method's call sites and simplify — the method itself can stay for safety, but we only call it on auth user creation failure now (which is already handled in the except block above, so the method is no longer needed — you can delete it or leave it).

- [ ] **Step 2: Verify the backend still starts**

```bash
cd backend
source venv/bin/activate
python run.py
# Expected: Uvicorn starts on http://localhost:8000, no import errors
```

- [ ] **Step 3: Smoke-test registration via the API docs**

Visit `http://localhost:8000/docs`, use `POST /api/v1/auth/register` with a new email/username. Then check Supabase dashboard that `profiles` and `user_stats` rows exist.

- [ ] **Step 4: Commit**

```bash
git add backend/app/services/auth_service.py
git commit -m "feat(backend): pass user_metadata to trigger; remove direct profile/stats inserts"
```

---

## Task 3: Fix `fetchProfile` — Treat PGRST116 as Null, Not Error

**Files:**
- Modify: `src/stores/useUserStore.ts`
- Create: `src/stores/__tests__/useUserStore.test.ts`

PGRST116 means "no rows found" — during OAuth callback the profile row may not exist yet. This is a transient state, not an error.

- [ ] **Step 1: Write the failing test**

Create `src/stores/__tests__/useUserStore.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react';

// Mock supabase before importing the store
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
    from: vi.fn(),
  },
}));

import { supabase } from '@/lib/supabase';
import { useUserStore } from '../useUserStore';

const mockGetSession = supabase.auth.getSession as ReturnType<typeof vi.fn>;
const mockFrom = supabase.from as ReturnType<typeof vi.fn>;

function makeSelectChain(result: { data: unknown; error: unknown }) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
  };
  return chain;
}

beforeEach(() => {
  useUserStore.setState({ profile: null, loading: false, error: null });
  vi.clearAllMocks();
});

describe('fetchProfile — PGRST116 (no rows)', () => {
  it('sets profile: null and error: null when profile row does not exist yet', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-123' } } },
    });

    const pgrst116Error = { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' };
    mockFrom.mockReturnValue(makeSelectChain({ data: null, error: pgrst116Error }));

    await act(async () => {
      await useUserStore.getState().fetchProfile();
    });

    const state = useUserStore.getState();
    expect(state.profile).toBeNull();
    expect(state.error).toBeNull();   // key assertion: NOT an error
    expect(state.loading).toBe(false);
  });

  it('sets error when a genuine DB error occurs (non-PGRST116)', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-123' } } },
    });

    const networkError = { code: 'NETWORK_ERROR', message: 'connection refused' };
    mockFrom.mockReturnValue(makeSelectChain({ data: null, error: networkError }));

    await act(async () => {
      await useUserStore.getState().fetchProfile();
    });

    const state = useUserStore.getState();
    expect(state.profile).toBeNull();
    expect(state.error).toBe('connection refused');
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
npm test -- src/stores/__tests__/useUserStore.test.ts
# Expected: FAIL — "expected null to be 'JSON object requested...'"
```

- [ ] **Step 3: Fix `fetchProfile` in `useUserStore.ts`**

Replace the error branch in `fetchProfile`:

```typescript
if (error) {
  if (error.code === 'PGRST116') {
    // No profile row yet — transient state during OAuth callback. Not an error.
    set({ profile: null, error: null, loading: false });
  } else {
    set({ error: error.message, profile: null, loading: false });
  }
} else {
```

- [ ] **Step 4: Run the tests and verify they pass**

```bash
npm test -- src/stores/__tests__/useUserStore.test.ts
# Expected: PASS (2 tests)
```

- [ ] **Step 5: Commit**

```bash
git add src/stores/useUserStore.ts src/stores/__tests__/useUserStore.test.ts
git commit -m "fix(store): treat PGRST116 as null state, not error, in fetchProfile"
```

---

## Task 4: `GoogleAuthButton` Component

**Files:**
- Create: `src/components/ui/GoogleAuthButton.tsx`
- Create: `src/components/ui/__tests__/GoogleAuthButton.test.tsx`

A standalone button — does not use the existing `Button` component since the `outline` variant uses white text on transparent background (designed for colored backgrounds), which would be invisible here.

- [ ] **Step 1: Write the failing test**

Create `src/components/ui/__tests__/GoogleAuthButton.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOAuth: vi.fn(),
    },
  },
}));

import { supabase } from '@/lib/supabase';
import GoogleAuthButton from '../GoogleAuthButton';

const mockSignIn = supabase.auth.signInWithOAuth as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  mockSignIn.mockResolvedValue({ data: {}, error: null });
});

describe('GoogleAuthButton', () => {
  it('renders "Continue with Google" text', () => {
    render(<GoogleAuthButton />);
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
  });

  it('calls signInWithOAuth with google provider on click', async () => {
    render(<GoogleAuthButton />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'google' })
      );
    });
  });

  it('includes /auth/callback in the redirectTo option', async () => {
    render(<GoogleAuthButton />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      const call = mockSignIn.mock.calls[0][0];
      expect(call.options.redirectTo).toContain('/auth/callback');
    });
  });

  it('shows loading state while OAuth is initiating', async () => {
    // signInWithOAuth never resolves in this test so loading stays true
    mockSignIn.mockImplementation(() => new Promise(() => {}));
    render(<GoogleAuthButton />);
    fireEvent.click(screen.getByRole('button'));
    expect(await screen.findByText('Connecting…')).toBeInTheDocument();
  });

  it('shows error message when signInWithOAuth fails', async () => {
    mockSignIn.mockResolvedValue({ data: null, error: { message: 'OAuth failed' } });
    render(<GoogleAuthButton />);
    fireEvent.click(screen.getByRole('button'));
    expect(await screen.findByText('OAuth failed')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- src/components/ui/__tests__/GoogleAuthButton.test.tsx
# Expected: FAIL — module not found
```

- [ ] **Step 3: Create `GoogleAuthButton.tsx`**

Create `src/components/ui/GoogleAuthButton.tsx`:

```typescript
import { useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function GoogleAuthButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setError(null);

    const redirectTo = window.location.origin + '/auth/callback';

    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });

    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
    // On success the browser navigates away — no further state update needed
  };

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200 disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
      >
        {/* Google "G" logo */}
        <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        {loading ? 'Connecting…' : 'Continue with Google'}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-500 text-center">{error}</p>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
npm test -- src/components/ui/__tests__/GoogleAuthButton.test.tsx
# Expected: PASS (5 tests)
```

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/GoogleAuthButton.tsx src/components/ui/__tests__/GoogleAuthButton.test.tsx
git commit -m "feat(ui): add GoogleAuthButton component"
```

---

## Task 5: `AuthCallback` Page

**Files:**
- Create: `src/pages/AuthCallback.tsx`
- Create: `src/pages/__tests__/AuthCallback.test.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/pages/__tests__/AuthCallback.test.tsx`:

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock react-router navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// Mock supabase
const mockOnAuthStateChange = vi.fn();
const mockGetSession = vi.fn();
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: mockOnAuthStateChange,
      getSession: mockGetSession,
    },
  },
}));

// Mock Zustand store
const mockUseUserStore = vi.fn();
vi.mock('@/stores/useUserStore', () => ({
  useUserStore: (selector: (s: unknown) => unknown) => mockUseUserStore(selector),
}));

import AuthCallback from '../AuthCallback';

function renderCallback(search = '') {
  return render(
    <MemoryRouter initialEntries={[`/auth/callback${search}`]}>
      <AuthCallback />
    </MemoryRouter>
  );
}

function setupSubscription() {
  let capturedCallback: ((event: string, session: unknown) => void) | null = null;
  mockOnAuthStateChange.mockImplementation((cb) => {
    capturedCallback = cb;
    return { data: { subscription: { unsubscribe: vi.fn() } } };
  });
  return { fire: (event: string, session: unknown) => capturedCallback?.(event, session) };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  mockGetSession.mockResolvedValue({ data: { session: { user: { id: '123' } } } });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('AuthCallback', () => {
  it('shows auth_error immediately when URL contains ?error=', () => {
    setupSubscription();
    mockUseUserStore.mockReturnValue(null);
    renderCallback('?error=access_denied&error_description=User+cancelled');
    expect(screen.getByText(/authentication failed/i)).toBeInTheDocument();
  });

  it('shows checking state on mount', () => {
    setupSubscription();
    mockUseUserStore.mockReturnValue(null);
    renderCallback();
    expect(screen.getByText(/signing you in/i)).toBeInTheDocument();
  });

  it('transitions to auth_error when no SIGNED_IN event within 3s', async () => {
    setupSubscription(); // never fires SIGNED_IN
    mockUseUserStore.mockReturnValue(null);
    renderCallback();

    await act(async () => {
      vi.advanceTimersByTime(3001);
    });

    expect(screen.getByText(/authentication failed/i)).toBeInTheDocument();
  });

  it('transitions to waiting_profile after SIGNED_IN event', async () => {
    const sub = setupSubscription();
    mockUseUserStore.mockReturnValue(null); // no profile yet
    renderCallback();

    await act(async () => {
      sub.fire('SIGNED_IN', { user: { id: '123' } });
    });

    expect(screen.getByText(/setting up your account/i)).toBeInTheDocument();
  });

  it('redirects to /u/:username when profile.username is set', async () => {
    const sub = setupSubscription();
    mockUseUserStore.mockReturnValue({ username: 'testuser_abc123' });
    renderCallback();

    await act(async () => {
      sub.fire('SIGNED_IN', { user: { id: '123' } });
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/u/testuser_abc123', { replace: true });
    });
  });

  it('shows timeout state after 10s in waiting_profile', async () => {
    const sub = setupSubscription();
    mockUseUserStore.mockReturnValue(null); // profile never arrives
    renderCallback();

    await act(async () => {
      sub.fire('SIGNED_IN', { user: { id: '123' } });
      vi.advanceTimersByTime(10001);
    });

    expect(screen.getByText(/taking longer than expected/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npm test -- src/pages/__tests__/AuthCallback.test.tsx
# Expected: FAIL — module not found
```

- [ ] **Step 3: Create `AuthCallback.tsx`**

Create `src/pages/AuthCallback.tsx`:

```typescript
import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/stores/useUserStore';

type CallbackState = 'checking' | 'waiting_profile' | 'auth_error' | 'timeout';

export default function AuthCallback() {
  const navigate = useNavigate();
  const profile = useUserStore((s) => s.profile);
  const storeError = useUserStore((s) => s.error);

  const [state, setState] = useState<CallbackState>(() => {
    // Immediately detect OAuth error params in URL
    const params = new URLSearchParams(window.location.search);
    return params.get('error') ? 'auth_error' : 'checking';
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sessionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const profileTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
    if (profileTimerRef.current) clearTimeout(profileTimerRef.current);
  };

  const startProfilePolling = () => {
    setState('waiting_profile');

    // Profile may already be in the store (AppInitializer beat us to it)
    if (useUserStore.getState().profile?.username) return;

    profileTimerRef.current = setTimeout(() => {
      clearTimers();
      setState('timeout');
    }, 10_000);
  };

  // Retry: re-check session then resume polling
  const handleRetry = async () => {
    clearTimers();
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setState('auth_error');
      setErrorMessage('Your session has expired. Please sign in again.');
      return;
    }
    startProfilePolling();
  };

  useEffect(() => {
    if (state === 'auth_error') return; // already errored from URL params

    // Wait for SIGNED_IN event — correct mechanism post-OAuth-redirect
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
        subscription.unsubscribe();
        startProfilePolling();
      }
    });

    // 3s fallback if SIGNED_IN never fires
    sessionTimerRef.current = setTimeout(() => {
      subscription.unsubscribe();
      setState('auth_error');
      setErrorMessage('Authentication timed out. Please try again.');
    }, 3_000);

    return () => {
      clearTimers();
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Watch store for profile arriving (AppInitializer calls fetchProfile on SIGNED_IN)
  useEffect(() => {
    if (state !== 'waiting_profile') return;

    if (profile?.username) {
      clearTimers();
      navigate(`/u/${profile.username}`, { replace: true });
      return;
    }

    if (storeError) {
      clearTimers();
      setState('auth_error');
      setErrorMessage(storeError);
    }
  }, [state, profile, storeError, navigate]);

  // UI
  if (state === 'checking' || state === 'waiting_profile') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-semantic-bg dark:bg-semantic-bg">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-semantic-muted dark:text-semantic-muted">
          {state === 'checking' ? 'Signing you in…' : 'Setting up your account…'}
        </p>
      </div>
    );
  }

  if (state === 'timeout') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 bg-semantic-bg dark:bg-semantic-bg">
        <p className="text-base font-medium text-semantic-text dark:text-semantic-text">
          Taking longer than expected
        </p>
        <p className="text-sm text-semantic-muted dark:text-semantic-muted text-center max-w-sm">
          Your account is being set up. This usually takes just a moment.
        </p>
        <button
          onClick={handleRetry}
          className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-medium transition-colors"
        >
          Try again
        </button>
        <Link to="/login" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
          Back to login
        </Link>
      </div>
    );
  }

  // auth_error
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 bg-semantic-bg dark:bg-semantic-bg">
      <p className="text-base font-medium text-semantic-text dark:text-semantic-text">
        Authentication failed
      </p>
      <p className="text-sm text-semantic-muted dark:text-semantic-muted text-center max-w-sm">
        {errorMessage ?? 'Something went wrong during sign-in. Please try again.'}
      </p>
      <Link
        to="/login"
        className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-medium transition-colors"
      >
        Back to login
      </Link>
    </div>
  );
}
```

- [ ] **Step 4: Run tests and verify they pass**

```bash
npm test -- src/pages/__tests__/AuthCallback.test.tsx
# Expected: PASS (6 tests)
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/AuthCallback.tsx src/pages/__tests__/AuthCallback.test.tsx
git commit -m "feat(pages): add AuthCallback page with session/profile state machine"
```

---

## Task 6: Register `/auth/callback` Route

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add the route to `App.tsx`**

Add the lazy import:
```typescript
const AuthCallback = lazy(() => import('@/pages/AuthCallback'));
```

Add the route inside `<Routes>` with the other public routes:
```typescript
<Route path="/auth/callback" element={<AuthCallback />} />
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
npm run type-check
# Expected: no errors
```

- [ ] **Step 3: Commit**

```bash
git add src/App.tsx
git commit -m "feat(router): add /auth/callback route"
```

---

## Task 7: Add Google Button to Login and Register Pages

**Files:**
- Modify: `src/pages/Login.tsx`
- Modify: `src/pages/Register.tsx`

- [ ] **Step 1: Update `Login.tsx`**

Add the import at the top:
```typescript
import GoogleAuthButton from '@/components/ui/GoogleAuthButton';
```

Insert above the `<form>` tag (inside the card `div`, after the header section):
```tsx
<GoogleAuthButton />

<div className="relative">
  <div className="absolute inset-0 flex items-center">
    <div className="w-full border-t border-gray-200 dark:border-gray-700" />
  </div>
  <div className="relative flex justify-center text-xs uppercase">
    <span className="bg-white dark:bg-gray-900 px-2 text-gray-400 dark:text-gray-500">
      or
    </span>
  </div>
</div>
```

- [ ] **Step 2: Update `Register.tsx`**

Add the same import:
```typescript
import GoogleAuthButton from '@/components/ui/GoogleAuthButton';
```

Insert the same `<GoogleAuthButton />` + divider block above the `<form>` tag.

- [ ] **Step 3: Verify the pages build**

```bash
npm run build
# Expected: no TypeScript or build errors
```

- [ ] **Step 4: Run the full test suite**

```bash
npm test
# Expected: all tests pass
```

- [ ] **Step 5: Commit**

```bash
git add src/pages/Login.tsx src/pages/Register.tsx
git commit -m "feat(auth): add Google OAuth button to login and register pages"
```

---

## Task 8: Configure Google OAuth in Supabase + End-to-End Verification

This task requires manual steps in external dashboards.

- [ ] **Step 1: Create Google OAuth credentials**

1. Go to [console.cloud.google.com](https://console.cloud.google.com) → APIs & Services → Credentials
2. Create an OAuth 2.0 Client ID (Web application)
3. Add authorised redirect URI: `https://<your-supabase-project>.supabase.co/auth/v1/callback`
4. Note the **Client ID** and **Client Secret**

- [ ] **Step 2: Enable Google provider in Supabase**

1. Supabase Dashboard → Authentication → Providers → Google
2. Enable it, paste Client ID + Secret
3. Save

- [ ] **Step 3: End-to-end test — new Google user**

1. Start the frontend: `npm run dev`
2. Visit `http://localhost:5173/login`
3. Click "Continue with Google" — complete the Google sign-in flow
4. Verify you land on `/u/<auto-generated-username>`
5. In Supabase Dashboard → Table Editor → `profiles`: confirm row exists with auto-generated username
6. In `user_stats`: confirm row exists with `xp=0, level=1`

- [ ] **Step 4: End-to-end test — existing email user**

1. Register a new account via the email/password form
2. Log out
3. Log in via email/password — confirm normal flow still works
4. In Supabase Dashboard: confirm `profiles` row has the chosen username (not auto-generated)

- [ ] **Step 5: Push to remote**

```bash
git push
```
