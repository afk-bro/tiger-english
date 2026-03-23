# Auth Form Validation UX Design

## Goal

Replace the current submit-only / partially-broken validation feedback on the Register and Login forms with a hybrid blur/live system that gives users accurate, guidance-oriented feedback as they fill in their details.

## Background

The register form has Check/X icons on the password and confirm-password fields, but `isPasswordValid()` only checks ≥6 characters while the real schema requires min 8 + uppercase + special character — so the icon lies. The login form has no real-time feedback at all. Neither form currently uses RHF's blur or live-revalidation modes.

---

## Architecture

### New: `src/features/auth/passwordRules.ts`

Single source of truth for all password constraints. Exports a `PASSWORD_RULES` array that every consumer maps over — no rule label or regex is duplicated anywhere.

```ts
export const PASSWORD_RULES = [
  { key: 'minLength', label: 'At least 8 characters',            test: (v: string) => v.length >= 8 },
  { key: 'uppercase', label: 'One uppercase letter',              test: (v: string) => /[A-Z]/.test(v) },
  { key: 'special',   label: 'One special character (!@#$%^&*)', test: (v: string) => /[!@#$%^&*]/.test(v) },
];

export const isPasswordValid = (v: string) =>
  PASSWORD_RULES.every((r) => r.test(v));
```

`authSchema.ts` imports the regex constants from here so schema rules and UI rules cannot drift. `PasswordChecklist` maps over `PASSWORD_RULES`. `useRegisterForm` imports `isPasswordValid`.

### New: `src/components/auth/PasswordChecklist.tsx`

Purely presentational component. Props: `value: string`.

- **Hidden** when `value === ''`
- **Visible** once any character is typed
- Maps over `PASSWORD_RULES`; each row shows an icon + label
  - Rule met → green icon + green label
  - Rule unmet → neutral gray icon + gray label (never red while typing)
- Not styled as an error block — guidance tone only

### Modified: `src/features/auth/useRegisterForm.ts`

- Switch RHF to `mode: 'onBlur'`, `reValidateMode: 'onChange'`
- Remove `handleFieldChange` workaround (RHF handles error-clearing natively with these modes)
- Replace inline `isPasswordValid()` implementation with import from `passwordRules.ts`
- Fix `isConfirmPasswordValid()`: only returns true when `isPasswordValid(password)` is also true AND fields match

### New: `src/features/auth/useLoginForm.ts`

Extracted from `Login.tsx`. Same RHF modes (`onBlur` / `onChange`). Exposes:
- `register`, `handleSubmit`, `errors`, `watch`
- `getEmailValidationIcon()` — ✓ when valid format, ✗ when invalid (shown after blur)
- No password icon exposed — password field uses error state only

### Modified: `src/pages/Login.tsx`

Refactored to use `useLoginForm`. Email field gets ✓/✗ icon via `validationIcon` prop on `FormInput`. Password field: red border (`hasError`) on invalid format — no green success icon (client-side format check ≠ correct credentials).

---

## Behavior: Register Form

| Field | Trigger | Feedback |
|---|---|---|
| Username, names, email | Blur → live once errored | Inline error message; ErrorGuidanceCard for server errors |
| Password | First keystroke → live | PasswordChecklist appears; field border red on blur if any rule unmet; clears live as rules are satisfied |
| Confirm password | Blur → live once errored | ✓/✗ icon; green only when base password is valid AND fields match |
| All fields | Submit | Full RHF validation triggers regardless of blur state |

Server errors (username-taken, email-registered) continue to map to field-level errors via `useRegisterSubmit`. `ErrorGuidanceCard` stays unchanged.

## Behavior: Login Form

| Field | Trigger | Feedback |
|---|---|---|
| Email | Blur → live once errored | ✓/✗ icon |
| Password | Blur → live once errored | Red border only; no green state |
| All fields | Submit | Full validation triggers |

Server error ("Invalid credentials") surfaces as a field-level error on the password field.

---

## Testing

### `src/features/auth/__tests__/passwordRules.test.ts` (new)

Unit tests for each rule's `test()` function:
- `minLength`: passes at 8, fails at 7
- `uppercase`: passes with uppercase present, fails without
- `special`: passes with `!@#$%^&*` chars, fails without
- `isPasswordValid`: passes only when all three rules pass

### `src/components/auth/__tests__/PasswordChecklist.test.tsx` (new)

- Empty string → checklist not rendered
- One character typed → checklist visible; all rules neutral
- Password satisfying only `minLength` → that row green, others neutral
- Password satisfying all rules → all rows green

### `src/features/auth/__tests__/useRegisterForm.test.ts` (new or extended)

Confirm-password icon precondition:
1. Invalid password + matching confirm → icon is ✗ (not green)
2. Valid password + non-matching confirm → icon is ✗
3. Valid password + matching confirm → icon is ✓

### `src/__tests__/Register.test.tsx` (extended)

Password blur interaction sequence:
1. Type one invalid character into password field → checklist visible, no red border on field
2. Blur the field → red border appears
3. Continue typing to satisfy all three rules → checklist all green, red border clears

Existing boundary tests (username min/max, name max, password complexity) must continue to pass.

### `src/features/auth/__tests__/useLoginForm.test.ts` (new)

- Email ✓/✗ icon logic
- Password produces no icon
- Submit validates all fields

---

## Files Changed

| File | Action |
|---|---|
| `src/features/auth/passwordRules.ts` | Create |
| `src/components/auth/PasswordChecklist.tsx` | Create |
| `src/features/auth/useRegisterForm.ts` | Modify |
| `src/features/auth/useLoginForm.ts` | Create |
| `src/pages/Login.tsx` | Modify |
| `src/schemas/authSchema.ts` | Modify (import regex from passwordRules) |
| `src/features/auth/__tests__/passwordRules.test.ts` | Create |
| `src/components/auth/__tests__/PasswordChecklist.test.tsx` | Create |
| `src/__tests__/Register.test.tsx` | Extend |
| `src/features/auth/__tests__/useLoginForm.test.ts` | Create |
