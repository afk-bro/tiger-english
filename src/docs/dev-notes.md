# Gain English – Dev Notes

## 1. Supabase Auth Integration
- `registerUser.ts`: handles sign-up using Supabase:
  - `auth.signUp({ email, password })`
  - Inserts user profile into `profiles` table
  - Supabase requires insert() payload to be an array of rows
- Success/Failure handled via `sonner.toast`
- Navigation controlled via `useNavigate('/login')` after success

## 2. Dark Mode Toggle
- Uses a custom `useDarkMode` hook
  - Checks `localStorage.theme` and `matchMedia`
  - Applies class to `<html>` root
- Tailwind configured with `darkMode: 'class'`
- Toggle via `<DarkModeToggle />` in `<Header />`

## 3. i18n Setup
- Initialized in `@/lib/i18n.ts`
  - Uses `i18next` + `react-i18next`
  - Languages: English (`en`) and Thai (`th`)
- Usage via `t("key.path")`
- In tests, enforced with: `await i18n.changeLanguage("en")`

## 4. Form Architecture
- Built with `react-hook-form` + `zod`
  - Schema-driven validation
  - Error messages shown below fields
- Inputs rendered via shared `<FormInput />` component
  - `forwardRef` enabled
  - `label` and `htmlFor` properly linked for accessibility

## 5. Testing
- Uses `vitest`, `@testing-library/react`, `jest-dom`
- `setup.ts` includes:
  - `import '@testing-library/jest-dom'`
  - `window.matchMedia` polyfill
- `Register.test.tsx`:
  - Mocks Supabase auth and profile insert
  - Mocks toast and useNavigate
  - Verifies user registration, toast, and navigation

## 6. Git & Workflow
- Feature branches used: `feat/translation`, `feat/testing`, etc.
- Commit conventions:
  - `feat`: new features
  - `fix`: bug fixes
  - `refactor`: structural improvements
  - `test`: test creation
- TODO: Split Supabase work into its own commit in the future
- Use PRs for tracking and merging changes

## 7. Other Patterns
- Aliases set with `@` via `vite.config.ts` + `tsconfig.json`
- Button components accept `variant`, `size`, `iconRight`, `disabled`
- Language toggle via `LanguageSwitcher.tsx` with `i18n.changeLanguage()`
