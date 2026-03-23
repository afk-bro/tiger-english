# Flashcard Translations Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add per-language native translations for flashcard sets so Thai, Chinese, and Vietnamese users see the same set with their own native text, with language captured at registration and changeable in Settings.

**Architecture:** A `flashcard_translations` table stores one reviewed translation per card+language (FK to a new `languages` reference table). Translations are fetched alongside cards (no language filter on the query — filtered in the mapper to preserve LEFT JOIN semantics). The user's `native_language` is stored on `profiles`, captured at registration via an optional selector, and changeable via `PATCH /profile` (JWT-verified). Dev-time scripts generate translations via the Claude API (Haiku) for human review before committing as a migration.

**Tech Stack:** Supabase migrations (SQL), Python/FastAPI (backend), TypeScript/React/Zustand/React Hook Form (frontend), Vitest (frontend tests), tsx/Node.js (dev scripts), `@anthropic-ai/sdk` (translation scripts)

---

## File Structure

**New files:**
- `supabase/migrations/20260323000001_flashcard_translations.sql` — languages table, flashcard_translations table, RLS, grants, curated set backfill, drop native_audio_url, add profiles.native_language
- `backend/app/core/languages.py` — SUPPORTED_LANGUAGES constant + validate_native_language
- `src/pages/Settings.tsx` — language change UI
- `scripts/generate-translations.ts` — calls Claude API, writes review CSVs
- `scripts/generate-translations-migration.ts` — reads reviewed CSVs, emits SQL migration

**Modified files:**
- `backend/app/models/auth.py` — add `native_language` to `UserRegister`, add `UpdateProfile` model
- `backend/app/services/auth_service.py` — write `native_language` after `create_user`
- `backend/app/api/v1/auth.py` — add `PATCH /profile` endpoint
- `src/features/flashcards/types.ts` — `TranslationRow` type, updated `CardRow`, `nativeText: string | null`, `nativeAudioUrl: string | null`, `mapCard(row, languageCode)`
- `src/features/flashcards/api/flashcards.ts` — embed `flashcard_translations` in card query, `getCardsBySet(setId, languageCode)`
- `src/features/flashcards/hooks/useFlashcards.ts` — `useFlashcards(setId, languageCode)` with null guard
- `src/features/flashcards/__tests__/mappers.test.ts` — update mapCard tests for new signature
- `src/features/flashcards/__tests__/api.test.ts` — update getCardsBySet mock for embedded translations
- `src/features/flashcards/__tests__/useFlashcards.test.ts` — update for languageCode param
- `src/stores/useUserStore.ts` — `native_language` on profile type, `setNativeLanguage` action, select it in fetchProfile
- `src/schemas/authSchema.ts` — add optional `native_language` field
- `src/lib/api/auth.ts` — add `updateProfile` method
- `src/components/flashcards/Flashcard.tsx` — null `nativeText` placeholder state
- `src/pages/FlashcardsPage.tsx` — language resolution + pass to useFlashcards
- `src/pages/Register.tsx` — language selector with browser locale detection
- `src/App.tsx` — add `/settings` route
- `src/locales/en/en.json` — language selector strings
- `src/locales/th/th.json` — language selector strings

---

## Task 1: Database migration

**Files:**
- Create: `supabase/migrations/20260323000001_flashcard_translations.sql`

This is a single migration that: (1) creates the `languages` reference table, (2) creates `flashcard_translations`, (3) drops `flashcards.native_audio_url`, (4) adds `profiles.native_language`, (5) backfills the two existing curated sets.

The curated set UUIDs (`00000000-0000-0000-0000-000000000001` = Thai fruits/greetings, `00000000-0000-0000-0000-000000000002` = Chinese set) are defined in `supabase/migrations/20260319000004_seed_curated_sets.sql`. Confirm those UUIDs are correct before applying.

- [ ] **Step 1: Write the migration**

```sql
-- supabase/migrations/20260323000001_flashcard_translations.sql

-- 1. Languages reference table
CREATE TABLE languages (
  code  text PRIMARY KEY CHECK (code = lower(trim(code)) AND length(trim(code)) > 0),
  name  text NOT NULL
);

INSERT INTO languages (code, name) VALUES
  ('th', 'Thai'),
  ('zh', 'Chinese'),
  ('vi', 'Vietnamese');

GRANT SELECT ON languages TO anon, authenticated;

-- 2. Flashcard translations table
CREATE TABLE flashcard_translations (
  flashcard_id      uuid NOT NULL REFERENCES flashcards(id) ON DELETE CASCADE,
  language_code     text NOT NULL REFERENCES languages(code),
  native_text       text NOT NULL CHECK (length(trim(native_text)) > 0),
  native_audio_url  text,
  source            text NOT NULL DEFAULT 'ai'
                    CHECK (source IN ('ai', 'human', 'import')),
  is_reviewed       bool NOT NULL DEFAULT false,
  updated_by        uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (flashcard_id, language_code)
);

CREATE INDEX idx_flashcard_translations_lookup
  ON flashcard_translations (flashcard_id, language_code);

-- extensions.moddatetime is already enabled in 20260319000001_initial_schema.sql
CREATE TRIGGER handle_flashcard_translations_updated_at
  BEFORE UPDATE ON flashcard_translations
  FOR EACH ROW EXECUTE PROCEDURE extensions.moddatetime(updated_at);

ALTER TABLE flashcard_translations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "flashcard_translations_select" ON flashcard_translations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM flashcards f
      JOIN flashcard_sets s ON s.id = f.set_id
      WHERE f.id = flashcard_translations.flashcard_id
        AND (
          s.created_by IS NULL
          OR s.is_public = true
          OR s.created_by = auth.uid()
        )
    )
  );

GRANT SELECT ON flashcard_translations TO anon, authenticated;

-- 3. Drop native_audio_url from flashcards (added in schema v2 but never populated)
ALTER TABLE flashcards DROP COLUMN native_audio_url;

-- 4. Add profiles.native_language (nullable FK — NOT NULL enforced in follow-up migration)
ALTER TABLE profiles
  ADD COLUMN native_language text REFERENCES languages(code);

-- 5. Guard: fail if unexpected curated sets exist (UUIDs are stable constants)
DO $$
DECLARE unexpected_count int;
BEGIN
  SELECT COUNT(*) INTO unexpected_count
  FROM flashcard_sets
  WHERE created_by IS NULL
    AND id NOT IN (
      '00000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000002'
    );
  IF unexpected_count > 0 THEN
    RAISE EXCEPTION 'Unexpected curated sets found — update migration before proceeding';
  END IF;
END $$;

-- 6. Backfill existing curated sets into flashcard_translations
INSERT INTO flashcard_translations
  (flashcard_id, language_code, native_text, source, is_reviewed)
SELECT
  f.id,
  CASE s.id
    WHEN '00000000-0000-0000-0000-000000000001' THEN 'th'
    WHEN '00000000-0000-0000-0000-000000000002' THEN 'zh'
  END,
  f.native_text,
  'human',
  true
FROM flashcards f
JOIN flashcard_sets s ON s.id = f.set_id
WHERE s.created_by IS NULL
  AND s.id IN (
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000002'
  )
ON CONFLICT (flashcard_id, language_code) DO NOTHING;
```

- [ ] **Step 2: Verify curated set UUIDs are correct**

```bash
grep -n '00000000-0000-0000-0000-000000000001\|00000000-0000-0000-0000-000000000002' supabase/migrations/20260319000004_seed_curated_sets.sql
```

Expected: lines showing those two UUIDs being inserted into `flashcard_sets`.

- [ ] **Step 3: Apply the migration**

```bash
npx supabase db push
```

