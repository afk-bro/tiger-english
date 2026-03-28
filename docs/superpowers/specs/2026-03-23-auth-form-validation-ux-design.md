# Auth Form Validation UX Design

## Goal

Replace the current submit-only / partially-broken validation feedback on the Register and Login forms with a hybrid blur/live system that gives users accurate, guidance-oriented feedback as they fill in their details.

## Background

The register form has Check/X icons on the password and confirm-password fields, but `isPasswordValid()` only checks ≥6 characters while the real schema requires min 8 + uppercase + special character — so the icon lies. The login form has no real-time feedback at all. Neither form currently uses RHF's blur or live-revalidation modes.

---

## Architecture

### New: `src/features/auth/passwordRules.ts`

Single source of truth for all password constraints. Must be created before `authSchema.ts` is modified (authSchema imports from it).

```ts
export const UPPERCASE_RE    = /[A-Z]/;
export const SPECIAL_CHAR_RE = /[!@#$%^&*]/;
// SPECIAL_CHAR_RE is intentionally scoped to !@#$%^&* — matches the UI copy exactly.
// If the accepted set changes, update the regex, the label, and the authSchema error message together.

export type PasswordRule = { key: string; label: string; test: (v: string) => boolean };

export const PASSWORD_RULES: PasswordRule[] = [
  { key: 'minLength', label: 'At least 8 characters',            test: (v: string) => v.length >= 8 },
  { key: 'uppercase', label: 'One uppercase letter',              test: (v: string) => UPPERCASE_RE.test(v) },
  { key: 'special',   label: 'One special character (!@#$%^&*)', test: (v: string) => SPECIAL_CHAR_RE.test(v) },
];

export const isPasswordValid = (v: string) => PASSWORD_RULES.every((r) => r.test(v));
```

`authSchema.ts` imports `UPPERCASE_RE` and `SPECIAL_CHAR_RE` into the `registerSchema` `.regex()` calls only. `loginSchema` password validation is left unchanged (`min(8)` only). `SUPPORTED_LANGUAGES` stays in `authSchema.ts`. `PasswordChecklist` imports `PasswordRule` and `PASSWORD_RULES`. Both hooks import `isPasswordValid`.

### New: `src/components/auth/PasswordChecklist.tsx`

Purely presentational. Props: `value: string`.

- Root element has `data-testid="password-checklist"` for test assertions
- Hidden when `value === ''`
- Callers pass `value={watch('password') ?? ''}` to ensure a string is always provided
- Visible once any character is typed
- Maps over `PASSWORD_RULES`; each row: rule met → green icon + green label; rule unmet → neutral gray (never red while typing)
- Not styled as an error block — guidance tone only
- Rendered below the password `FormInput` in `Register.tsx`; the password `FormInput` has **no** `validationIcon` prop

### Modified: `src/features/auth/useRegisterForm.ts`

Switch RHF to `mode: 'onBlur'`, `reValidateMode: 'onChange'`.

**Revised public interface:**

| Member | Change |
|---|---|
| `register`, `handleSubmit`, `watch`, `setValue`, `setError`, `clearErrors`, `errors` | Unchanged |
| `handleFieldChange` | **Kept, no logic change.** It already only clears `type === 'server'` errors. Keep `onChange: handleFieldChange(field)` on all fields that currently have it, including `password` — the backend can return password field errors via `useRegisterSubmit`'s `FIELD_MAP`. |
| `getPasswordValidationIcon` | **Removed** — checklist replaces it |
| `getConfirmPasswordValidationIcon` | **Kept** — logic fixed: returns ✓ only when `isPasswordValid(password) && password === confirmPassword` |
| `password`, `confirmPassword` | **Removed** from return value — hook uses them internally only |

`isPasswordValid` is replaced with the import from `passwordRules.ts`.

**Note on `useRegisterSubmit`:** It imports `UseRegisterFormReturn` and uses only `setError` and `clearErrors`. These members are unchanged. The interface change (removing `password`, `confirmPassword`, `getPasswordValidationIcon`) is backward-compatible — no modifications needed there.

### Modified: `src/pages/Register.tsx`

- Remove `validationIcon={getPasswordValidationIcon()}` from the password `FormInput`; **keep `hasError={!!errors.password}` unchanged**
- Add `<PasswordChecklist value={watch('password') ?? ''} />` directly below the password `FormInput`
- Replace destructured `password` and `confirmPassword` with direct watch calls:
  ```ts
  const watchedPassword = watch('password') ?? '';
  const watchedConfirmPassword = watch('confirmPassword');
  ```
  The existing `const selectedLanguage = watch('native_language')` is unchanged.
- All field registrations, including `onChange: handleFieldChange(field)`, remain unchanged

