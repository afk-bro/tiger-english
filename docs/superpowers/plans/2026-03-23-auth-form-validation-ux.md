# Auth Form Validation UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give users accurate, real-time validation feedback on the Register and Login forms — replacing broken/missing feedback with a hybrid blur/live system anchored to a shared password rules module.

**Architecture:** A new `passwordRules.ts` module exports regex constants, a typed `PASSWORD_RULES` array, and `isPasswordValid()` — imported by `authSchema.ts`, `PasswordChecklist.tsx`, and both form hooks. `useRegisterForm` switches to RHF `mode: 'onBlur'` / `reValidateMode: 'onChange'` and drops the old broken password icon in favor of a new `PasswordChecklist` component. `useLoginForm` is a new hook extracted from `Login.tsx` that adds email icon feedback and inline server-error display.

**Tech Stack:** React 19, React Hook Form, Zod, lucide-react, Tailwind CSS, Vitest + @testing-library/react

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/features/auth/passwordRules.ts` | Create | Single source of truth for password regex constants, rule array, `isPasswordValid` |
| `src/schemas/authSchema.ts` | Modify | Import regexes from `passwordRules.ts` — no behavior change |
| `src/components/auth/PasswordChecklist.tsx` | Create | Presentational checklist; maps over `PASSWORD_RULES`, green/neutral per rule |
| `src/features/auth/useRegisterForm.ts` | Modify | Switch RHF modes; drop `getPasswordValidationIcon`; fix confirm-password icon logic |
| `src/pages/Register.tsx` | Modify | Swap password `validationIcon` for `<PasswordChecklist>` |
| `src/features/auth/useLoginForm.ts` | Create | Extracted login logic: blur/live modes, email icon, server-error clearing |
| `src/pages/Login.tsx` | Modify | Use `useLoginForm`; add email icon + `hasError` on both fields |
| `src/features/auth/__tests__/passwordRules.test.ts` | Create | Unit tests for every export in `passwordRules.ts` |
| `src/components/auth/__tests__/PasswordChecklist.test.tsx` | Create | Visibility and styling tests for `PasswordChecklist` |
| `src/features/auth/__tests__/useRegisterForm.test.ts` | Create | Hook unit tests for confirm-password icon precondition |
| `src/__tests__/Register.test.tsx` | Extend | Add password blur interaction sequence test |
| `src/features/auth/__tests__/useLoginForm.test.ts` | Create | Hook unit tests for server-error submit logic |
| `src/__tests__/Login.test.tsx` | Create | Integration tests for Login page validation feedback |

---

### Task 1: Create `passwordRules.ts` and its unit tests

**Files:**
- Create: `src/features/auth/__tests__/passwordRules.test.ts`
- Create: `src/features/auth/passwordRules.ts`

- [ ] **Step 1: Write the failing tests**

Create `src/features/auth/__tests__/passwordRules.test.ts`:

```ts
/// <reference types="vitest/globals" />
import {
  UPPERCASE_RE,
  SPECIAL_CHAR_RE,
  PASSWORD_RULES,
  isPasswordValid,
} from '../passwordRules';

describe('UPPERCASE_RE', () => {
  it('matches a string containing an uppercase letter', () => {
    expect(UPPERCASE_RE.test('Hello')).toBe(true);
  });
  it('rejects a lowercase-only string', () => {
    expect(UPPERCASE_RE.test('hello')).toBe(false);
  });
});

describe('SPECIAL_CHAR_RE', () => {
  it('matches strings containing !@#$%^&*', () => {
    expect(SPECIAL_CHAR_RE.test('hello!')).toBe(true);
    expect(SPECIAL_CHAR_RE.test('hello@')).toBe(true);
    expect(SPECIAL_CHAR_RE.test('hello#')).toBe(true);
  });
  it('rejects alphanumeric-only strings', () => {
    expect(SPECIAL_CHAR_RE.test('hello123')).toBe(false);
  });
});