Expected: `Applying migration 20260323000001_flashcard_translations.sql...` with no errors.

- [ ] **Step 4: Verify tables exist**

```bash
npx supabase db diff --linked
```

Expected: No pending changes (migration is applied).

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260323000001_flashcard_translations.sql
git commit -m "feat(db): add languages table, flashcard_translations, profiles.native_language"
```

---

## Task 2: Backend — `languages.py`

**Files:**
- Create: `backend/app/core/languages.py`

- [ ] **Step 1: Write the module**

```python
# backend/app/core/languages.py

SUPPORTED_LANGUAGES: frozenset[str] = frozenset({'th', 'zh', 'vi'})


def validate_native_language(value: str | None) -> str | None:
    """Return value if valid, None if None, raise ValueError for unknown codes."""
    if value is None:
        return None
    if value not in SUPPORTED_LANGUAGES:
        raise ValueError(f"Unsupported language code: {value!r}")
    return value
```

- [ ] **Step 2: Run type check (no tests needed for a pure constant file)**

```bash
cd backend && source venv/bin/activate && python -c "from app.core.languages import SUPPORTED_LANGUAGES, validate_native_language; print(SUPPORTED_LANGUAGES); print(validate_native_language('th')); print(validate_native_language(None))"
```

Expected output:
```
frozenset({'th', 'zh', 'vi'})
th
None
```

- [ ] **Step 3: Verify it raises for unknown code**

```bash
cd backend && source venv/bin/activate && python -c "from app.core.languages import validate_native_language; validate_native_language('fr')"
```

Expected: `ValueError: Unsupported language code: 'fr'`

- [ ] **Step 4: Commit**

```bash
git add backend/app/core/languages.py
git commit -m "feat(backend): add SUPPORTED_LANGUAGES constant and validate_native_language"
```

---

## Task 3: Backend — models update

**Files:**
- Modify: `backend/app/models/auth.py`

Add `native_language` (optional) to `UserRegister` and add a new `UpdateProfile` model. Both use `validate_native_language` from `languages.py`.

- [ ] **Step 1: Update `backend/app/models/auth.py`**

```python
from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from ..core.languages import validate_native_language


class UserRegister(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6, max_length=100)
    first_name: str = Field(min_length=1, max_length=50)
    last_name: str = Field(min_length=1, max_length=50)
    username: str = Field(min_length=3, max_length=30)
    native_language: Optional[str] = None

    @field_validator('native_language')
    @classmethod
    def check_language(cls, v: Optional[str]) -> Optional[str]:
        return validate_native_language(v)


class UpdateProfile(BaseModel):
    native_language: Optional[str] = None

    @field_validator('native_language')
    @classmethod
    def check_language(cls, v: Optional[str]) -> Optional[str]:
        return validate_native_language(v)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    email: str
    username: str
    first_name: str
    last_name: str
    native_language: Optional[str] = None


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


class MessageResponse(BaseModel):
    success: bool
    message: str
    field: Optional[str] = None


class UsernameCheckResponse(BaseModel):
    available: bool


class ProfileResponse(BaseModel):
    id: str
    username: str
    first_name: str
    last_name: str
    native_language: Optional[str] = None
```

- [ ] **Step 2: Verify import works**

```bash
cd backend && source venv/bin/activate && python -c "from app.models.auth import UserRegister, UpdateProfile; print('ok')"
```

Expected: `ok`

- [ ] **Step 3: Verify validation**

```bash
cd backend && source venv/bin/activate && python -c "
from app.models.auth import UpdateProfile
import json
# Valid
m = UpdateProfile(native_language='th')
print(m.native_language)
# None
m2 = UpdateProfile()
print(m2.native_language)
# Invalid — should raise
try:
    UpdateProfile(native_language='fr')
except Exception as e:
    print(f'Expected error: {e}')
"
```

Expected:
```
th
None
Expected error: ...Unsupported language code: 'fr'...
```

- [ ] **Step 4: Commit**

```bash
git add backend/app/models/auth.py
git commit -m "feat(backend): add native_language to UserRegister, add UpdateProfile + ProfileResponse models"
```

---

## Task 4: Backend — write `native_language` on registration

**Files:**
- Modify: `backend/app/services/auth_service.py`

After `admin.create_user` returns (the DB trigger creates the `profiles` row synchronously), do an explicit `UPDATE profiles SET native_language = :value WHERE id = :user_id` if `native_language` is provided.

- [ ] **Step 1: Update `register_user` in `backend/app/services/auth_service.py`**

Replace the existing `register_user` method's return block with:

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

    # The DB trigger creates profiles synchronously during create_user.
    # Write native_language now if provided — null is fine (skipped).
    if user_data.native_language is not None:
        self.supabase.table('profiles').update(
            {"native_language": user_data.native_language}
        ).eq('id', auth_response.user.id).execute()

    return {
        "success": True,
        "message": "Account created successfully! Please log in to continue.",
    }
```

- [ ] **Step 2: Verify import works**

```bash
cd backend && source venv/bin/activate && python -c "from app.services.auth_service import AuthService; print('ok')"
```

Expected: `ok`

- [ ] **Step 3: Commit**

```bash
git add backend/app/services/auth_service.py
git commit -m "feat(backend): write native_language to profiles after user registration"
```

---

## Task 5: Backend — `PATCH /profile` endpoint

**Files:**
- Modify: `backend/app/api/v1/auth.py`

The endpoint:
1. Accepts `Authorization: Bearer <supabase_access_token>` header
2. Calls `supabase.auth.get_user(token)` to verify the JWT and extract `user.id` — never accepts user ID from the request body
3. Validates `native_language` via Pydantic (`UpdateProfile` model does this)
4. Updates `profiles` and returns the updated profile

- [ ] **Step 1: Add the endpoint to `backend/app/api/v1/auth.py`**

Add imports at the top:
```python
from fastapi import APIRouter, Depends, HTTPException, status, Header
from ...models.auth import UserRegister, UserLogin, MessageResponse, TokenResponse, UsernameCheckResponse, UpdateProfile, ProfileResponse
```

Add a dependency function and the new route after the existing routes:

```python
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
        print(f"Unexpected error in update_profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"success": False, "message": "An unexpected error occurred"},
        )
```

- [ ] **Step 2: Start the dev server and verify via docs**

```bash
cd backend && source venv/bin/activate && python run.py
```

Open `http://localhost:8000/docs` and verify:
- `PATCH /auth/profile` endpoint appears
- It shows `native_language` as an optional string in the request body
- It shows `ProfileResponse` as the response schema

- [ ] **Step 3: Commit**

```bash
git add backend/app/api/v1/auth.py
git commit -m "feat(backend): add PATCH /auth/profile endpoint with Supabase JWT verification"
```

---

## Task 6: Frontend — `authSchema.ts` + `src/lib/api/auth.ts`

**Files:**
- Modify: `src/schemas/authSchema.ts`
- Modify: `src/lib/api/auth.ts`

Add `native_language` to the register schema (optional, validated client-side against the supported list). Add `updateProfile` to the API client.

- [ ] **Step 1: Update `src/schemas/authSchema.ts`**

```typescript
import { z } from "zod";

const SUPPORTED_LANGUAGES = ['th', 'zh', 'vi'] as const;

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50, "First name must be 50 characters or fewer"),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name must be 50 characters or fewer"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters").max(100, "Password must be 100 characters or fewer"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  username: z.string().min(3, "Username must be at least 3 characters").max(30, "Username must be 30 characters or fewer"),
  native_language: z.enum(SUPPORTED_LANGUAGES).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type RegisterFormData = z.infer<typeof registerSchema>;
export { SUPPORTED_LANGUAGES };
```

