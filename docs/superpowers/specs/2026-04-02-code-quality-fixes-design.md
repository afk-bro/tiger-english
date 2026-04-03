# Code Quality Fixes — Design Spec
_2026-04-02_

## Scope

Two PRs: one frontend, one backend. No feature work. No mock-data wiring. No stub-route completion.

---

## PR 1 — Frontend

### 1. `logoutUser.ts` — fix relative import

**File:** `src/features/auth/logoutUser.ts`

Change `../../lib/supabase` to `@/lib/supabase`. Every other file in the codebase uses the path alias; this one was missed.

---

### 2. Move `useFlashcardNavigation.ts` into `hooks/`

**Files affected:**
- Move: `src/features/flashcards/useFlashcardNavigation.ts` → `src/features/flashcards/hooks/useFlashcardNavigation.ts`
- Update import in: `src/features/flashcards/components/FlashcardViewer.tsx`

All other hooks in the flashcard feature (`useCardProgress`, `useFlashcardSets`, `useFlashcards`) live in `hooks/`. This file was misplaced.

---

### 3. Login flow decoupling

**Contract:**
- Successful login means "session created". Profile availability is an asynchronous follow-up concern handled by `AppInitializer`.
- `AppInitializer.onAuthStateChange` is the single trigger for `fetchProfile()` on sign-in, for both email/password and OAuth redirect paths.
- No UI may assume `profile` is non-null immediately after `loginUser()` returns.

**Current problem:** `loginUser.ts` awaits `fetchProfile()` before returning, and `useLoginForm.ts` reads `profile` synchronously from the store right after. This is a tight coupling that also causes a double fetch (`AppInitializer` fires `fetchProfile()` again when `SIGNED_IN` fires).

**Files changed:**

`src/features/auth/loginUser.ts`
- Remove `await fetchProfile()`. Return `{ success: true }` as soon as `signInWithPassword` resolves without error.

`src/features/auth/useLoginForm.ts` (lines 70–76)
- Remove the synchronous `useUserStore.getState().profile` check.
- Navigate to `/home` unconditionally when `result.success` is true.
- Remove the `toast.error('Profile not found after login')` branch — this error state is no longer reachable and was misleading (user was authenticated but would see a login-failure message).

`src/components/ui/UserMenu.tsx`
- Read `profileLoading` from `useUserStore` alongside `profile`.
- When `profileLoading && !profile`: render a small spinner/skeleton instead of the Login/Register buttons.
- This prevents an authenticated user from briefly seeing unauthenticated UI in the header during the async hydration window after login navigation.

**OAuth path (`AuthCallback.tsx`) is unchanged.** It already polls `fetchProfile()` independently and only navigates once `profile?.username` is truthy. No changes needed.

---

## PR 2 — Backend

### 1. Fix deprecated `datetime.utcnow()`

**File:** `backend/app/services/auth_service.py:93`

Replace `datetime.utcnow().isoformat()` with `datetime.now(timezone.utc).isoformat()`. `utcnow()` is deprecated in Python 3.12 and returns a naive datetime; `now(timezone.utc)` returns a timezone-aware datetime.

---

### 2. Replace `print()` with structured logging

**Files:** `backend/app/services/auth_service.py`, `backend/app/api/v1/auth.py`

Replace all `print(f"...")` error/warning calls with Python's `logging` module:

```python
import logging
logger = logging.getLogger(__name__)

# error-level for unexpected exceptions
logger.error("Unexpected error in register_user: %s", e)

# warning-level for non-fatal (e.g. native_language write failure)
logger.warning("Failed to write native_language for %s: %s", user_id, e)
```

One `logger = logging.getLogger(__name__)` per module. No other changes to exception handling.

---

### 3. `AuthService` as a FastAPI dependency

**File:** `backend/app/api/v1/auth.py`

Extract `AuthService` instantiation into a reusable dependency:

```python
def get_auth_service(supabase=Depends(get_supabase_admin)) -> AuthService:
    return AuthService(supabase)
```

Route signatures change from:
```python
async def register_user(user_data: UserRegister, supabase=Depends(get_supabase_admin)):
    auth_service = AuthService(supabase)
```
to:
```python
async def register_user(user_data: UserRegister, auth_service: AuthService = Depends(get_auth_service)):
```

Applies to `/register`, `/check-username/{username}`. The `/profile` PATCH route uses `supabase` directly (not `AuthService`) so it stays as-is.

---

### 4. Remove `/auth/login` endpoint

**File:** `backend/app/api/v1/auth.py`

Remove the `@router.post("/login")` route handler entirely. The frontend authenticates directly via Supabase and does not call this endpoint.

Add a comment in `auth_service.py` above `login_user()` to preserve the intent:

```python
# NOTE: login_user() is not currently wired to an HTTP endpoint.
# A /auth/login route is planned for server-mediated flows:
# org membership enforcement, invite-only access, and admin tooling.
```

The `login_user()` method on `AuthService` is kept in place — it contains the verified implementation and will be re-wired when the access-control layer is built.

---

## What is explicitly out of scope

- Connecting Dashboard or AuthHome to real data (mock data remains)
- Implementing any stub routes
- Any changes to `AuthCallback.tsx`
- Database schema changes
- Test changes beyond what breaks due to the above