describe('PASSWORD_RULES[0] — minLength', () => {
  it('passes at exactly 8 characters', () => {
    expect(PASSWORD_RULES[0].test('12345678')).toBe(true);
  });
  it('fails at 7 characters', () => {
    expect(PASSWORD_RULES[0].test('1234567')).toBe(false);
  });
});

describe('PASSWORD_RULES[1] — uppercase', () => {
  it('passes when at least one uppercase letter is present', () => {
    expect(PASSWORD_RULES[1].test('Hello')).toBe(true);
  });
  it('fails with no uppercase letter', () => {
    expect(PASSWORD_RULES[1].test('hello')).toBe(false);
  });
});

describe('PASSWORD_RULES[2] — special character', () => {
  it('passes when a special character is present', () => {
    expect(PASSWORD_RULES[2].test('hello!')).toBe(true);
  });
  it('fails with no special character', () => {
    expect(PASSWORD_RULES[2].test('hello123')).toBe(false);
  });
});

describe('isPasswordValid', () => {
  it('returns true when all three rules pass', () => {
    expect(isPasswordValid('Secure1!')).toBe(true);
  });
  it('returns false when minLength fails', () => {
    expect(isPasswordValid('Sh1!')).toBe(false);
  });
  it('returns false when uppercase fails', () => {
    expect(isPasswordValid('secure1!')).toBe(false);
  });
  it('returns false when special character fails', () => {
    expect(isPasswordValid('Secure123')).toBe(false);
  });
});
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
npm test -- src/features/auth/__tests__/passwordRules.test.ts --run
```

Expected: FAIL — module `../passwordRules` not found.

- [ ] **Step 3: Implement `passwordRules.ts`**

Create `src/features/auth/passwordRules.ts`:

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

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npm test -- src/features/auth/__tests__/passwordRules.test.ts --run
```

Expected: All 10 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/auth/passwordRules.ts src/features/auth/__tests__/passwordRules.test.ts
git commit -m "feat(auth): add passwordRules — shared regex constants and isPasswordValid"
```

---

### Task 2: Update `authSchema.ts` to import from `passwordRules.ts`

**Files:**
- Modify: `src/schemas/authSchema.ts`

No behavior changes — just swapping inline regex literals for named imports. `loginSchema` is untouched.

- [ ] **Step 1: Update `authSchema.ts`**

Replace the file contents with:

```ts
import { z } from "zod";
import { UPPERCASE_RE, SPECIAL_CHAR_RE } from "@/features/auth/passwordRules";

const SUPPORTED_LANGUAGES = ['th', 'zh', 'vi'] as const;

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50, "First name must be 50 characters or fewer"),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name must be 50 characters or fewer"),
  email: z.string().email("Invalid email"),
  password: z.string()
    .min(8, "Password must be at least 8 characters")
    .max(100, "Password must be 100 characters or fewer")
    .regex(UPPERCASE_RE, "Password must contain at least one uppercase letter")
    .regex(SPECIAL_CHAR_RE, "Password must contain at least one special character (!@#$%^&*)"),
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

- [ ] **Step 2: Run all tests — confirm nothing broke**

```bash
npm test -- --run
```

Expected: All existing tests PASS (same count as before this task).

- [ ] **Step 3: Run type-check**

```bash
npm run type-check
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/schemas/authSchema.ts
git commit -m "refactor(auth): import password regexes from passwordRules in authSchema"
```

---

### Task 3: Create `PasswordChecklist` component and its tests

**Files:**
- Create: `src/components/auth/__tests__/PasswordChecklist.test.tsx`
- Create: `src/components/auth/PasswordChecklist.tsx`

- [ ] **Step 1: Write the failing tests**

Create `src/components/auth/__tests__/PasswordChecklist.test.tsx`:

```tsx
/// <reference types="vitest/globals" />
import { render, screen } from '@testing-library/react';
import { PasswordChecklist } from '../PasswordChecklist';

describe('PasswordChecklist', () => {
  it('renders nothing when value is empty string', () => {
    render(<PasswordChecklist value="" />);
    expect(screen.queryByTestId('password-checklist')).not.toBeInTheDocument();
  });

  it('is visible once any character is typed', () => {
    render(<PasswordChecklist value="a" />);
    expect(screen.getByTestId('password-checklist')).toBeInTheDocument();
  });

  it('shows all three rule rows when visible', () => {
    render(<PasswordChecklist value="a" />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
  });

  it('shows no green styling when no rules are met', () => {
    render(<PasswordChecklist value="a" />);
    const spans = screen.getByTestId('password-checklist').querySelectorAll('span');
    spans.forEach((span) => {
      expect(span).not.toHaveClass('text-green-600');
    });
  });

  it('shows only the minLength row green when value is 8+ chars with no uppercase or special', () => {
    render(<PasswordChecklist value="abcdefgh" />);
    const spans = screen.getByTestId('password-checklist').querySelectorAll('span');
    expect(spans[0]).toHaveClass('text-green-600'); // minLength
    expect(spans[1]).not.toHaveClass('text-green-600'); // uppercase
    expect(spans[2]).not.toHaveClass('text-green-600'); // special
  });

  it('shows all rows green when all rules are met', () => {
    render(<PasswordChecklist value="Secure1!" />);
    const spans = screen.getByTestId('password-checklist').querySelectorAll('span');
    spans.forEach((span) => {
      expect(span).toHaveClass('text-green-600');
    });
  });
});
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
npm test -- src/components/auth/__tests__/PasswordChecklist.test.tsx --run
```

Expected: FAIL — module not found.

- [ ] **Step 3: Implement `PasswordChecklist.tsx`**

Create `src/components/auth/PasswordChecklist.tsx`:

```tsx
import { Check, Circle } from 'lucide-react';
import { PASSWORD_RULES, PasswordRule } from '@/features/auth/passwordRules';

interface PasswordChecklistProps {
  value: string;
}

export function PasswordChecklist({ value }: PasswordChecklistProps) {
  if (value === '') return null;

  return (
    <ul data-testid="password-checklist" className="mt-2 space-y-1">
      {PASSWORD_RULES.map((rule: PasswordRule) => {
        const met = rule.test(value);
        return (
          <li key={rule.key} className="flex items-center gap-2 text-sm">
            {met ? (
              <Check className="w-4 h-4 text-green-500 shrink-0" />
            ) : (
              <Circle className="w-4 h-4 text-gray-400 shrink-0" />
            )}
            <span className={met ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
              {rule.label}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
npm test -- src/components/auth/__tests__/PasswordChecklist.test.tsx --run
```

Expected: All 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/auth/PasswordChecklist.tsx src/components/auth/__tests__/PasswordChecklist.test.tsx
git commit -m "feat(auth): add PasswordChecklist component"
```

---

### Task 4: Update `useRegisterForm` — RHF modes, fix confirm-password icon, add hook tests

**Files:**
- Create: `src/features/auth/__tests__/useRegisterForm.test.ts`
- Modify: `src/features/auth/useRegisterForm.ts`

- [ ] **Step 1: Write the failing hook tests**

Create `src/features/auth/__tests__/useRegisterForm.test.ts`:

```ts
/// <reference types="vitest/globals" />
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useRegisterForm } from '../useRegisterForm';