- [ ] **Step 2: Add `updateProfile` to `src/lib/api/auth.ts`**

Add these types and method to the existing `AuthAPI` class:

```typescript
// Add to interfaces at top of file:
export interface UpdateProfileData {
  native_language: string | null;
}

export interface ProfileResponse {
  id: string;
  username: string;
  first_name: string;
  last_name: string;
  native_language: string | null;
}
```

Add to the `AuthAPI` class (after `logoutUser`):

```typescript
async updateProfile(
  data: UpdateProfileData,
  accessToken: string,
): Promise<ProfileResponse | ApiResponse> {
  try {
    const response = await this.makeRequest<ProfileResponse>('/auth/profile', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(data),
    });
    return response;
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, message: error.message };
    }
    return { success: false, message: 'An unexpected error occurred' };
  }
}
```

- [ ] **Step 3: Run type check**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/schemas/authSchema.ts src/lib/api/auth.ts
git commit -m "feat(frontend): add native_language to register schema, add updateProfile API method"
```

---

## Task 7: Frontend — rewrite `types.ts` mappers

**Files:**
- Modify: `src/features/flashcards/types.ts`
- Modify: `src/features/flashcards/__tests__/mappers.test.ts`

`nativeText` and `nativeAudioUrl` become `string | null` (null when no reviewed translation exists). `mapCard` now accepts `languageCode: string` and finds the reviewed translation from the embedded array. The `native_text` field is removed from `CardRow` (it's no longer selected directly from `flashcards`). `native_audio_url` is also removed from `CardRow` (was dropped from `flashcards` in the migration).

- [ ] **Step 1: Write the failing tests in `src/features/flashcards/__tests__/mappers.test.ts`**

Replace the entire file:

```typescript
import { describe, it, expect } from 'vitest';
import { mapSet, mapCard, mapProgress } from '../types';

describe('mapSet', () => {
  it('maps a DB row to a FlashcardSet domain object', () => {
    const row = {
      id: 'abc',
      title: 'Test Set',
      description: 'A description',
      is_public: true,
      created_by: null,
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z',
      flashcards: [{ count: 5 }],
    };
    expect(mapSet(row)).toEqual({
      id: 'abc',
      title: 'Test Set',
      description: 'A description',
      isPublic: true,
      createdBy: null,
      createdAt: '2026-01-01T00:00:00Z',
      cardCount: 5,
    });
  });

  it('defaults cardCount to 0 when flashcards array is empty', () => {
    const row = {
      id: 'abc', title: 'T', description: null, is_public: false,
      created_by: 'user-1', created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z', flashcards: [],
    };
    expect(mapSet(row).cardCount).toBe(0);
  });

  it('defaults cardCount to 0 when flashcards is undefined (defensive)', () => {
    const row = {
      id: 'abc', title: 'T', description: null, is_public: false,
      created_by: null, created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-01-01T00:00:00Z', flashcards: undefined as any,
    };
    expect(mapSet(row).cardCount).toBe(0);
  });
});

describe('mapCard', () => {
  const baseRow = {
    id: 'card-1',
    set_id: 'set-1',
    english_text: 'Hello',
    part_of_speech: 'interjection',
    level: 'basic',
    category: 'greetings',
    example_sentence: 'Hello!',
    image_url: null,
    english_audio_url: null,
    notes: null,
    is_phrase: false,
    sort_order: 1,
    created_at: '2026-01-01T00:00:00Z',
  };

  it('picks the reviewed translation for the requested language', () => {
    const row = {
      ...baseRow,
      flashcard_translations: [
        { language_code: 'th', native_text: 'สวัสดี', native_audio_url: null, is_reviewed: true },
        { language_code: 'zh', native_text: '你好', native_audio_url: null, is_reviewed: true },
      ],
    };
    const card = mapCard(row, 'th');
    expect(card.nativeText).toBe('สวัสดี');
    expect(card.nativeAudioUrl).toBeNull();
  });

  it('returns nativeText null when no translation exists for the language', () => {
    const row = {
      ...baseRow,
      flashcard_translations: [
        { language_code: 'zh', native_text: '你好', native_audio_url: null, is_reviewed: true },
      ],
    };
    const card = mapCard(row, 'th');
    expect(card.nativeText).toBeNull();
  });

  it('returns nativeText null when translation exists but is not reviewed', () => {
    const row = {
      ...baseRow,
      flashcard_translations: [
        { language_code: 'th', native_text: 'สวัสดี', native_audio_url: null, is_reviewed: false },
      ],
    };
    const card = mapCard(row, 'th');
    expect(card.nativeText).toBeNull();
  });

  it('returns nativeText null when flashcard_translations is empty', () => {
    const row = { ...baseRow, flashcard_translations: [] };
    const card = mapCard(row, 'th');
    expect(card.nativeText).toBeNull();
  });

  it('maps nativeAudioUrl from the matched translation', () => {
    const row = {
      ...baseRow,
      flashcard_translations: [
        { language_code: 'th', native_text: 'สวัสดี', native_audio_url: 'https://cdn/th/hello.mp3', is_reviewed: true },
      ],
    };
    const card = mapCard(row, 'th');
    expect(card.nativeAudioUrl).toBe('https://cdn/th/hello.mp3');
  });

  it('maps all non-translation fields correctly', () => {
    const row = {
      ...baseRow,
      flashcard_translations: [],
    };
    const card = mapCard(row, 'th');
    expect(card).toMatchObject({
      id: 'card-1',
      setId: 'set-1',
      englishText: 'Hello',
      partOfSpeech: 'interjection',
      level: 'basic',
      category: 'greetings',
      exampleSentence: 'Hello!',
      imageUrl: null,
      englishAudioUrl: null,
      notes: null,
      isPhrase: false,
      sortOrder: 1,
    });
  });
});

