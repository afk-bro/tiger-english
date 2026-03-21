# Google OAuth — Design Spec

**Date:** 2026-03-20
**Status:** Approved

---

## Overview

Add "Continue with Google" sign-in to the Login and Register pages. New users who sign up via Google get auto-provisioned with a `profiles` row and `user_stats` row via a Postgres trigger. Email/password registration is unchanged in user experience but simplified internally — FastAPI stops directly inserting into `profiles`/`user_stats` and instead passes user metadata when creating the Supabase auth user; the trigger handles all provisioning from one place.

---

## 1. Database — Postgres Trigger

### Canonical provisioning rule

This trigger is the **single provisioning path** for all `auth.users`. App code (FastAPI, frontend) must never directly insert into `public.profiles` or `public.user_stats` during registration. FastAPI may pass `username`, `first_name`, `last_name` via `user_metadata`; the trigger applies explicit precedence rules defined below.

### Migration file

New file: `supabase/migrations/20260320000001_google_oauth_provisioning.sql`

### RLS and SECURITY DEFINER

The trigger function uses `SECURITY DEFINER`, which causes it to execute as the function owner (the `postgres` superuser role). This bypasses RLS entirely, allowing the trigger to write to `public.profiles` and `public.user_stats` without any insert policy on those tables. **No new RLS policies are needed** — the existing "no insert policy = blocked for anon/authenticated" design on those tables is preserved and correct. The trigger's superuser execution is the intended bypass mechanism.

### Trigger function skeleton

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
-- ...
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### Field precedence rules

| Field | Source priority |
|---|---|
| `username` | See "Username paths" below |
| `first_name` | `raw_user_meta_data.first_name` → else first token of `full_name` → else email prefix |
| `last_name` | `raw_user_meta_data.last_name` → else remaining `full_name` tokens joined → else `''` |
| `email` | Always read from `NEW.email` (the auth user record directly, not from `raw_user_meta_data`) |

### Username paths (two distinct procedures)

**Path A — metadata passthrough** (used when `raw_user_meta_data.username` is present):
- Lowercase and trim the value
- If non-empty → use as-is, **no suffix appended**
- If empty after trim → fall through to Path B
- This path applies to FastAPI-registered users whose chosen username is already validated and unique

**Path B — email-to-username generation** (used when no username in metadata, i.e. Google OAuth):
1. Take the email prefix (part before `@` from `NEW.email`)
2. Lowercase
3. Replace all non-alphanumeric characters with `_`
4. Collapse repeated underscores (`__+` → `_`)
5. Trim leading and trailing underscores
6. Truncate to 15 characters
7. If empty after all steps → fallback to `user`
8. Append `_` + 6-char random hex suffix (e.g. `john_doe_a3f9c1`)

### Name splitting

Best-effort only. Split `raw_user_meta_data.full_name` on whitespace:
- `first_name` = tokens[0]
- `last_name` = tokens[1..] joined with a space
- Single-word names, middle names, non-Western formats, and missing values are all handled without error — first token / remainder is always safe. An empty result is fine.

### Retry loop structure

The retry loop wraps only the `profiles` INSERT, since that is where username uniqueness is enforced. `user_stats` is inserted once, after the retry loop exits successfully.

Idempotency for the `id` primary key is handled with an existence check **before** the loop, keeping the INSERT inside the loop to a single conflict target (username only). This avoids the invalid Postgres pattern of two `ON CONFLICT` clauses on one statement.

```
-- Idempotency guard: if a profile row already exists for this user, skip provisioning
IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
  -- Ensure user_stats also exists (belt-and-suspenders)
  INSERT INTO public.user_stats (user_id, xp, level, study_streak, last_login)
    VALUES (NEW.id, 0, 1, 0, NOW())
    ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END IF;

-- Retry loop: only username uniqueness can conflict here
FOR i IN 1..5 LOOP
  generate candidate username (Path A or B as appropriate)

  BEGIN
    INSERT INTO public.profiles (id, email, first_name, last_name, username)
      VALUES (NEW.id, NEW.email, v_first, v_last, v_username);
    EXIT;  -- insert succeeded, leave loop
  EXCEPTION WHEN unique_violation THEN
    -- username conflict; regenerate suffix on next iteration
    -- (Path A users: conflict here is a genuine duplicate-registration race, also retried)
    NULL;
  END;
END LOOP;

IF profile was never inserted THEN
  RAISE EXCEPTION 'handle_new_user: could not generate unique username after 5 attempts';
END IF;

-- Insert user_stats once, after profiles succeeds
INSERT INTO public.user_stats (user_id, xp, level, study_streak, last_login)
  VALUES (NEW.id, 0, 1, 0, NOW())
  ON CONFLICT (user_id) DO NOTHING;  -- single conflict target, valid syntax
```

### Canonical defaults (single source of truth)

```
xp            = 0
level         = 1
study_streak  = 0
last_login    = NOW()
```