describe('useRegisterForm — getConfirmPasswordValidationIcon', () => {
  it('returns X icon when password is invalid even if confirm matches', async () => {
    const { result } = renderHook(() => useRegisterForm());
    await act(async () => {
      result.current.setValue('password', 'abc');
      result.current.setValue('confirmPassword', 'abc');
    });
    const icon = result.current.getConfirmPasswordValidationIcon() as React.ReactElement | null;
    expect(icon).not.toBeNull();
    expect(icon!.props.className).toContain('text-red-500');
  });

  it('returns X icon when password is valid but confirm does not match', async () => {
    const { result } = renderHook(() => useRegisterForm());
    await act(async () => {
      result.current.setValue('password', 'Secure1!');
      result.current.setValue('confirmPassword', 'wrong');
    });
    const icon = result.current.getConfirmPasswordValidationIcon() as React.ReactElement | null;
    expect(icon!.props.className).toContain('text-red-500');
  });

  it('returns Check icon when password is valid and confirm matches', async () => {
    const { result } = renderHook(() => useRegisterForm());
    await act(async () => {
      result.current.setValue('password', 'Secure1!');
      result.current.setValue('confirmPassword', 'Secure1!');
    });
    const icon = result.current.getConfirmPasswordValidationIcon() as React.ReactElement | null;
    expect(icon!.props.className).toContain('text-green-500');
  });
});
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
npm test -- src/features/auth/__tests__/useRegisterForm.test.ts --run
```

Expected: FAIL — `getConfirmPasswordValidationIcon` returns ✓ for case 1 (the old broken logic accepts any matching strings).

- [ ] **Step 3: Update `useRegisterForm.ts`**

Replace the entire file:

```ts
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, X } from "lucide-react";
import { registerSchema, RegisterFormData } from "@/schemas/authSchema";
import { isPasswordValid } from "@/features/auth/passwordRules";

export interface UseRegisterFormReturn {
  // Form methods
  register: ReturnType<typeof useForm<RegisterFormData>>['register'];
  handleSubmit: ReturnType<typeof useForm<RegisterFormData>>['handleSubmit'];
  watch: ReturnType<typeof useForm<RegisterFormData>>['watch'];
  setValue: ReturnType<typeof useForm<RegisterFormData>>['setValue'];
  setError: ReturnType<typeof useForm<RegisterFormData>>['setError'];
  clearErrors: ReturnType<typeof useForm<RegisterFormData>>['clearErrors'];
  errors: ReturnType<typeof useForm<RegisterFormData>>['formState']['errors'];

  // Helpers
  handleFieldChange: (fieldName: keyof RegisterFormData) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  getConfirmPasswordValidationIcon: () => React.ReactNode | null;
}

export function useRegisterForm(): UseRegisterFormReturn {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const password = watch("password");
  const confirmPassword = watch("confirmPassword");

  // Only clears server errors — Zod errors are cleared by reValidateMode:'onChange'.
  const handleFieldChange = (fieldName: keyof RegisterFormData) => {
    return (_e: React.ChangeEvent<HTMLInputElement>) => {
      if (errors[fieldName]?.type === 'server') {
        clearErrors(fieldName);
      }
    };
  };

  // ✓ only when the base password fully satisfies all rules AND both fields match.
  const getConfirmPasswordValidationIcon = (): React.ReactNode | null => {
    if (!confirmPassword) return null;
    const valid = isPasswordValid(password) && confirmPassword === password;
    return valid
      ? React.createElement(Check, { className: "w-5 h-5 text-green-500" })
      : React.createElement(X, { className: "w-5 h-5 text-red-500" });
  };

  return {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    errors,
    handleFieldChange,
    getConfirmPasswordValidationIcon,
  };
}
```

- [ ] **Step 4: Run all tests — confirm everything passes**

```bash
npm test -- --run
```

Expected: All tests PASS. The 3 new hook tests pass; existing Register boundary tests still pass.

- [ ] **Step 5: Commit**

```bash
git add src/features/auth/useRegisterForm.ts src/features/auth/__tests__/useRegisterForm.test.ts
git commit -m "refactor(auth): useRegisterForm — onBlur modes, fix confirm-password icon precondition"
```

---

### Task 5: Update `Register.tsx` and add the blur interaction test

**Files:**
- Modify: `src/pages/Register.tsx`
- Extend: `src/__tests__/Register.test.tsx`

- [ ] **Step 1: Write the failing blur interaction test**

Add this test inside the `describe('Register.tsx', ...)` block in `src/__tests__/Register.test.tsx`:

```tsx
it('shows password checklist on type, red border on blur, clears when rules satisfied', async () => {
  const user = userEvent.setup();
  render(<Register />, { wrapper: Wrapper });

  const passwordInput = screen.getByLabelText(/^password$/i);

  // Step 1: type one character — checklist appears, no red border yet
  await user.type(passwordInput, 'a');
  expect(screen.getByTestId('password-checklist')).toBeInTheDocument();
  expect(passwordInput).not.toHaveClass('border-red-300');

  // Step 2: blur the field — red border appears
  await user.tab();
  expect(passwordInput).toHaveClass('border-red-300');

  // Step 3: type a valid password — checklist goes all green, red border clears
  await user.type(passwordInput, 'Secure1!');
  expect(passwordInput).not.toHaveClass('border-red-300');
  const spans = screen.getByTestId('password-checklist').querySelectorAll('span');
  spans.forEach((span) => {
    expect(span).toHaveClass('text-green-600');
  });
});
```

- [ ] **Step 2: Run the test — confirm it fails**

```bash
npm test -- src/__tests__/Register.test.tsx --run
```

Expected: FAIL — `getByTestId('password-checklist')` not found (PasswordChecklist not wired into Register.tsx yet).

- [ ] **Step 3: Update `Register.tsx`**

Make these targeted changes to `src/pages/Register.tsx`:

**3a.** Add the `PasswordChecklist` import at the top:
```tsx
import { PasswordChecklist } from '@/components/auth/PasswordChecklist';
```

**3b.** Remove `getPasswordValidationIcon` from the `useRegisterForm()` destructure. The destructure becomes:
```tsx
const {
  register,
  handleSubmit,
  setError,
  clearErrors,
  errors,
  handleFieldChange,
  getConfirmPasswordValidationIcon,
  setValue,
  watch,
} = useRegisterForm();
```

**3c.** Below the password `FormInput` (the one with `label={t("register.password")}`), remove `validationIcon={getPasswordValidationIcon()}` and add `<PasswordChecklist value={watch('password') ?? ''} />` immediately after the closing `/>` of the FormInput. The password section becomes:

```tsx
<FormInput
  label={t("register.password")}
  icon={<Lock className="w-5 h-5 text-gray-400 dark:text-gray-500" />}
  type="password"
  placeholder="••••••••"
  hasError={!!errors.password}
  {...register("password", {
    onChange: handleFieldChange("password")
  })}