describe('mapProgress', () => {
  it('maps a DB row to a CardProgress domain object', () => {
    const row = {
      flashcard_id: 'card-1',
      status: 'known' as const,
      last_studied_at: '2026-01-01T00:00:00Z',
      user_id: 'user-1',
      created_at: '2026-01-01T00:00:00Z',
    };
    expect(mapProgress(row)).toEqual({
      flashcardId: 'card-1',
      status: 'known',
      lastStudiedAt: '2026-01-01T00:00:00Z',
    });
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- src/features/flashcards/__tests__/mappers.test.ts
```

Expected: FAIL — `mapCard` has wrong signature.

- [ ] **Step 3: Rewrite `src/features/flashcards/types.ts`**

```typescript
export type FlashcardSet = {
  id: string
  title: string
  description: string | null
  isPublic: boolean
  createdBy: string | null
  createdAt: string
  cardCount: number
}

export type FlashcardCard = {
  id: string
  setId: string
  nativeText: string | null      // null when no reviewed translation exists for this language
  nativeAudioUrl: string | null  // null when no reviewed translation exists
  englishText: string
  partOfSpeech: string | null
  level: 'basic' | 'intermediate' | 'advanced' | null
  category: string | null
  exampleSentence: string | null
  imageUrl: string | null
  englishAudioUrl: string | null
  notes: string | null
  isPhrase: boolean
  sortOrder: number
}
// Note: DB `level` column is text | null (check constraint). Cast required in mapper.

export type CardProgress = {
  flashcardId: string
  status: 'unseen' | 'known' | 'unknown'
  lastStudiedAt: string | null
}

// ── Mappers ─────────────────────────────────────────────────────────────────
// Called only from api/flashcards.ts. Never called from hooks or components.

type SetRow = {
  id: string
  title: string
  description: string | null
  is_public: boolean
  created_by: string | null
  created_at: string
  flashcards?: { count: number }[]   // optional: PostgREST may omit if no rows
}

type TranslationRow = {
  native_text: string
  native_audio_url: string | null
  language_code: string
  is_reviewed: boolean
}

type CardRow = {
  id: string
  set_id: string
  english_text: string
  part_of_speech: string | null
  level: string | null
  category: string | null
  example_sentence: string | null
  image_url: string | null
  english_audio_url: string | null
  notes: string | null
  is_phrase: boolean
  sort_order: number
  created_at: string
  flashcard_translations: TranslationRow[]
}

type ProgressRow = {
  flashcard_id: string
  status: 'unseen' | 'known' | 'unknown'
  last_studied_at: string | null
  user_id: string
  created_at: string
}

export function mapSet(row: SetRow): FlashcardSet {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    isPublic: row.is_public,
    createdBy: row.created_by,
    createdAt: row.created_at,
    cardCount: (row.flashcards ?? [])[0]?.count ?? 0,
  };
}

export function mapCard(row: CardRow, languageCode: string): FlashcardCard {
  const translation =
    row.flashcard_translations.find(
      (t) => t.language_code === languageCode && t.is_reviewed,
    ) ?? null;

  return {
    id: row.id,
    setId: row.set_id,
    nativeText: translation?.native_text ?? null,
    nativeAudioUrl: translation?.native_audio_url ?? null,
    englishText: row.english_text,
    partOfSpeech: row.part_of_speech,
    level: row.level as FlashcardCard['level'],
    category: row.category,
    exampleSentence: row.example_sentence,
    imageUrl: row.image_url,
    englishAudioUrl: row.english_audio_url,
    notes: row.notes,
    isPhrase: row.is_phrase,
    sortOrder: row.sort_order,
  };
}

export function mapProgress(row: ProgressRow): CardProgress {
  return {
    flashcardId: row.flashcard_id,
    status: row.status,
    lastStudiedAt: row.last_studied_at,
  };
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npm test -- src/features/flashcards/__tests__/mappers.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/flashcards/types.ts src/features/flashcards/__tests__/mappers.test.ts
git commit -m "feat(flashcards): rewrite mapCard to accept languageCode, use flashcard_translations"
```

---

## Task 8: Frontend — update `api/flashcards.ts`

**Files:**
- Modify: `src/features/flashcards/api/flashcards.ts`
- Modify: `src/features/flashcards/__tests__/api.test.ts`

`getCardsBySet` now takes `languageCode`, selects `flashcard_translations(...)`, and passes `languageCode` to `mapCard`. No `.eq('flashcard_translations.language_code', ...)` — that would convert LEFT JOIN to INNER JOIN and drop untranslated cards.

- [ ] **Step 1: Update the test for `getCardsBySet` in `src/features/flashcards/__tests__/api.test.ts`**

Replace the `getCardsBySet` describe block:

```typescript
describe('getCardsBySet', () => {
  it('returns mapped FlashcardCard array with translations for the requested language', async () => {
    const fakeRow = {
      id: 'card-1', set_id: 'set-1', english_text: 'Hello',
      part_of_speech: 'interjection', level: 'basic', category: null,
      example_sentence: null, image_url: null, english_audio_url: null,
      notes: null, is_phrase: false, sort_order: 1, created_at: '2026-01-01T00:00:00Z',
      flashcard_translations: [
        { language_code: 'th', native_text: 'สวัสดี', native_audio_url: null, is_reviewed: true },
      ],
    };
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [fakeRow], error: null }),
        }),
      }),
    } as any);

    const result = await getCardsBySet('set-1', 'th');
    expect(result).toHaveLength(1);
    expect(result[0].englishText).toBe('Hello');
    expect(result[0].nativeText).toBe('สวัสดี');
  });

  it('returns nativeText null for cards without a reviewed translation', async () => {
    const fakeRow = {
      id: 'card-2', set_id: 'set-1', english_text: 'Goodbye',
      part_of_speech: null, level: null, category: null,
      example_sentence: null, image_url: null, english_audio_url: null,
      notes: null, is_phrase: false, sort_order: 2, created_at: '2026-01-01T00:00:00Z',
      flashcard_translations: [],
    };
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          order: vi.fn().mockResolvedValue({ data: [fakeRow], error: null }),
        }),
      }),
    } as any);

    const result = await getCardsBySet('set-1', 'th');
    expect(result[0].nativeText).toBeNull();
  });
});
```

- [ ] **Step 2: Run the test to confirm it fails**

```bash
npm test -- src/features/flashcards/__tests__/api.test.ts
```

Expected: FAIL — `getCardsBySet` still uses old signature.

- [ ] **Step 3: Update `src/features/flashcards/api/flashcards.ts`**

Replace `getCardsBySet`:

```typescript
export async function getCardsBySet(setId: string, languageCode: string): Promise<FlashcardCard[]> {
  const { data, error } = await supabase
    .from('flashcards')
    .select(`
      id, set_id, english_text, part_of_speech, level, category,
      example_sentence, english_audio_url, image_url,
      notes, is_phrase, sort_order,
      flashcard_translations(native_text, native_audio_url, language_code, is_reviewed)
    `)
    .eq('set_id', setId)
    .order('sort_order', { ascending: true });
  // No filter on flashcard_translations.language_code — adding .eq on an embedded
  // resource converts the implicit LEFT JOIN to INNER JOIN, dropping untranslated cards.

  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapCard(row as any, languageCode));
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npm test -- src/features/flashcards/__tests__/api.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/flashcards/api/flashcards.ts src/features/flashcards/__tests__/api.test.ts
git commit -m "feat(flashcards): embed flashcard_translations in card query, accept languageCode param"
```

---

## Task 9: Frontend — update `useFlashcards` hook

**Files:**
- Modify: `src/features/flashcards/hooks/useFlashcards.ts`
- Modify: `src/features/flashcards/__tests__/useFlashcards.test.ts`

The hook now guards on **both** `setId` and `languageCode` being non-null before fetching.

- [ ] **Step 1: Update tests in `src/features/flashcards/__tests__/useFlashcards.test.ts`**

Replace the file:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';

vi.mock('../api/flashcards', () => ({ getCardsBySet: vi.fn() }));
import { getCardsBySet } from '../api/flashcards';
import { useFlashcards } from '../hooks/useFlashcards';

const mockGet = vi.mocked(getCardsBySet);
beforeEach(() => vi.clearAllMocks());

const fakeCard = {
  id: 'c1', setId: 's1', nativeText: 'สวัสดี', nativeAudioUrl: null,
  englishText: 'Hello', partOfSpeech: null, level: 'basic' as const,
  category: null, exampleSentence: null, imageUrl: null, englishAudioUrl: null,
  notes: null, isPhrase: false, sortOrder: 1,
};

describe('useFlashcards', () => {
  it('returns empty cards when setId is null', () => {
    const { result } = renderHook(() => useFlashcards(null, 'th'));
    expect(result.current.cards).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('returns empty cards when languageCode is null', () => {
    const { result } = renderHook(() => useFlashcards('s1', null));
    expect(result.current.cards).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(mockGet).not.toHaveBeenCalled();
  });

  it('fetches cards when both setId and languageCode are provided', async () => {
    mockGet.mockResolvedValue([fakeCard]);
    const { result } = renderHook(() => useFlashcards('s1', 'th'));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.cards).toHaveLength(1);
    expect(mockGet).toHaveBeenCalledWith('s1', 'th');
  });

  it('refetches when setId changes', async () => {
    mockGet.mockResolvedValue([fakeCard]);
    let setId: string | null = 's1';
    const { result, rerender } = renderHook(() => useFlashcards(setId, 'th'));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const fakeCard2 = { ...fakeCard, id: 'c2', setId: 's2', englishText: 'Water' };
    mockGet.mockResolvedValue([fakeCard2]);
    setId = 's2';
    rerender();
    await waitFor(() => expect(result.current.cards[0].englishText).toBe('Water'));
  });

  it('resets state when setId changes to null', async () => {
    mockGet.mockRejectedValue(new Error('oops'));
    let setId: string | null = 's1';
    const { result, rerender } = renderHook(() => useFlashcards(setId, 'th'));
    await waitFor(() => expect(result.current.error).toBe('oops'));

    setId = null;
    rerender();
    expect(result.current.cards).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('resets state when languageCode changes to null', async () => {
    mockGet.mockResolvedValue([fakeCard]);
    let lang: string | null = 'th';
    const { result, rerender } = renderHook(() => useFlashcards('s1', lang));
    await waitFor(() => expect(result.current.loading).toBe(false));

    lang = null;
    rerender();
    expect(result.current.cards).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('ignores stale response when setId changes rapidly', async () => {
    let resolveStale!: (cards: typeof fakeCard[]) => void;
    const firstPromise = new Promise<typeof fakeCard[]>((res) => { resolveStale = res; });
    const freshCard = { ...fakeCard, id: 'c2', setId: 's2', englishText: 'Fresh' };

    mockGet
      .mockImplementationOnce(() => firstPromise)
      .mockResolvedValueOnce([freshCard]);

    let setId: string | null = 's1';
    const { result, rerender } = renderHook(() => useFlashcards(setId, 'th'));

    setId = 's2';
    rerender();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.cards[0].englishText).toBe('Fresh');

    resolveStale([{ ...fakeCard, englishText: 'STALE' }]);
    expect(result.current.cards[0].englishText).toBe('Fresh');
  });
});
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
npm test -- src/features/flashcards/__tests__/useFlashcards.test.ts
```