### New: `src/features/auth/useLoginForm.ts`

Extracted from `Login.tsx`. Same RHF modes (`onBlur` / `onChange`). Public interface:

```ts
register, handleSubmit, errors, setError,
formState: { touchedFields, isSubmitting },
getEmailValidationIcon: () => React.ReactNode | null
```

`watch` is not exposed — no caller needs it.

- `isSubmitting` comes from RHF's `formState.isSubmitting` — replaces `useState(false)` in `Login.tsx`
- `getEmailValidationIcon()`: returns `null` when `!touchedFields.email`; returns ✓ (`<Check>`) when `touchedFields.email && !errors.email`; returns ✗ (`<X>`) when `touchedFields.email && !!errors.email`. Icon visibility is driven by `touchedFields` (set by RHF on blur with `mode: 'onBlur'`), not by `trigger()`.
- No password icon exposed
- **Server-error clearing on retype:** expose `handlePasswordChange` — a function that clears `errors.password` when its type is `'server'`. Wire it as `onChange` on the password field registration: `register('password', { onChange: handlePasswordChange })`. This mirrors `useRegisterForm`'s `handleFieldChange` pattern so that after an invalid-credentials error appears, typing immediately clears it. The email field gets the same treatment via `handleEmailChange` for symmetry (email can receive server errors from the backend too).
- `onSubmit` handler:
  - Calls `loginUser(data)`
  - On `{ success: false, message }`: calls `setError('password', { type: 'server', message })` — **removes the existing `toast.error` call for credential failures; replaced entirely by the inline `errors.password` display**
  - On `{ success: true }`: reads `useUserStore.getState().profile`; if profile exists: `toast.success` + `navigate('/home')`; if profile missing: `toast.error("Profile not found after login")` — preserves the existing guard
  - Network/unexpected errors: `toast.error`

### Modified: `src/pages/Login.tsx`

- Remove inline RHF setup (`useForm`, `zodResolver`, `useState(false)` for `isSubmitting`, local `onSubmit`)
- Import and use `useLoginForm`
- Email `FormInput`: add `validationIcon={getEmailValidationIcon()}` and `hasError={!!errors.email}`
- Password `FormInput`: add `hasError={!!errors.password}`, no `validationIcon`
- Existing inline error `<p>` elements for `errors.email` and `errors.password` stay as-is
- `disabled={isSubmitting}` on submit button uses `isSubmitting` from `useLoginForm`

---

## Behavior: Register Form

| Field | Trigger | Feedback |
|---|---|---|
| Username, email, names, password | Blur → live once errored (Zod via RHF); server errors cleared on retype via `handleFieldChange` | Inline error; ErrorGuidanceCard for server errors on username/email |
| Password | First keystroke → live | PasswordChecklist appears; **before first blur `errors.password` is undefined and the border is neutral — the checklist alone provides guidance**; after blur with unmet rules: border red via `hasError={!!errors.password}`; clears live as rules are satisfied |
| Confirm password | Blur → live once errored | ✓/✗ icon; ✓ only when base password is fully valid AND fields match |
| All fields | Submit | Full RHF validation triggers regardless of blur state. **If the password field was never blurred but submit fails validation, the border goes red** — `errors.password` is set by RHF on submit just as it would be after blur. "Blur-gated" applies only to the initial trigger, not to submit. |

## Behavior: Login Form

| Field | Trigger | Feedback |
|---|---|---|
| Email | After first blur (RHF sets `touchedFields.email`) | ✓ if valid; ✗ if invalid; `null` if untouched |
| Email (once touched) | Live | Updates as user corrects |
| Password | Blur → live once errored | Red border only; no green state |
| Password (server error) | Retype after server error | Server error (`type: 'server'`) clears immediately on keystroke via `handlePasswordChange` — mirrors register behavior |
| Email (server error) | Retype after server error | Server error on email clears on keystroke via `handleEmailChange` |
| All fields | Submit | Full validation triggers; password border goes red if invalid even if field was never blurred |

Invalid credentials → `errors.password` with `type: 'server'`, displayed by the existing inline `<p>` below the password field. No toast for credential errors.

---

## Testing

### `src/features/auth/__tests__/passwordRules.test.ts` (create)

- `UPPERCASE_RE`: matches uppercase letter, rejects lowercase-only string
- `SPECIAL_CHAR_RE`: matches `!`, `@`, etc.; rejects alphanumeric
- `PASSWORD_RULES[0].test` (minLength): passes at 8 chars, fails at 7
- `PASSWORD_RULES[1].test` (uppercase): passes with uppercase, fails without
- `PASSWORD_RULES[2].test` (special): passes with special char, fails without
- `isPasswordValid`: true only when all three pass; false when any single one fails

