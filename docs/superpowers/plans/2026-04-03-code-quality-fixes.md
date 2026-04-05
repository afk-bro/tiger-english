# Code Quality Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 8 small code quality issues across the frontend and backend — no feature work, no schema changes.

**Architecture:** Two independent PRs on separate branches from `main`. PR 1 fixes frontend import hygiene, file placement, and a double-fetch coupling in the login flow. PR 2 fixes a deprecated datetime call, replaces print-based logging, and introduces FastAPI dependency injection for `AuthService`.

**Tech Stack:** React 19 + TypeScript + Vitest (frontend), FastAPI + Python 3.12 (backend), Supabase auth, Zustand, React Router DOM v7, React Hook Form.

---

## Branches

- **PR 1:** `fix/code-quality-frontend` (branch from `main`)
- **PR 2:** `fix/code-quality-backend` (branch from `main` — independent of PR 1)

Start each PR on its own branch. They do not depend on each other.

---

## File Map

### PR 1 — Frontend

| Action | Path |
|--------|------|
| Modify | `src/features/auth/logoutUser.ts` |
| Create | `src/features/flashcards/hooks/useFlashcardNavigation.ts` |
| Delete | `src/features/flashcards/useFlashcardNavigation.ts` |
| Modify | `src/features/flashcards/components/FlashcardViewer.tsx` |
| Modify | `src/features/flashcards/__tests__/useFlashcardNavigation.test.ts` |
| Modify | `src/features/auth/loginUser.ts` |
| Modify | `src/features/auth/useLoginForm.ts` |
| Modify | `src/features/auth/__tests__/useLoginForm.test.ts` |
| Modify | `src/components/ui/UserMenu.tsx` |
| Create | `src/components/ui/__tests__/UserMenu.test.tsx` |

### PR 2 — Backend

| Action | Path |
|--------|------|
| Modify | `backend/app/services/auth_service.py` |
| Modify | `backend/app/api/v1/auth.py` |

---

## PR 1 — Frontend

---

### Task 1: Fix `logoutUser.ts` import alias

**Files:**
- Modify: `src/features/auth/logoutUser.ts`

No behavior change — this is a one-line import fix. Verified by type-check.

- [ ] **Step 1: Edit the import**

Replace line 2 in `src/features/auth/logoutUser.ts`:

```typescript
// Before
import { supabase } from "../../lib/supabase";

// After
import { supabase } from "@/lib/supabase";
```

Full file after change:

```typescript
// src/features/auth/logoutUser.ts
import { supabase } from "@/lib/supabase";

export const logoutUser = async () => {
  const { error } = await supabase.auth.signOut();
  return error;
};
```

- [ ] **Step 2: Verify type-check passes**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 3: Run full test suite**

```bash
npm test
```

Expected: all existing tests pass (no behavior changed).

- [ ] **Step 4: Commit**

```bash
git add src/features/auth/logoutUser.ts
git commit -m "fix: use @/ alias in logoutUser.ts"
```

---

### Task 2: Move `useFlashcardNavigation.ts` into `hooks/`

**Files:**
- Create: `src/features/flashcards/hooks/useFlashcardNavigation.ts`
- Delete: `src/features/flashcards/useFlashcardNavigation.ts`
- Modify: `src/features/flashcards/components/FlashcardViewer.tsx:3`
- Modify: `src/features/flashcards/__tests__/useFlashcardNavigation.test.ts:3`

`useFlashcardNavigation` is the only hook in the flashcard feature that lives outside `hooks/`. The three other hooks (`useCardProgress`, `useFlashcardSets`, `useFlashcards`) all live in `hooks/`.

- [ ] **Step 1: Update the test import to the new path (makes test fail)**

In `src/features/flashcards/__tests__/useFlashcardNavigation.test.ts`, change line 3:

```typescript
// Before
import { useFlashcardNavigation } from '../useFlashcardNavigation';

// After
import { useFlashcardNavigation } from '../hooks/useFlashcardNavigation';
```

- [ ] **Step 2: Run the test — verify it fails with a module resolution error**

```bash
npm test -- src/features/flashcards/__tests__/useFlashcardNavigation.test.ts
```

Expected: FAIL — `Cannot find module '../hooks/useFlashcardNavigation'`

- [ ] **Step 3: Create the file at its new location**

Create `src/features/flashcards/hooks/useFlashcardNavigation.ts` with the exact same content as the original:

```typescript
// src/features/flashcards/hooks/useFlashcardNavigation.ts
import { useState, useEffect, useCallback } from "react";

// resetKey defaults to '' for backward compatibility with any existing callers.
// Pass setId to guarantee index reset when switching between same-size sets.
export function useFlashcardNavigation(cardCount: number, resetKey: string = '') {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  // Reset when either cardCount or resetKey changes
  useEffect(() => {
    setCurrentCardIndex(0);
  }, [cardCount, resetKey]);

  const goToPrevious = useCallback(() => {
    if (cardCount === 0) return;
    setCurrentCardIndex((prev) => (prev === 0 ? cardCount - 1 : prev - 1));
  }, [cardCount]);

  const goToNext = useCallback(() => {
    if (cardCount === 0) return;
    setCurrentCardIndex((prev) => (prev === cardCount - 1 ? 0 : prev + 1));
  }, [cardCount]);

  // Keyboard navigation — stable deps via useCallback above
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goToPrevious();
      else if (e.key === "ArrowRight") goToNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToPrevious, goToNext]);

  // Clamp index: safe when cardCount drops to 0 or below current index
  const safeIndex = cardCount === 0 ? 0 : Math.min(currentCardIndex, cardCount - 1);

  return { currentCardIndex: safeIndex, setCurrentCardIndex, goToPrevious, goToNext };
}
```

- [ ] **Step 4: Run the test — verify it passes**

```bash
npm test -- src/features/flashcards/__tests__/useFlashcardNavigation.test.ts
```

Expected: PASS (3 tests).

- [ ] **Step 5: Update the import in `FlashcardViewer.tsx`**

In `src/features/flashcards/components/FlashcardViewer.tsx`, change line 3:

```typescript
// Before
import { useFlashcardNavigation } from '../useFlashcardNavigation';

// After
import { useFlashcardNavigation } from '../hooks/useFlashcardNavigation';
```

- [ ] **Step 6: Delete the old file**

```bash
rm src/features/flashcards/useFlashcardNavigation.ts
```

- [ ] **Step 7: Run the full test suite**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 8: Commit**

```bash
git add src/features/flashcards/hooks/useFlashcardNavigation.ts \
        src/features/flashcards/components/FlashcardViewer.tsx \
        src/features/flashcards/__tests__/useFlashcardNavigation.test.ts
git rm src/features/flashcards/useFlashcardNavigation.ts
git commit -m "refactor: move useFlashcardNavigation into hooks/"
```

---

### Task 3: Decouple login flow

**Files:**
- Modify: `src/features/auth/__tests__/useLoginForm.test.ts`
- Modify: `src/features/auth/loginUser.ts`
- Modify: `src/features/auth/useLoginForm.ts`