/>
<PasswordChecklist value={watch('password') ?? ''} />
{errors.password && (
  <p className="text-sm text-red-500 mt-1">
    {errors.password.message}
  </p>
)}
```

- [ ] **Step 4: Run all tests — confirm they pass**

```bash
npm test -- --run
```

Expected: All tests PASS including the new blur interaction test. Existing boundary tests still pass.

- [ ] **Step 5: Run type-check**

```bash
npm run type-check
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Register.tsx src/__tests__/Register.test.tsx
git commit -m "feat(register): replace password icon with PasswordChecklist, add blur interaction test"
```

---

### Task 6: Create `useLoginForm` hook and its unit tests

**Files:**
- Create: `src/features/auth/__tests__/useLoginForm.test.ts`
- Create: `src/features/auth/useLoginForm.ts`

- [ ] **Step 1: Write the failing hook tests**

Create `src/features/auth/__tests__/useLoginForm.test.ts`:

```ts
/// <reference types="vitest/globals" />
import { renderHook, act } from '@testing-library/react';
import { useLoginForm } from '../useLoginForm';
import { loginUser } from '@/features/auth/loginUser';

vi.mock('@/features/auth/loginUser');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});
vi.mock('@/stores/useUserStore', () => ({
  useUserStore: { getState: vi.fn(() => ({ profile: null })) },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

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
});
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
npm test -- src/features/auth/__tests__/useLoginForm.test.ts --run
```

Expected: FAIL — module `../useLoginForm` not found.

- [ ] **Step 3: Implement `useLoginForm.ts`**

Create `src/features/auth/useLoginForm.ts`:

```ts
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { loginSchema, LoginFormData } from '@/schemas/authSchema';
import { loginUser } from '@/features/auth/loginUser';
import { useUserStore } from '@/stores/useUserStore';

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

  // ✓ after blur with valid format; ✗ after blur with invalid; null before first blur.
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
      // Replace the old toast.error — server errors surface inline below the password field.
      setError('password', {
        type: 'server',
        message: result.message || 'Invalid email or password',
      });
      return;
    }

    const updatedProfile = useUserStore.getState().profile;
    if (updatedProfile) {
      toast.success('Login successful');
      navigate('/home');
    } else {
      toast.error('Profile not found after login');
    }
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