Expected: FAIL — `useFlashcards` doesn't accept `languageCode`.

- [ ] **Step 3: Update `src/features/flashcards/hooks/useFlashcards.ts`**

```typescript
import { useState, useEffect } from 'react';
import { getCardsBySet } from '../api/flashcards';
import type { FlashcardCard } from '../types';

export function useFlashcards(setId: string | null, languageCode: string | null) {
  const [cards, setCards] = useState<FlashcardCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!setId || !languageCode) {
      setCards([]);
      setLoading(false);
      setError(null);
      return () => { cancelled = true; };
    }

    setLoading(true);
    setError(null);

    getCardsBySet(setId, languageCode)
      .then((fetchedCards) => {
        if (!cancelled) setCards(fetchedCards);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Failed to load cards');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [setId, languageCode]);

  return { cards, loading, error };
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npm test -- src/features/flashcards/__tests__/useFlashcards.test.ts
```

Expected: all tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/flashcards/hooks/useFlashcards.ts src/features/flashcards/__tests__/useFlashcards.test.ts
git commit -m "feat(flashcards): useFlashcards accepts languageCode param, guards fetch on null"
```

---

## Task 10: Frontend — update `useUserStore`

**Files:**
- Modify: `src/stores/useUserStore.ts`

Add `native_language: string | null` to `UserProfile`. Add `setNativeLanguage` action. Update `fetchProfile` to select `native_language` from DB.

- [ ] **Step 1: Update `src/stores/useUserStore.ts`**

```typescript
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
  native_language: string | null;
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
  setNativeLanguage: (code: string | null) => void;
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
      .select("id, first_name, last_name, email, username, native_language")
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
          native_language: data.native_language ?? null,
        },
        error: null,
        profileLoading: false,
      });
    }
  },

  clearProfile: () => set({ profile: null, error: null, profileLoading: false }),

  setNativeLanguage: (code) =>
    set((state) => ({
      profile: state.profile ? { ...state.profile, native_language: code } : null,
    })),
}));
```

- [ ] **Step 2: Run type check**

```bash
npm run type-check
```

Expected: no errors (or only errors from other files that haven't been updated yet — those will be fixed in later tasks).

- [ ] **Step 3: Commit**

```bash
git add src/stores/useUserStore.ts
git commit -m "feat(store): add native_language to profile, add setNativeLanguage action"
```

---

## Task 11: Frontend — `Flashcard.tsx` null `nativeText` placeholder

**Files:**
- Modify: `src/components/flashcards/Flashcard.tsx`

When `nativeText` is null, show a "Translation coming soon" placeholder on the front of the card. The card is visually distinct (muted colors) and the `aria-label` doesn't render the string `"null"`.

- [ ] **Step 1: Update `src/components/flashcards/Flashcard.tsx`**

Change the `FlashcardProps` type and the front-side content. The key changes are:
1. `nativeText: string | null` (it's already in the type from `FlashcardCard`)
2. Guard the `aria-label` against null
3. Show placeholder when null

Replace the `aria-label` line and the front-side main content:

Search for the existing `aria-label` prop on the `<button>` element (it contains the string `Showing native text: ${nativeText}`). Replace it with:

```tsx
aria-label={
  isFlipped
    ? `Showing English: ${englishText}. Press to flip back.`
    : nativeText
    ? `Showing native text: ${nativeText}. Press to flip.`
    : `Card not yet translated. Press to flip.`
}
```

Replace the front-side main content block (the `<div className="absolute inset-0 flex items-center justify-center">` section on the front face):

```tsx
{/* Main Content - Perfectly Centered */}
<div className="absolute inset-0 flex items-center justify-center">
  <div className="text-center">
    {nativeText ? (
      <>
        <p className="text-4xl sm:text-5xl font-semibold text-gray-800 mb-4">
          {nativeText}
        </p>
        <div className="w-16 h-1 bg-primary-300 mx-auto rounded-full" />
      </>
    ) : (
      <>
        <p className="text-lg text-gray-400 italic mb-2">Translation coming soon</p>
        <div className="w-16 h-1 bg-gray-200 mx-auto rounded-full" />
      </>
    )}
  </div>
</div>
```

- [ ] **Step 2: Run type check**

```bash
npm run type-check
```

Expected: no errors in this file.

- [ ] **Step 3: Commit**

```bash
git add src/components/flashcards/Flashcard.tsx
git commit -m "feat(flashcard): show 'Translation coming soon' placeholder when nativeText is null"
```

---

## Task 12: Frontend — language resolution in `FlashcardsPage`

**Files:**
- Modify: `src/pages/FlashcardsPage.tsx`

Language resolution order:
1. `profile.native_language` from Zustand store (authoritative once set)
2. If null: local state `localLanguage` (user picks inline)
3. If neither: show a language selector inline, block card fetch until selected

`useFlashcards` receives the resolved language (or null if not yet selected).

- [ ] **Step 1: Update `src/pages/FlashcardsPage.tsx`**

```tsx
// src/pages/FlashcardsPage.tsx
import { useState } from 'react';
import { useUserStore } from '@/stores/useUserStore';
import { useFlashcardSets } from '@/features/flashcards/hooks/useFlashcardSets';
import { useFlashcards } from '@/features/flashcards/hooks/useFlashcards';
import { useCardProgress } from '@/features/flashcards/hooks/useCardProgress';
import { FlashcardSetList } from '@/features/flashcards/components/FlashcardSetList';
import { FlashcardViewer } from '@/features/flashcards/components/FlashcardViewer';
import { CreateSetModal } from '@/features/flashcards/components/CreateSetModal';
import { SUPPORTED_LANGUAGES } from '@/schemas/authSchema';

const LANGUAGE_NAMES: Record<string, string> = {
  th: 'Thai',
  zh: 'Chinese',
  vi: 'Vietnamese',
};