These values must not be duplicated in FastAPI. FastAPI must never drift from these.

---

## 2. Backend — FastAPI Changes

### `register_user` simplification

`AuthService.register_user()` currently:
1. Pre-checks username
2. Creates Supabase auth user
3. Inserts into `profiles`
4. Inserts into `user_stats`
5. Rolls back on failure

**After this change:**
1. Pre-checks username (unchanged)
2. Creates Supabase auth user with `user_metadata = { username, first_name, last_name }` — trigger reads these via Path A
3. ~~Inserts into `profiles`~~ — handled by trigger
4. ~~Inserts into `user_stats`~~ — handled by trigger
5. Rollback simplifies to: delete auth user if step 2 fails (no profile/stats to clean up)

---

## 3. Frontend

### `fetchProfile` behaviour change (prerequisite)

Currently `fetchProfile` sets `store.error` when the Supabase query returns no rows (PGRST116). This must be changed: **"no profile row found" is not an error — it is a transient state** (the trigger may not have committed yet). `fetchProfile` should set `profile: null, error: null` for PGRST116, and only set `error` for genuine network/auth failures. This prevents the store error state from being poisoned during the OAuth callback window.

### `GoogleAuthButton` component

`src/components/ui/GoogleAuthButton.tsx`

- Renders Google logo SVG + "Continue with Google" text
- Computes `redirectTo` **on click** (not at module load):
  ```ts
  redirectTo: window.location.origin + '/auth/callback'
  ```
- Calls `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } })`
- Shows loading state while OAuth redirect is initiating
- Handles and surfaces errors returned by `signInWithOAuth`

### Login + Register pages

- Add `<GoogleAuthButton />` above the email/password form
- Separate with an "or" divider
- Button text: **"Continue with Google"** on both pages

### `/auth/callback` route + page

`src/pages/AuthCallback.tsx` — registered in the router as `/auth/callback`.

This page must never be server-rendered. It reads `window.location` and Supabase client state.

**Session wait mechanism:**

Subscribe to `supabase.auth.onAuthStateChange` on mount. If a `SIGNED_IN` event arrives within 3 seconds, proceed to profile polling. If the 3-second timeout fires first, enter `auth_error` state. Do not poll `getSession()` — the event subscription is the correct mechanism for post-OAuth-redirect detection.

**Profile polling:**

`AppInitializer` (which is mounted above this page) will call `fetchProfile` when `SIGNED_IN` fires. `AuthCallback` watches the Zustand store (`useUserStore`) for `profile.username` to become set — it does not need to call `fetchProfile` itself. However, if `AppInitializer`'s call races with the trigger (profile row not yet committed), `fetchProfile` returns `profile: null, error: null` (see prerequisite above), and the store remains in a "no profile yet" state. `AuthCallback` retries by checking the store every 300ms until `profile.username` is set or the 10s timeout fires.

**State machine:**

| State | Condition | UI |
|---|---|---|
| `checking` | Initial mount, awaiting `SIGNED_IN` event | Spinner + "Signing you in…" |
| `auth_error` | `?error=` in URL, or no session event within 3s, or session exists but store has a genuine error | "Authentication failed" + link to `/login` |
| `waiting_profile` | Session confirmed, polling store for `profile.username` | Spinner + "Setting up your account…" |
| `timeout` | `profile.username` still null after 10s | "Taking longer than expected" + retry button + link to `/login` |
| `success` | `profile.username` is set | Redirect to `/u/{username}` |

**Detailed logic:**

1. On mount: parse URL for `?error=` params → immediately enter `auth_error` if present
2. Subscribe to `onAuthStateChange`; set a 3s timeout
3. `SIGNED_IN` fires → cancel timeout → enter `waiting_profile`
4. Timeout fires first → enter `auth_error`
5. In `waiting_profile`: read `useUserStore` every 300ms
6. `profile.username` is set → enter `success` → navigate to `/u/${profile.username}`
7. `store.error` is set (genuine failure) → enter `auth_error`
8. After 10s in `waiting_profile` → enter `timeout`

**Retry button behaviour:**

- Resets the 10s polling timer from the moment of click
- Re-checks that a session still exists (`supabase.auth.getSession()`) before resuming
- If session gone → enter `auth_error`
- If session present → re-enter `waiting_profile` and resume 300ms polling
- Number of retries is unbounded; this is intentional (user may retry as many times as they like)

---

## 4. What Does Not Change

- Email/password login flow — unchanged
- `AppInitializer` session restoration logic — unchanged
- `UserLayout` route guard — unchanged
- Zustand store shape — unchanged (only `fetchProfile` error handling changes)
- All existing FastAPI endpoints except `register_user` internals

---

## 5. Out of Scope

- Linking Google to an existing email/password account
- Allowing users to change their auto-generated username
- Displaying or editing the Google profile avatar
- Rate-limiting the retry button