- [ ] **Step 4: Run the hook tests — confirm they pass**

```bash
npm test -- src/features/auth/__tests__/useLoginForm.test.ts --run
```

Expected: Both tests PASS.

- [ ] **Step 5: Run all tests to catch regressions**

```bash
npm test -- --run
```

Expected: All tests PASS.

- [ ] **Step 6: Commit**

```bash
git add src/features/auth/useLoginForm.ts src/features/auth/__tests__/useLoginForm.test.ts
git commit -m "feat(auth): add useLoginForm hook with blur modes, email icon, server-error clearing"
```

---

### Task 7: Refactor `Login.tsx` and add Login integration tests

**Files:**
- Create: `src/__tests__/Login.test.tsx`
- Modify: `src/pages/Login.tsx`

- [ ] **Step 1: Write the failing integration tests**

Create `src/__tests__/Login.test.tsx`:

```tsx
/// <reference types="vitest/globals" />
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Login from '@/pages/Login';
import { toast } from 'sonner';
import i18n from '@/lib/i18n';
import { loginUser } from '@/features/auth/loginUser';

beforeAll(async () => {
  await i18n.changeLanguage('en');
});

vi.mock('@/features/auth/loginUser', () => ({
  loginUser: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOAuth: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

vi.mock('@/stores/useUserStore', () => ({
  useUserStore: { getState: vi.fn(() => ({ profile: null })) },
}));

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Login.tsx', () => {
  it('shows email error when submitted blank', async () => {
    render(<Login />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));
    await waitFor(() => {
      expect(screen.getByText('Invalid email')).toBeInTheDocument();
    });
  });

  it('shows password error when submitted blank', async () => {
    render(<Login />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    });
  });

  it('shows no validation icon for email before the field is blurred', () => {
    render(<Login />, { wrapper: Wrapper });
    // Before blur, getEmailValidationIcon returns null — no pr-10 padding on input
    const emailInput = screen.getByLabelText(/email address/i);
    expect(emailInput).not.toHaveClass('pr-10');
  });

  it('shows check icon (no error border) after blur with valid email', async () => {
    const user = userEvent.setup();
    render(<Login />, { wrapper: Wrapper });
    await user.type(screen.getByLabelText(/email address/i), 'valid@example.com');
    await user.tab();
    await waitFor(() => {
      expect(screen.getByLabelText(/email address/i)).not.toHaveClass('border-red-300');
      // pr-10 class present means validationIcon was rendered
      expect(screen.getByLabelText(/email address/i)).toHaveClass('pr-10');
    });
  });

  it('shows X icon (error border) after blur with invalid email', async () => {
    const user = userEvent.setup();
    render(<Login />, { wrapper: Wrapper });
    await user.type(screen.getByLabelText(/email address/i), 'notanemail');
    await user.tab();
    await waitFor(() => {
      expect(screen.getByLabelText(/email address/i)).toHaveClass('border-red-300');
      expect(screen.getByLabelText(/email address/i)).toHaveClass('pr-10');
    });
  });

  it('never shows a validation icon on the password field', async () => {
    const user = userEvent.setup();
    render(<Login />, { wrapper: Wrapper });
    const passwordInput = screen.getByLabelText(/^password$/i);
    await user.type(passwordInput, 'Secure1!');
    await user.tab();
    // No validationIcon prop on password FormInput → no pr-10 padding
    expect(passwordInput).not.toHaveClass('pr-10');
  });

  it('shows inline error below password and does not toast on invalid credentials', async () => {
    vi.mocked(loginUser).mockResolvedValue({
      success: false,
      message: 'Invalid email or password',
    });
    const user = userEvent.setup();
    render(<Login />, { wrapper: Wrapper });

    await user.type(screen.getByLabelText(/email address/i), 'a@b.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Secure1!');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
    expect(toast.error).not.toHaveBeenCalledWith('Invalid email or password');
  });

  it('clears server error on password field when user retypes', async () => {
    vi.mocked(loginUser).mockResolvedValue({
      success: false,
      message: 'Invalid email or password',
    });
    const user = userEvent.setup();
    render(<Login />, { wrapper: Wrapper });

    await user.type(screen.getByLabelText(/email address/i), 'a@b.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Secure1!');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });

    // Typing in password field should clear the server error
    await user.type(screen.getByLabelText(/^password$/i), 'x');

    await waitFor(() => {
      expect(screen.queryByText('Invalid email or password')).not.toBeInTheDocument();
    });
  });
});
```