### `src/components/auth/__tests__/PasswordChecklist.test.tsx` (create)

Query via `screen.queryByTestId('password-checklist')` for visibility assertions.

- `value=""` → checklist not in the document
- Single character → checklist in document; no row has green styling
- Password meeting only `minLength` (e.g. `'abcdefgh'`) → first row green; others not
- Password meeting all rules (e.g. `'Secure1!'`) → all rows green

### `src/features/auth/__tests__/useRegisterForm.test.ts` (create)

Use `renderHook(() => useRegisterForm())` from `@testing-library/react`. Drive watched values using `act(() => result.current.setValue('password', '...'))` and `act(() => result.current.setValue('confirmPassword', '...'))` — RHF's `watch` updates synchronously after `setValue` inside `act`.

Confirm-password icon precondition — three cases:
1. `setValue('password', 'abc')` + `setValue('confirmPassword', 'abc')` → `getConfirmPasswordValidationIcon()` returns ✗ (password invalid)
2. `setValue('password', 'Secure1!')` + `setValue('confirmPassword', 'wrong')` → returns ✗ (no match)
3. `setValue('password', 'Secure1!')` + `setValue('confirmPassword', 'Secure1!')` → returns ✓

### `src/__tests__/Register.test.tsx` (extend)

Password blur interaction sequence using `userEvent`:
1. Type one invalid character into the password field → `screen.getByTestId('password-checklist')` is present; password input does not have an error border
2. Blur the field (`await userEvent.tab()`) → error border is present on the password input
3. Continue typing to satisfy all three rules → checklist rows all show green styling; error border clears

Existing boundary tests must continue to pass.

### `src/__tests__/Login.test.tsx` (create)

**Required mocks** (same pattern as `Register.test.tsx`):
```ts
vi.mock('@/features/auth/loginUser', () => ({ loginUser: vi.fn() }));
vi.mock('@/lib/supabase', () => ({ supabase: { auth: { signInWithOAuth: vi.fn() } } }));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});
```
Wrap renders in `<BrowserRouter>` and call `await i18n.changeLanguage('en')` in `beforeAll`.

Test cases:
- Submit with blank email → inline `errors.email` message visible
- Submit with blank password → inline `errors.password` message visible
- Email field: no icon before blur; after blur with valid email → ✓ icon; after blur with invalid email → ✗ icon. Use `userEvent.type` + `userEvent.tab()` to trigger real blur events (which set `touchedFields.email` via RHF's `mode: 'onBlur'`).
- Password field: no Check or X icon at any point
- `loginUser` resolves `{ success: false, message: 'Invalid email or password' }` → inline error appears below password field; `toast.error` not called
- After the server error appears on the password field: type one character into the password field → error message clears (server error cleared on retype)

### `src/features/auth/__tests__/useLoginForm.test.ts` (create)

Scope: submit/error logic only. Icon behavior is covered by `Login.test.tsx` where real blur events are available. `getEmailValidationIcon` relies on `touchedFields.email`, which RHF only sets via real blur events — not via `trigger()` or `setValue` in a hook-only context.

Use `renderHook` + `act`:

- `formState.isSubmitting` is `false` by default
- Mock `loginUser` to resolve `{ success: false, message: 'Invalid email or password' }` → after calling `result.current.handleSubmit(onSubmit)({email: 'a@b.com', password: 'Secure1!'})`, `errors.password.type === 'server'` and `errors.password.message` matches
- `loginUser` not called when submit is prevented by validation (blank fields)

---

## Files Changed

| File | Action |
|---|---|
| `src/features/auth/passwordRules.ts` | Create (first — authSchema imports from it) |
| `src/schemas/authSchema.ts` | Modify (import UPPERCASE_RE, SPECIAL_CHAR_RE into registerSchema only; loginSchema and SUPPORTED_LANGUAGES unchanged) |
| `src/components/auth/PasswordChecklist.tsx` | Create |
| `src/features/auth/useRegisterForm.ts` | Modify |
| `src/features/auth/useLoginForm.ts` | Create |
| `src/pages/Register.tsx` | Modify |
| `src/pages/Login.tsx` | Modify |
| `src/features/auth/useRegisterSubmit.ts` | No changes — interface change is backward-compatible |
| `src/features/auth/__tests__/passwordRules.test.ts` | Create |
| `src/components/auth/__tests__/PasswordChecklist.test.tsx` | Create |
| `src/features/auth/__tests__/useRegisterForm.test.ts` | Create |
| `src/__tests__/Register.test.tsx` | Extend |
| `src/__tests__/Login.test.tsx` | Create |
| `src/features/auth/__tests__/useLoginForm.test.ts` | Create |