export default function FlashcardsPage() {
  const { profile } = useUserStore();
  const isAuthenticated = profile !== null;

  const [selectedSetId, setSelectedSetId] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [localLanguage, setLocalLanguage] = useState<string | null>(null);

  // Language resolution: profile (authoritative) → local selection → null (blocked)
  const languageCode = profile?.native_language ?? localLanguage;

  const { sets, loading: setsLoading, error: setsError, createSet } = useFlashcardSets(profile?.id);
  const { cards, loading: cardsLoading } = useFlashcards(selectedSetId, languageCode ?? null);
  const { progressMap, markKnown, markUnknown } = useCardProgress(
    cards.map((c) => c.id),
    profile?.id,
  );

  return (
    <div className="min-h-screen bg-semantic-bg dark:bg-semantic-bg">
      <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
        {/* Language selector — shown when profile.native_language is not set */}
        {!languageCode && (
          <div className="mb-6 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Choose your native language to see translations:
            </p>
            <div className="flex gap-2 flex-wrap">
              {SUPPORTED_LANGUAGES.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => setLocalLanguage(code)}
                  className="px-4 py-2 rounded-lg border border-primary-300 text-primary-700 hover:bg-primary-50 dark:border-primary-600 dark:text-primary-300 dark:hover:bg-primary-900/20 text-sm font-medium transition-colors"
                >
                  {LANGUAGE_NAMES[code]}
                </button>
              ))}
            </div>
          </div>
        )}

        {selectedSetId === null ? (
          <FlashcardSetList
            sets={sets}
            loading={setsLoading}
            error={setsError}
            isAuthenticated={isAuthenticated}
            onSelectSet={setSelectedSetId}
            onCreateSet={() => setIsCreateModalOpen(true)}
          />
        ) : cardsLoading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-primary-600">Loading cards…</p>
          </div>
        ) : (
          <FlashcardViewer
            setId={selectedSetId}
            cards={cards}
            progressMap={progressMap}
            onMarkKnown={markKnown}
            onMarkUnknown={markUnknown}
            onBack={() => setSelectedSetId(null)}
            isAuthenticated={isAuthenticated}
          />
        )}

        {isCreateModalOpen && (
          <CreateSetModal
            onClose={() => setIsCreateModalOpen(false)}
            onSubmit={createSet}
          />
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Run type check**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/pages/FlashcardsPage.tsx
git commit -m "feat(flashcards): add language resolution + inline selector to FlashcardsPage"
```

---

## Task 13: Frontend — language selector in `Register.tsx`

**Files:**
- Modify: `src/pages/Register.tsx`
- Modify: `src/features/auth/useRegisterForm.ts` (add `native_language` field)
- Modify: `src/features/auth/useRegisterSubmit.ts` (include `native_language` in API call)

Add a language selector after the username field. Pre-fill from browser locale if supported (`navigator.language` → normalize → check against `SUPPORTED_LANGUAGES`). If locale isn't supported, leave empty with placeholder.

- [ ] **Step 1: Find the register form hook files**

```bash
ls src/features/auth/
```

Expected: `useRegisterForm.ts`, `useRegisterSubmit.ts`, `RequireAuth.tsx`, `RequireGuest.tsx`

- [ ] **Step 2: Read `src/features/auth/useRegisterForm.ts` to understand the current hook**

(Read the file — it uses React Hook Form with the `registerSchema` Zod schema.)

- [ ] **Step 3: Update `src/features/auth/useRegisterForm.ts`** to expose `watch` for `native_language` and a setter

The hook uses `useForm<RegisterFormData>`. Since `native_language` is now in the schema, it's available via `register('native_language')`. Add a `setValue` call for the auto-detect logic.

The hook already calls `useForm<RegisterFormData>`. Add `setValue` and `watch` to the destructure and return object. Read the current file first to see what's already returned, then add the two missing values:

```typescript
// In useRegisterForm.ts — add to the destructure and return:
const { register, handleSubmit, setError, clearErrors, formState: { errors }, setValue, watch } = useForm<RegisterFormData>({ ... });

// Return:
return { register, handleSubmit, setError, clearErrors, errors, handleFieldChange, getPasswordValidationIcon, getConfirmPasswordValidationIcon, setValue, watch };
```

- [ ] **Step 4: Update `src/pages/Register.tsx`** to add the language selector

Import changes at top:
```tsx
import { Globe } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "@/schemas/authSchema";
import { useEffect } from "react";
```

Add after the hook destructure, before the `return`:
```tsx
// Auto-detect browser locale on mount
useEffect(() => {
  const lang = navigator.language.split('-')[0].toLowerCase();
  if ((SUPPORTED_LANGUAGES as readonly string[]).includes(lang)) {
    setValue('native_language', lang as typeof SUPPORTED_LANGUAGES[number]);
  }
}, [setValue]);

const selectedLanguage = watch('native_language');
const LANGUAGE_NAMES: Record<string, string> = { th: 'Thai', zh: 'Chinese', vi: 'Vietnamese' };
```

Add the language selector field inside the `<form>`, after the username field and before first name:

```tsx
{/* Language selector */}
<div>
  <label className="block text-sm font-medium text-text-light dark:text-text-dark mb-1">
    <Globe className="inline w-4 h-4 mr-1" />
    {t("register.native_language")}
  </label>
  <div className="flex gap-2 flex-wrap">
    {SUPPORTED_LANGUAGES.map((code) => (
      <button
        key={code}
        type="button"
        onClick={() => setValue('native_language', code)}
        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
          selectedLanguage === code
            ? 'bg-primary-600 text-white border-primary-600'
            : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
        }`}
      >
        {LANGUAGE_NAMES[code]}
      </button>
    ))}
  </div>
  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
    {t("register.native_language_hint")}
  </p>
</div>
```

- [ ] **Step 5: Update `src/features/auth/useRegisterSubmit.ts`** to include `native_language`

Find where `authAPI.registerUser(...)` is called and include `native_language`:

```typescript
// In the submit handler, add native_language to the API call:
await authAPI.registerUser({
  email: data.email,
  password: data.password,
  first_name: data.firstName,
  last_name: data.lastName,
  username: data.username,
  native_language: data.native_language ?? null,
});
```

Also update `src/lib/api/auth.ts` `RegisterUserData` to include `native_language`:

```typescript
export interface RegisterUserData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  username: string;
  native_language?: string | null;
}
```

- [ ] **Step 6: Run type check**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 7: Commit**

```bash
git add src/pages/Register.tsx src/features/auth/useRegisterForm.ts src/features/auth/useRegisterSubmit.ts src/lib/api/auth.ts
git commit -m "feat(register): add native language selector with browser locale auto-detect"
```

---

## Task 14: Frontend — Settings page + route

**Files:**
- Create: `src/pages/Settings.tsx`
- Modify: `src/App.tsx`

A settings page at `/settings` (authenticated). Shows the current language and a button group to change it. On save, calls `PATCH /auth/profile` and updates the Zustand store.

- [ ] **Step 1: Create `src/pages/Settings.tsx`**

```tsx
// src/pages/Settings.tsx
import { useState } from 'react';
import { useUserStore } from '@/stores/useUserStore';
import { authAPI } from '@/lib/api/auth';
import { supabase } from '@/lib/supabase';
import { SUPPORTED_LANGUAGES } from '@/schemas/authSchema';
import { useTranslation } from 'react-i18next';
import Button from '@/components/ui/Button';

const LANGUAGE_NAMES: Record<string, string> = {
  th: 'Thai',
  zh: 'Chinese',
  vi: 'Vietnamese',
};

export default function Settings() {
  const { t } = useTranslation();
  const { profile, setNativeLanguage } = useUserStore();
  const [selected, setSelected] = useState<string | null>(profile?.native_language ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const result = await authAPI.updateProfile(
        { native_language: selected },
        session.access_token,
      );

      if ('success' in result && result.success === false) {
        setError(result.message);
        return;
      }

      setNativeLanguage(selected);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
        {t('settings.title')}
      </h1>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-4">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">
          {t('settings.native_language')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {t('settings.native_language_desc')}
        </p>

        <div className="flex gap-2 flex-wrap mb-4">
          {SUPPORTED_LANGUAGES.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => { setSelected(code); setSaved(false); }}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                selected === code
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              {LANGUAGE_NAMES[code]}
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
        {saved && <p className="text-sm text-green-600 dark:text-green-400 mb-3">{t('settings.saved')}</p>}

        <Button
          variant="primary"
          onClick={handleSave}
          disabled={saving || selected === profile?.native_language}
        >
          {saving ? t('settings.saving') : t('settings.save')}
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add the route in `src/App.tsx`**

Add import at top:
```typescript
const Settings = lazy(() => import("@/pages/Settings"));
```

Add inside the **authenticated** `<Route element={<RequireAuth><AuthLayout /></RequireAuth>}>` block (alongside the existing `/home`, `/dashboard`, etc. routes):
```tsx
<Route path="/settings" element={<Settings />} />
```

- [ ] **Step 3: Run type check**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Settings.tsx src/App.tsx
git commit -m "feat(settings): add Settings page with native language selector at /settings"
```

---

## Task 15: i18n strings

**Files:**
- Modify: `src/locales/en/en.json`
- Modify: `src/locales/th/th.json`

Add keys for the language selector (Register), Settings page, and Flashcard placeholder.

- [ ] **Step 1: Update `src/locales/en/en.json`**

Add to the `"register"` object:
```json
"native_language": "Your Native Language",
"native_language_hint": "Cards will show this language on the front. You can change it in Settings."
```

Add a new `"settings"` key:
```json
"settings": {
  "title": "Settings",
  "native_language": "Native Language",
  "native_language_desc": "Flashcards will show translations in your selected language.",
  "save": "Save Changes",
  "saving": "Saving…",
  "saved": "Saved!"
}
```

- [ ] **Step 2: Update `src/locales/th/th.json`**

Add to the `"register"` object:
```json
"native_language": "ภาษาแม่ของคุณ",
"native_language_hint": "การ์ดจะแสดงภาษานี้ด้านหน้า สามารถเปลี่ยนได้ในการตั้งค่า"
```

Add a new `"settings"` key:
```json
"settings": {
  "title": "การตั้งค่า",
  "native_language": "ภาษาแม่",
  "native_language_desc": "แฟลชการ์ดจะแสดงคำแปลในภาษาที่คุณเลือก",
  "save": "บันทึกการเปลี่ยนแปลง",
  "saving": "กำลังบันทึก…",
  "saved": "บันทึกแล้ว!"
}
```

- [ ] **Step 3: Run type check**

```bash
npm run type-check
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/locales/en/en.json src/locales/th/th.json
git commit -m "feat(i18n): add language selector and settings strings to en/th locales"
```

---

## Task 16: Script — `scripts/generate-translations.ts`

**Files:**
- Create: `scripts/generate-translations.ts`

This script:
1. Reads all flashcards from Supabase that have no reviewed `flashcard_translations` row for a given language
2. Batches them (20 cards per API call to stay well within context limits)
3. Calls Claude Haiku to translate each batch
4. Writes `src/data/translations/<lang>_review.csv` sorted with flagged rows first

The script is run manually by a developer. It requires `ANTHROPIC_API_KEY` (a standard `sk-ant-...` key) and `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` from `backend/.env`.

First, install `@anthropic-ai/sdk` as a dev dependency:

```bash
npm install --save-dev @anthropic-ai/sdk
```

- [ ] **Step 1: Create the `src/data/translations/` directory**

```bash
mkdir -p src/data/translations
```

- [ ] **Step 2: Create `scripts/generate-translations.ts`**

```typescript
/**
 * Generate translation review CSVs for flashcard sets.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-ant-... \
 *   SUPABASE_URL=https://... \
 *   SUPABASE_SERVICE_ROLE_KEY=... \
 *   npx tsx scripts/generate-translations.ts --lang th
 *
 * Output: src/data/translations/<lang>_review.csv
 * Flagged rows (low confidence) are sorted to the top for fast human review.
 * After reviewing, run generate-translations-migration.ts to emit SQL.
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// ─── Config ──────────────────────────────────────────────────────────────────

const SUPPORTED_LANGUAGES: Record<string, string> = {
  th: 'Thai',
  zh: 'Chinese',
  vi: 'Vietnamese',
};

const BATCH_SIZE = 20;
const OUTPUT_DIR = 'src/data/translations';

// ─── Args ─────────────────────────────────────────────────────────────────────

const langArg = process.argv.find((a) => a.startsWith('--lang='))?.split('=')[1]
  ?? process.argv[process.argv.indexOf('--lang') + 1];

if (!langArg || !SUPPORTED_LANGUAGES[langArg]) {
  console.error(`Usage: npx tsx scripts/generate-translations.ts --lang <${Object.keys(SUPPORTED_LANGUAGES).join('|')}>`);
  process.exit(1);
}

const lang = langArg;
const langName = SUPPORTED_LANGUAGES[lang];

// ─── Clients ─────────────────────────────────────────────────────────────────

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
  // Note: ANTHROPIC_CODE_OAUTH_TOKEN is a Claude Code OAuth credential and is NOT
  // accepted by the SDK's apiKey parameter. Use a standard sk-ant-... API key.
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// ─── Fetch untranslated cards ─────────────────────────────────────────────────

console.log(`Fetching cards without a reviewed ${langName} translation...`);

const { data: cards, error } = await supabase
  .from('flashcards')
  .select('id, english_text, category')
  .not(
    'id',
    'in',
    `(SELECT flashcard_id FROM flashcard_translations WHERE language_code = '${lang}' AND is_reviewed = true)`,
  );

if (error) {
  console.error('Supabase error:', error.message);
  process.exit(1);
}

if (!cards || cards.length === 0) {
  console.log(`No untranslated cards found for ${langName}. Nothing to do.`);
  process.exit(0);
}

console.log(`Found ${cards.length} card(s) to translate.`);

// ─── Translate in batches ─────────────────────────────────────────────────────

type TranslationResult = {
  id: string;
  english_text: string;
  category: string | null;
  native_text: string;
  flagged: boolean;
};

const results: TranslationResult[] = [];

for (let i = 0; i < cards.length; i += BATCH_SIZE) {
  const batch = cards.slice(i, i + BATCH_SIZE);
  const batchNum = Math.floor(i / BATCH_SIZE) + 1;
  const totalBatches = Math.ceil(cards.length / BATCH_SIZE);
  console.log(`Translating batch ${batchNum}/${totalBatches} (${batch.length} cards)...`);

  const prompt = `Translate the following English words/phrases to ${langName}.
Return ONLY a JSON array with this exact shape:
[{ "id": "<flashcard_id>", "native_text": "<translation>" }, ...]
If you are not confident about a translation, prefix native_text with "?".
Do not add explanations, romanisation, or alternatives.

Cards:
${JSON.stringify(batch.map((c) => ({ id: c.id, english_text: c.english_text, category: c.category })))}`;

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    console.error(`Unexpected response type in batch ${batchNum}`);
    process.exit(1);
  }

  let parsed: { id: string; native_text: string }[];
  try {
    // Strip markdown code fences if present
    const jsonText = content.text.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
    parsed = JSON.parse(jsonText);
  } catch {
    console.error(`Failed to parse JSON in batch ${batchNum}:`, content.text);
    process.exit(1);
  }

  const cardMap = new Map(batch.map((c) => [c.id, c]));
  for (const item of parsed) {
    const card = cardMap.get(item.id);
    if (!card) {
      console.warn(`Unknown card id in response: ${item.id}`);
      continue;
    }
    const flagged = item.native_text.startsWith('?');
    results.push({
      id: item.id,
      english_text: card.english_text,
      category: card.category,
      native_text: flagged ? item.native_text.slice(1).trim() : item.native_text,
      flagged,
    });
  }
}

// ─── Write CSV ────────────────────────────────────────────────────────────────

// Sort: flagged rows first for fast human review
results.sort((a, b) => (b.flagged ? 1 : 0) - (a.flagged ? 1 : 0));

const escCsv = (s: string | null) =>
  s == null ? '' : `"${String(s).replace(/"/g, '""')}"`;

const header = 'flashcard_id,english_text,category,native_text,flagged';
const rows = results.map(
  (r) => `${escCsv(r.id)},${escCsv(r.english_text)},${escCsv(r.category)},${escCsv(r.native_text)},${r.flagged}`,
);

mkdirSync(OUTPUT_DIR, { recursive: true });
const outputPath = join(OUTPUT_DIR, `${lang}_review.csv`);
writeFileSync(outputPath, [header, ...rows].join('\n') + '\n', 'utf-8');

const flaggedCount = results.filter((r) => r.flagged).length;
console.log(`\nWrote ${results.length} translations to ${outputPath}`);
if (flaggedCount > 0) {
  console.log(`⚠  ${flaggedCount} row(s) flagged — review and edit native_text, then clear flagged=false before running the migration generator.`);
} else {
  console.log('✓ No flagged rows. Ready for migration generation.');
}
```

- [ ] **Step 3: Run type check on scripts**

```bash
npx tsc --noEmit --project tsconfig.json scripts/generate-translations.ts 2>&1 || npx tsx --check scripts/generate-translations.ts 2>&1 | head -20
```

(The scripts use `tsx` at runtime, not tsc. Verify it at least parses without obvious errors.)

- [ ] **Step 4: Commit**

```bash
git add scripts/generate-translations.ts src/data/translations/.gitkeep
git commit -m "feat(scripts): add generate-translations script using Claude Haiku API"
```

---

## Task 17: Script — `scripts/generate-translations-migration.ts`

**Files:**
- Create: `scripts/generate-translations-migration.ts`

Reads a `*_review.csv`, fails if any row has `flagged=true`, emits a timestamped SQL migration using `INSERT ... ON CONFLICT DO UPDATE`.

Note: `papaparse` is already in `devDependencies` — no separate install needed.

- [ ] **Step 1: Create `scripts/generate-translations-migration.ts`**

```typescript
/**
 * Generate a SQL migration from a reviewed translation CSV.
 *
 * Usage:
 *   npx tsx scripts/generate-translations-migration.ts --lang th
 *
 * Reads:  src/data/translations/<lang>_review.csv
 * Writes: supabase/migrations/<timestamp>_translations_<lang>.sql
 *
 * Fails if any row still has flagged=true — fix those before running.
 */

import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import Papa from 'papaparse';

// ─── Args ─────────────────────────────────────────────────────────────────────

const SUPPORTED = ['th', 'zh', 'vi'];

const langArg = process.argv.find((a) => a.startsWith('--lang='))?.split('=')[1]
  ?? process.argv[process.argv.indexOf('--lang') + 1];

if (!langArg || !SUPPORTED.includes(langArg)) {
  console.error(`Usage: npx tsx scripts/generate-translations-migration.ts --lang <th|zh|vi>`);
  process.exit(1);
}

const lang = langArg;

// ─── Read CSV ─────────────────────────────────────────────────────────────────

const csvPath = join('src/data/translations', `${lang}_review.csv`);
const content = readFileSync(csvPath, 'utf-8');

type ReviewRow = {
  flashcard_id: string;
  english_text: string;
  category: string;
  native_text: string;
  flagged: string; // 'true' | 'false'
};

const result = Papa.parse<ReviewRow>(content, {
  header: true,
  skipEmptyLines: true,
});

if (result.errors.length > 0) {
  console.error('CSV parse errors:', result.errors);
  process.exit(1);
}

const rows = result.data;

// ─── Guard: no unflagged rows ─────────────────────────────────────────────────

const flagged = rows.filter((r) => r.flagged === 'true');
if (flagged.length > 0) {
  console.error(`❌ ${flagged.length} row(s) still have flagged=true in ${csvPath}`);
  console.error('Edit native_text and set flagged=false for each of these rows before generating the migration:');
  flagged.forEach((r) => console.error(`  - ${r.flashcard_id} "${r.english_text}" → "${r.native_text}"`));
  process.exit(1);
}

if (rows.length === 0) {
  console.error('No rows found in CSV.');
  process.exit(1);
}

// ─── Build SQL ────────────────────────────────────────────────────────────────

const sqlLiteral = (s: string | null): string =>
  s == null ? 'NULL' : `'${s.replace(/'/g, "''")}'`;

const timestamp = new Date()
  .toISOString()
  .replace(/[-T:.Z]/g, '')
  .slice(0, 14);

const outputPath = join('supabase/migrations', `${timestamp}_translations_${lang}.sql`);

const valueLines = rows.map(
  (r) =>
    `  (${sqlLiteral(r.flashcard_id)}, ${sqlLiteral(lang)}, ${sqlLiteral(r.native_text)}, 'human', true)`,
);

const sql = [
  `-- Generated by scripts/generate-translations-migration.ts — DO NOT EDIT BY HAND`,
  `-- Source: src/data/translations/${lang}_review.csv`,
  `-- Regenerate: review CSV → npx tsx scripts/generate-translations-migration.ts --lang ${lang}`,
  '',
  `INSERT INTO flashcard_translations (flashcard_id, language_code, native_text, source, is_reviewed)`,
  `VALUES`,
  valueLines.join(',\n'),
  `ON CONFLICT (flashcard_id, language_code) DO UPDATE`,
  `  SET native_text  = EXCLUDED.native_text,`,
  `      source       = EXCLUDED.source,`,
  `      is_reviewed  = true,`,
  `      updated_at   = now();`,
  '',
].join('\n');

writeFileSync(outputPath, sql, 'utf-8');

console.log(`✓ Wrote ${rows.length} translations to ${outputPath}`);
console.log(`  Apply with: npx supabase db push`);
```

- [ ] **Step 2: Verify script parses**

```bash
npx tsx scripts/generate-translations-migration.ts --lang invalid 2>&1 | head -5
```

Expected: Usage error message (not a crash).

- [ ] **Step 3: Run all tests to make sure nothing is broken**

```bash
npm test
```

Expected: all tests PASS.

- [ ] **Step 4: Commit**

```bash
git add scripts/generate-translations-migration.ts
git commit -m "feat(scripts): add generate-translations-migration script to emit reviewed SQL"
```

---

## Post-implementation verification

After all tasks are complete, do a final end-to-end check:

1. **DB** — open Supabase Studio, verify `languages`, `flashcard_translations` tables exist, and the curated set backfill populated rows.

2. **Backend** — start the server (`cd backend && source venv/bin/activate && python run.py`), open `http://localhost:8000/docs`, test `PATCH /auth/profile` with a valid Supabase access token.

3. **Frontend** — start `npm run dev`, register a new account, verify the language selector appears and the selected language is saved. Open `/flashcards`, verify cards from curated Thai/Chinese sets show native text. Open `/settings`, change language, verify immediate effect.

4. **Type check** — `npm run type-check` must pass with no errors.

5. **Full test suite** — `npm test` must pass with no failures.