- [ ] **Step 2: Run tests — confirm they fail**

```bash
npm test -- src/__tests__/Login.test.tsx --run
```

Expected: FAIL — Login.tsx doesn't use `useLoginForm` yet; no `hasError` props; toast is still used for credential errors.

- [ ] **Step 3: Refactor `Login.tsx`**

Replace the entire file:

```tsx
import Button from "../components/ui/Button";
import FormInput from "../components/ui/FormInput";
import GoogleAuthButton from "@/components/ui/GoogleAuthButton";
import { Mail, Lock, LogIn } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useLoginForm } from "@/features/auth/useLoginForm";

export default function Login() {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    onSubmit,
    errors,
    formState: { isSubmitting },
    getEmailValidationIcon,
    handleEmailChange,
    handlePasswordChange,
  } = useLoginForm();

  return (
    <section className="min-h-screen flex items-center justify-center bg-semantic-bg dark:bg-semantic-bg px-4 md:px-6 py-12 md:py-16">
      <div className="w-full max-w-4xl mx-auto flex justify-center">
        <div className="card card-lg w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl mb-4">
              <LogIn className="text-white w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">
              {t("login.title")}
            </h2>
            <p className="text-sm text-text-light/70 dark:text-text-dark/70 mt-2">
              {t("login.subtitle")}
            </p>
          </div>

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

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <FormInput
              label={t("login.email")}
              icon={<Mail className="w-5 h-5 text-gray-400 dark:text-gray-500" />}
              validationIcon={getEmailValidationIcon()}
              type="email"
              placeholder="you@example.com"
              hasError={!!errors.email}
              {...register("email", { onChange: handleEmailChange })}
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
            )}
            <FormInput
              label={t("login.password")}
              icon={<Lock className="w-5 h-5 text-gray-400 dark:text-gray-500" />}
              type="password"
              placeholder="••••••••"
              hasError={!!errors.password}
              {...register("password", { onChange: handlePasswordChange })}
            />
            {errors.password && (
              <p className="text-sm text-red-500 mt-1">
                {errors.password.message}
              </p>
            )}
            <Button
              type="submit"
              variant="primary"
              iconRight={<LogIn />}
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? t("login.loading") : t("login.submit")}
            </Button>
          </form>

          <p className="text-sm text-center text-text-light/70 dark:text-text-dark/70">
            {t("login.no_account")}{" "}
            <Link
              to="/register"
              className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
            >
              {t("login.create_account")}
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 4: Run all tests — confirm everything passes**

```bash
npm test -- --run
```

Expected: All tests PASS including all 7 new Login tests. Full test count increases by 7.

- [ ] **Step 5: Run type-check**

```bash
npm run type-check
```

Expected: No errors.

- [ ] **Step 6: Commit**

```bash
git add src/pages/Login.tsx src/__tests__/Login.test.tsx
git commit -m "feat(login): add useLoginForm, email validation icon, inline server errors"
```

---

## Final verification

- [ ] **Run the full test suite one last time**

```bash
npm test -- --run
```

Expected: All tests pass. Count should be original + 22 new tests across 4 new/extended files.

- [ ] **Run type-check**

```bash
npm run type-check
```

Expected: No errors.