**Background:** `loginUser.ts` currently awaits `fetchProfile()` before returning, causing a double-fetch (`AppInitializer`'s `onAuthStateChange` fires `fetchProfile()` again on `SIGNED_IN`). `useLoginForm.ts` then reads `profile` synchronously from the store right after `loginUser()` returns — if profile is null it shows an error toast, even though the user is authenticated. The fix: `loginUser.ts` returns `{ success: true }` as soon as sign-in succeeds; `useLoginForm.ts` navigates unconditionally on success.

- [ ] **Step 1: Update `useLoginForm.test.ts` to capture navigate + add failing test**

Replace the full content of `src/features/auth/__tests__/useLoginForm.test.ts`:

```typescript
/// <reference types="vitest/globals" />
import { renderHook, act } from '@testing-library/react';
import { useLoginForm } from '../useLoginForm';
import { loginUser } from '@/features/auth/loginUser';

const mockNavigate = vi.fn();

vi.mock('@/features/auth/loginUser');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useLoginForm', () => {
  it('formState.isSubmitting is false by default', () => {
    const { result } = renderHook(() => useLoginForm());
    expect(result.current.formState.isSubmitting).toBe(false);
  });

  it('sets server error on password field when loginUser returns success: false', async () => {
    vi.mocked(loginUser).mockResolvedValue({
      success: false,
      message: 'Invalid email or password',
    });
    const { result } = renderHook(() => useLoginForm());

    await act(async () => {
      await result.current.onSubmit({ email: 'a@b.com', password: 'Secure1!' });
    });

    expect(result.current.errors.password?.type).toBe('server');
    expect(result.current.errors.password?.message).toBe('Invalid email or password');
  });

  it('navigates to /home on successful login', async () => {
    vi.mocked(loginUser).mockResolvedValue({ success: true });
    const { result } = renderHook(() => useLoginForm());

    await act(async () => {
      await result.current.onSubmit({ email: 'a@b.com', password: 'Secure1!' });
    });

    expect(mockNavigate).toHaveBeenCalledWith('/home');
  });
});
```

Note: the `useUserStore` mock is removed because after the fix `useLoginForm.ts` will no longer read `profile` from the store.

- [ ] **Step 2: Run the new test — verify it fails**

```bash
npm test -- src/features/auth/__tests__/useLoginForm.test.ts
```

Expected: 2 existing tests pass, the new `navigates to /home` test **FAILS** because the current code checks `profile` (null) and shows an error toast instead of navigating.

- [ ] **Step 3: Update `loginUser.ts`**

Replace the full content of `src/features/auth/loginUser.ts`:

```typescript
import { supabase } from "@/lib/supabase";
import { LoginFormData } from "@/schemas/authSchema";

export const loginUser = async (data: LoginFormData): Promise<{
  success: boolean;
  message?: string;
}> => {
  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true };
};
```

Changes: removed `useUserStore` import and the `await fetchProfile()` call. `AppInitializer`'s `onAuthStateChange` handler is the single trigger for `fetchProfile()` on `SIGNED_IN` — no need to call it here.

- [ ] **Step 4: Update `useLoginForm.ts`**

Replace the `onSubmit` function and remove the `useUserStore` import. Full file after changes:

```typescript
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { loginSchema, LoginFormData } from '@/schemas/authSchema';
import { loginUser } from '@/features/auth/loginUser';

export interface UseLoginFormReturn {
  register: ReturnType<typeof useForm<LoginFormData>>['register'];
  handleSubmit: ReturnType<typeof useForm<LoginFormData>>['handleSubmit'];
  onSubmit: (data: LoginFormData) => Promise<void>;
  errors: ReturnType<typeof useForm<LoginFormData>>['formState']['errors'];
  setError: ReturnType<typeof useForm<LoginFormData>>['setError'];
  formState: {
    touchedFields: ReturnType<typeof useForm<LoginFormData>>['formState']['touchedFields'];
    isSubmitting: boolean;
  };
  getEmailValidationIcon: () => React.ReactNode | null;
  handleEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handlePasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function useLoginForm(): UseLoginFormReturn {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, touchedFields, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  // Clears stale server error when user retypes — mirrors useRegisterForm's handleFieldChange.
  const handleEmailChange = (_e: React.ChangeEvent<HTMLInputElement>) => {
    if (errors.email?.type === 'server') clearErrors('email');
  };

  const handlePasswordChange = (_e: React.ChangeEvent<HTMLInputElement>) => {
    if (errors.password?.type === 'server') clearErrors('password');
  };

  // Check after blur with valid format; X after blur with invalid; null before first blur.
  // Visibility is driven by touchedFields (set by RHF on blur with mode:'onBlur').
  const getEmailValidationIcon = (): React.ReactNode | null => {
    if (!touchedFields.email) return null;
    return errors.email
      ? React.createElement(X, { className: 'w-5 h-5 text-red-500' })
      : React.createElement(Check, { className: 'w-5 h-5 text-green-500' });
  };

  const onSubmit = async (data: LoginFormData) => {
    const result = await loginUser(data);

    if (!result.success) {
      // Server credential errors surface inline below the password field — no toast.
      setError('password', {
        type: 'server',
        message: result.message || 'Invalid email or password',
      });
      return;
    }

    toast.success('Login successful');
    navigate('/home');
  };

  return {
    register,
    handleSubmit,
    onSubmit,
    errors,
    setError,
    formState: { touchedFields, isSubmitting },
    getEmailValidationIcon,
    handleEmailChange,
    handlePasswordChange,
  };
}
```

Changes: removed `useUserStore` import, replaced the profile null-check block (lines 70–76) with `toast.success('Login successful'); navigate('/home');`.

- [ ] **Step 5: Run tests — verify all pass**

```bash
npm test -- src/features/auth/__tests__/useLoginForm.test.ts
```

Expected: PASS (3 tests).

- [ ] **Step 6: Run full test suite**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 7: Commit**

```bash
git add src/features/auth/loginUser.ts \
        src/features/auth/useLoginForm.ts \
        src/features/auth/__tests__/useLoginForm.test.ts
git commit -m "fix: decouple login flow from profile fetch"
```

---

### Task 4: `UserMenu` — show spinner during profile hydration

**Files:**
- Create: `src/components/ui/__tests__/UserMenu.test.tsx`
- Modify: `src/components/ui/UserMenu.tsx`

**Background:** After login navigation, `AppInitializer`'s `onAuthStateChange` fires `fetchProfile()` asynchronously. During the brief window where `profileLoading=true` and `profile=null`, `UserMenu` renders the Login/Register buttons — an authenticated user briefly sees unauthenticated UI. Fix: render a spinner instead.

- [ ] **Step 1: Write the failing test**

Create `src/components/ui/__tests__/UserMenu.test.tsx`:

```typescript
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import UserMenu from '../UserMenu';
import { useUserStore } from '@/stores/useUserStore';

vi.mock('@/stores/useUserStore', () => ({
  useUserStore: vi.fn(),
}));
vi.mock('@/features/auth/logoutUser', () => ({
  logoutUser: vi.fn(),
}));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});
vi.mock('sonner', () => ({ toast: { success: vi.fn() } }));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('@/utils/dom', () => ({ blurActiveElement: vi.fn() }));

const mockUseUserStore = vi.mocked(useUserStore);

beforeEach(() => vi.clearAllMocks());

describe('UserMenu — loading state', () => {
  it('shows a spinner and hides Login/Register when profileLoading is true and profile is null', () => {
    mockUseUserStore.mockReturnValue({
      profile: null,
      profileLoading: true,
      clearProfile: vi.fn(),
    } as any);

    render(<UserMenu />);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('header.nav.login')).not.toBeInTheDocument();
    expect(screen.queryByText('header.nav.register')).not.toBeInTheDocument();
  });
});

describe('UserMenu — unauthenticated state', () => {
  it('shows Login and Register buttons when profile is null and not loading', () => {
    mockUseUserStore.mockReturnValue({
      profile: null,
      profileLoading: false,
      clearProfile: vi.fn(),
    } as any);

    render(<UserMenu />);

    expect(screen.getByText('header.nav.login')).toBeInTheDocument();
    expect(screen.getByText('header.nav.register')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run the test — verify it fails**

```bash
npm test -- src/components/ui/__tests__/UserMenu.test.tsx
```

Expected: FAIL — the loading test fails because `UserMenu` currently renders Login/Register buttons (not a spinner) when `profile` is null, regardless of `profileLoading`.

- [ ] **Step 3: Update `UserMenu.tsx`**

Replace the full content of `src/components/ui/UserMenu.tsx`:

```typescript
import { useUserStore } from "@/stores/useUserStore";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "@/features/auth/logoutUser";
import { toast } from "sonner";
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from "@headlessui/react";
import { Fragment } from "react";
import { blurActiveElement } from "@/utils/dom";
import Button from "@/components/ui/Button";
import { useTranslation } from "react-i18next";
import { UserPlus } from "lucide-react";

interface UserMenuProps {
  mobile?: boolean;
}

export default function UserMenu({ mobile = false }: UserMenuProps) {
  const { profile, profileLoading, clearProfile } = useUserStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = async () => {
    const error = await logoutUser();
    if (!error) {
      clearProfile();
      toast.success(t("logout.success") || "Logout Successful");
      blurActiveElement();
      navigate("/login");
    }
  };

  // Profile is being fetched after login navigation — avoid flashing unauthenticated UI.
  if (profileLoading && !profile) {
    return (
      <div
        role="status"
        aria-label="Loading"
        className="w-9 h-9 rounded-full border-2 border-primary-200 border-t-primary-500 animate-spin"
      />
    );
  }

  // Logged-out state: show Login + Register buttons
  if (!profile) {
    return (
      <div className="flex flex-col gap-2 w-full sm:flex-row sm:items-center sm:justify-end">
        <Button
          fullWidth
          size="sm"
          to="/login"
          variant="outline"
          className="
          bg-blue-600 
          text-white 
          border border-blue-600 
          hover:bg-blue-700 
          dark:bg-transparent 
          dark:border-blue-400 
          dark:text-blue-400 
          dark:hover:bg-blue-500 
          dark:hover:text-white 
          transition
          "
        >
          {t("header.nav.login")}
        </Button>

        <Button
          fullWidth
          size="sm"
          to="/register"
          variant="primary"
          iconRight={<UserPlus className="w-4 h-4" />}
        >
          {t("header.nav.register")}
        </Button>
      </div>
    );
  }

  const initial = profile.first_name.charAt(0).toUpperCase();

  // Mobile version: simplified logout
  if (mobile) {
    return (
      <button
        onClick={handleLogout}
        className="text-sm text-red-600 hover:underline"
      >
        {t("header.nav.logout")}
      </button>
    );
  }

  // Logged-in desktop version: avatar dropdown
  return (
    <Menu as="div" className="relative inline-block text-left">
      <MenuButton className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary-500 text-white font-bold">
        {initial}
      </MenuButton>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <MenuItems className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">
            <div className="font-medium px-1 py-1">
              {profile.first_name} {profile.last_name}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {profile.email}
            </div>
          </div>

          <div className="px-1 py-1">
            <MenuItem>
              {({ active }) => (
                <button
                  onClick={() => {
                    navigate('/home');
                  }}
                  className={`${
                    active ? "bg-gray-100 dark:bg-gray-700" : ""
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-900 dark:text-gray-100`}
                >
                  {t("header.nav.dashboard")}
                </button>
              )}
            </MenuItem>
          </div>

          <div className="px-1 py-1">
            <MenuItem>
              {({ active }) => (
                <button
                  onClick={handleLogout}
                  className={`${
                    active
                      ? "bg-red-500 text-white"
                      : "text-gray-900 dark:text-gray-100"
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                >
                  {t("header.nav.logout")}
                </button>
              )}
            </MenuItem>
          </div>
        </MenuItems>
      </Transition>
    </Menu>
  );
}
```

Changes: added `profileLoading` to the destructure; added the `if (profileLoading && !profile)` guard before the `if (!profile)` guard.

- [ ] **Step 4: Run the test — verify it passes**

```bash
npm test -- src/components/ui/__tests__/UserMenu.test.tsx
```

Expected: PASS (2 tests).

- [ ] **Step 5: Run full test suite**

```bash
npm test
```

Expected: all tests pass.

- [ ] **Step 6: Type-check**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/components/ui/UserMenu.tsx \
        src/components/ui/__tests__/UserMenu.test.tsx
git commit -m "fix: show spinner in UserMenu during profile hydration"
```

---

## PR 2 — Backend

Start on a fresh branch from `main`:

```bash
git checkout main
git checkout -b fix/code-quality-backend
```

Activate the backend virtualenv before running any Python commands:

```bash
cd backend
source venv/bin/activate
```

---

### Task 5: Fix deprecated `datetime.utcnow()`

**Files:**
- Modify: `backend/app/services/auth_service.py`

`datetime.utcnow()` is deprecated in Python 3.12 — it returns a naive datetime (no timezone info). `datetime.now(timezone.utc)` returns a timezone-aware datetime and is the correct replacement.

- [ ] **Step 1: Update the import and the call**

In `backend/app/services/auth_service.py`, change line 1:

```python
# Before
from datetime import datetime

# After
from datetime import datetime, timezone
```

Then change line 92 (inside `login_user`):

```python
# Before
"last_login": datetime.utcnow().isoformat()

# After
"last_login": datetime.now(timezone.utc).isoformat()
```

- [ ] **Step 2: Verify no syntax errors**

```bash
python -c "from app.services.auth_service import AuthService; print('OK')"
```

Expected: `OK`

- [ ] **Step 3: Commit**

```bash
git add backend/app/services/auth_service.py
git commit -m "fix: replace deprecated datetime.utcnow() with timezone-aware equivalent"
```

---

### Task 6: Replace `print()` with structured logging

**Files:**
- Modify: `backend/app/services/auth_service.py`
- Modify: `backend/app/api/v1/auth.py`

The `/auth/login` route in `auth.py` is being removed in Task 8. Do not bother replacing its print — that code goes away entirely.

**`auth_service.py` changes:**

- [ ] **Step 1: Add logger to `auth_service.py` and replace 2 prints**

Add after the imports block (after line 4, `from ..utils.exceptions import AuthException`):

```python
import logging
logger = logging.getLogger(__name__)
```

Replace line 16:
```python
# Before
print(f"Error checking username availability: {e}")

# After
logger.warning("Error checking username availability: %s", e)
```

Replace line 60:
```python
# Before
print(f"Warning: failed to write native_language for {auth_response.user.id}: {e}")

# After
logger.warning("Failed to write native_language for %s: %s", auth_response.user.id, e)
```

Full `auth_service.py` after all changes in Tasks 5 and 6:

```python
from datetime import datetime, timezone
from supabase import Client
from ..models.auth import UserRegister, UserLogin
from ..utils.exceptions import AuthException
import logging

logger = logging.getLogger(__name__)


class AuthService:
    def __init__(self, supabase: Client):
        self.supabase = supabase
    
    async def check_username_availability(self, username: str) -> bool:
        """Check if username is available"""
        try:
            response = self.supabase.table('profiles').select('username').eq('username', username).execute()
            return len(response.data) == 0
        except Exception as e:
            logger.warning("Error checking username availability: %s", e)
            # For safety, assume unavailable if we can't check
            return False
    
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

        # Write native_language if provided. This is a best-effort write;
        # the user account already exists if we reach here.
        if user_data.native_language is not None:
            try:
                self.supabase.table('profiles').update(
                    {"native_language": user_data.native_language}
                ).eq('id', auth_response.user.id).execute()
            except Exception as e:
                logger.warning("Failed to write native_language for %s: %s", auth_response.user.id, e)
                # Non-fatal: user can set language later via PATCH /profile

        # profiles + user_stats are created synchronously by the handle_new_user
        # trigger during the create_user call above — they exist by the time we return.
        return {
            "success": True,
            "message": "Account created successfully! Please log in to continue.",
        }

    # NOTE: login_user() is not currently wired to an HTTP endpoint.
    # A /auth/login route is planned for server-mediated flows:
    # org membership enforcement, invite-only access, and admin tooling.
    async def login_user(self, login_data: UserLogin) -> dict:
        """Login user and return JWT token"""
        try:
            # Use Supabase auth to verify credentials
            auth_response = self.supabase.auth.sign_in_with_password({
                "email": login_data.email,
                "password": login_data.password
            })
            
            if not auth_response.user:
                raise AuthException("Invalid email or password", field="email")
            
            # Get user profile
            profile_response = self.supabase.table('profiles').select('*').eq('id', auth_response.user.id).single().execute()
            
            if not profile_response.data:
                raise AuthException("User profile not found")
            
            profile = profile_response.data
            
            # Update last login
            self.supabase.table('user_stats').update({
                "last_login": datetime.now(timezone.utc).isoformat()
            }).eq('user_id', auth_response.user.id).execute()
            
            return {
                "access_token": auth_response.session.access_token,
                "token_type": "bearer",
                "user": {
                    "id": profile["id"],
                    "email": profile["email"],
                    "username": profile["username"],
                    "first_name": profile["first_name"],
                    "last_name": profile["last_name"],
                    "native_language": profile.get("native_language")
                }
            }
            
        except AuthException:
            raise
        except Exception as e:
            error_message = str(e).lower()
            if "invalid" in error_message or "credentials" in error_message:
                raise AuthException("Invalid email or password", field="email")
            raise AuthException(f"Login failed: {str(e)}")
```

Note: the `# NOTE: login_user()...` comment is placed here in Task 6 alongside the other auth_service changes. Task 8 does not touch auth_service.py.

**`auth.py` changes:**

- [ ] **Step 2: Add logger to `auth.py` and replace 3 prints**

(Skip the print inside the `/login` route — that route is deleted in Task 8.)

Add after the imports block (after line 6, `from ...utils.exceptions import AuthException`):

```python
import logging

logger = logging.getLogger(__name__)
```

Replace the print in the `/register` exception handler (currently line 30):
```python
# Before
print(f"Unexpected error in register_user: {e}")

# After
logger.error("Unexpected error in register_user: %s", e)
```

Replace the print in the `/check-username` exception handler (currently line 82):
```python
# Before
print(f"Error checking username availability: {e}")

# After
logger.error("Error checking username availability: %s", e)
```

Replace the print in the `update_profile` exception handler (currently line 142):
```python
# Before
print(f"Unexpected error in update_profile: {e}")

# After
logger.error("Unexpected error in update_profile: %s", e)
```

- [ ] **Step 3: Verify no syntax errors**

```bash
python -c "from app.api.v1.auth import router; print('OK')"
```

Expected: `OK`

- [ ] **Step 4: Commit**

```bash
git add backend/app/services/auth_service.py backend/app/api/v1/auth.py
git commit -m "fix: replace print() with logging module in backend"
```

---

### Task 7: `AuthService` as a FastAPI dependency

**Files:**
- Modify: `backend/app/api/v1/auth.py`

Currently `/register` and `/check-username` each instantiate `AuthService` inline. Extract it into a `get_auth_service` dependency so routes receive a ready-made service via `Depends()`.

The `/profile` PATCH uses `supabase` directly (not `AuthService`) — leave it unchanged.

- [ ] **Step 1: Add `get_auth_service` dependency and update route signatures**

After the existing imports in `auth.py`, add the dependency function. Then update `/register` and `/check-username`. Full updated `auth.py` (after Tasks 5, 6, and 7):

```python
from fastapi import APIRouter, Depends, HTTPException, status, Header
from ...models.auth import UserRegister, MessageResponse, UsernameCheckResponse, UpdateProfile, ProfileResponse
from ...services.auth_service import AuthService
from ...core.supabase import get_supabase_admin
from ...utils.exceptions import AuthException
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["authentication"])


def get_auth_service(supabase=Depends(get_supabase_admin)) -> AuthService:
    return AuthService(supabase)


@router.post("/register", response_model=MessageResponse)
async def register_user(
    user_data: UserRegister,
    auth_service: AuthService = Depends(get_auth_service),
):
    """Register a new user account"""
    try:
        result = await auth_service.register_user(user_data)
        return MessageResponse(**result)
        
    except AuthException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "message": e.message,
                "field": e.field
            }
        )
    except Exception as e:
        logger.error("Unexpected error in register_user: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "message": "An unexpected error occurred"
            }
        )


@router.post("/login", response_model=None)
async def login_user(
    supabase = Depends(get_supabase_admin)
):
    """Login endpoint placeholder — removed in next task"""
    pass


@router.get("/check-username/{username}", response_model=UsernameCheckResponse)
async def check_username_availability(
    username: str,
    auth_service: AuthService = Depends(get_auth_service),
):
    """Check if username is available"""
    try:
        is_available = await auth_service.check_username_availability(username)
        return UsernameCheckResponse(available=is_available)
        
    except Exception as e:
        logger.error("Error checking username availability: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"message": "Error checking username availability"}
        )


@router.post("/logout")
async def logout_user():
    """Logout user (client-side token removal)"""
    return {"success": True, "message": "Logged out successfully"}


async def _get_user_id_from_token(
    authorization: str = Header(..., alias="Authorization"),
    supabase=Depends(get_supabase_admin),
) -> str:
    """Verify Supabase JWT and return user_id. Raises 401 on failure."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"success": False, "message": "Invalid authorization header"},
        )
    token = authorization.removeprefix("Bearer ")
    try:
        user_response = supabase.auth.get_user(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"success": False, "message": "Invalid or expired token"},
        )
    if not user_response.user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"success": False, "message": "Invalid or expired token"},
        )
    return user_response.user.id


@router.patch("/profile", response_model=ProfileResponse)
async def update_profile(
    profile_data: UpdateProfile,
    user_id: str = Depends(_get_user_id_from_token),
    supabase=Depends(get_supabase_admin),
):
    """Update the authenticated user's profile."""
    try:
        result = supabase.table('profiles').update(
            {"native_language": profile_data.native_language}
        ).eq('id', user_id).select('id, username, first_name, last_name, native_language').single().execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"success": False, "message": "Profile not found"},
            )

        return ProfileResponse(**result.data)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Unexpected error in update_profile: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "message": "An unexpected error occurred"},
        )
```

Note: the `/login` route is left as a stub here so that `TokenResponse` and `UserLogin` imports can be cleanly removed in Task 8 when the route is deleted entirely.

Also note: `UserLogin` and `TokenResponse` are **not** in the import line above — they were removed here already since the `/login` route body is now empty. Task 8 will delete the stub handler.

- [ ] **Step 2: Verify no syntax errors**

```bash
python -c "from app.api.v1.auth import router; print('OK')"
```

Expected: `OK`

- [ ] **Step 3: Start the dev server and confirm FastAPI docs load**

```bash
python run.py &
sleep 2
curl -s http://localhost:8000/docs | grep -c "swagger" && echo "Docs OK"
kill %1
```

Expected: a non-zero count and `Docs OK`.

- [ ] **Step 4: Commit**

```bash
git add backend/app/api/v1/auth.py
git commit -m "refactor: inject AuthService via FastAPI Depends()"
```

---

### Task 8: Remove `/auth/login` endpoint

**Files:**
- Modify: `backend/app/api/v1/auth.py`
- Modify: `backend/app/services/auth_service.py`

The frontend authenticates directly via Supabase — the `/auth/login` route is unused. `login_user()` on `AuthService` is kept; it will be re-wired when a server-mediated auth flow is needed.

The `# NOTE:` comment above `login_user()` was already added in Task 6. No further changes to `auth_service.py` are needed.

- [ ] **Step 1: Delete the `/login` stub and clean up unused imports in `auth.py`**

Remove the stub login route added in Task 7. The final `auth.py`:

```python
from fastapi import APIRouter, Depends, HTTPException, status, Header
from ...models.auth import UserRegister, MessageResponse, UsernameCheckResponse, UpdateProfile, ProfileResponse
from ...services.auth_service import AuthService
from ...core.supabase import get_supabase_admin
from ...utils.exceptions import AuthException
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["authentication"])


def get_auth_service(supabase=Depends(get_supabase_admin)) -> AuthService:
    return AuthService(supabase)


@router.post("/register", response_model=MessageResponse)
async def register_user(
    user_data: UserRegister,
    auth_service: AuthService = Depends(get_auth_service),
):
    """Register a new user account"""
    try:
        result = await auth_service.register_user(user_data)
        return MessageResponse(**result)
        
    except AuthException as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "success": False,
                "message": e.message,
                "field": e.field
            }
        )
    except Exception as e:
        logger.error("Unexpected error in register_user: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "success": False,
                "message": "An unexpected error occurred"
            }
        )


@router.get("/check-username/{username}", response_model=UsernameCheckResponse)
async def check_username_availability(
    username: str,
    auth_service: AuthService = Depends(get_auth_service),
):
    """Check if username is available"""
    try:
        is_available = await auth_service.check_username_availability(username)
        return UsernameCheckResponse(available=is_available)
        
    except Exception as e:
        logger.error("Error checking username availability: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"message": "Error checking username availability"}
        )


@router.post("/logout")
async def logout_user():
    """Logout user (client-side token removal)"""
    return {"success": True, "message": "Logged out successfully"}


async def _get_user_id_from_token(
    authorization: str = Header(..., alias="Authorization"),
    supabase=Depends(get_supabase_admin),
) -> str:
    """Verify Supabase JWT and return user_id. Raises 401 on failure."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"success": False, "message": "Invalid authorization header"},
        )
    token = authorization.removeprefix("Bearer ")
    try:
        user_response = supabase.auth.get_user(token)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"success": False, "message": "Invalid or expired token"},
        )
    if not user_response.user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"success": False, "message": "Invalid or expired token"},
        )
    return user_response.user.id


@router.patch("/profile", response_model=ProfileResponse)
async def update_profile(
    profile_data: UpdateProfile,
    user_id: str = Depends(_get_user_id_from_token),
    supabase=Depends(get_supabase_admin),
):
    """Update the authenticated user's profile."""
    try:
        result = supabase.table('profiles').update(
            {"native_language": profile_data.native_language}
        ).eq('id', user_id).select('id, username, first_name, last_name, native_language').single().execute()

        if not result.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail={"success": False, "message": "Profile not found"},
            )

        return ProfileResponse(**result.data)

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Unexpected error in update_profile: %s", e)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "message": "An unexpected error occurred"},
        )
```

- [ ] **Step 2: Verify no syntax errors and routes look correct**

```bash
python -c "from app.api.v1.auth import router; routes = [r.path for r in router.routes]; print(routes)"
```

Expected output should include `/auth/register`, `/auth/check-username/{username}`, `/auth/logout`, `/auth/profile` — and NOT `/auth/login`.

- [ ] **Step 3: Commit**

```bash
git add backend/app/api/v1/auth.py
git commit -m "fix: remove unused /auth/login endpoint"
```

---

## Self-Review

**Spec coverage check:**

| Spec requirement | Task |
|-----------------|------|
| `logoutUser.ts` relative import → `@/lib/supabase` | Task 1 |
| Move `useFlashcardNavigation.ts` → `hooks/`, update FlashcardViewer import | Task 2 |
| Remove `await fetchProfile()` from `loginUser.ts` | Task 3 |
| Remove sync profile null-check from `useLoginForm.ts:70-76`, navigate unconditionally | Task 3 |
| `UserMenu.tsx` — spinner when `profileLoading && !profile` | Task 4 |
| `datetime.utcnow()` → `datetime.now(timezone.utc)` in `auth_service.py:93` | Task 5 |
| Replace `print()` with logging in both backend files | Task 6 |
| `AuthService` → FastAPI `Depends()` for `/register` and `/check-username` | Task 7 |
| Remove `/auth/login` endpoint; keep `login_user()` with comment | Task 8 |

All spec items covered. ✓

**Placeholder scan:** No TBDs, no "handle edge cases", no missing code blocks. ✓

**Type consistency:**
- `AuthService` — constructed in `get_auth_service`, referenced as `auth_service: AuthService` in route params ✓
- `useFlashcardNavigation` — exported from new path, import path updated in test and viewer ✓
- `profileLoading` — exists on `UserStore` type and used correctly in `UserMenu` ✓
