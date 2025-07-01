# Dev Notes – July 3, 2025

## ✅ Contact Page

* Created `Contact.tsx` with two-column layout (form + connect section)
* Extracted form logic to `components/forms/ContactForm.tsx`
* Connected to `contactFormSchema` in `schemas/contactSchema.ts`
* Uses `react-hook-form` + `zodResolver`
* Shows toast on success/failure
* Added input validation and error messaging
* Supports both `<input>` and `<textarea>` via shared `FormInput` component

## ✅ About Page

* Built `About.tsx` with personal yet professional tone
* Added Tailwind styling with dark mode support
* Optional avatar/photo shown next to heading
* Explained project motivation, background, and mission
* Included a contact call-to-action (email link)

## ✅ TypeScript Improvements

* Updated `FormInputProps` to include:

  * `error?: string`
  * `id?: string`
  * `rows?: number`
* Fixed TS warning: unused `err` in `catch` block → renamed to `_err` or removed

## ✅ Git + Branch Management

* Branch created: `feature/contact`
* Forgot to pull `main` before starting → stashed work, pulled `main`, reapplied
* Merged in `refactor/schemas` work to access shared validation
* Clean recovery with `git stash pop` after pulling latest main

## ✅ UX Decisions

* Light/Dark toggle uses only sun/moon icons (no text)
* NavLink component built for active styling, though not strictly less code
* Decided to modularize dashboard further (done previously)

## ✅ Dev Tools + Workflow

* Confirmed folder structure is clean and scalable
* Using `__tests__/` for unit tests, `test/setup.ts` for global setup
* Committed using conventional commit style:

  * `feat(contact): extract form into component and connect zod schema`

## 🧠 Notes

* TS `?` = optional prop (e.g. `error?: string`)
* Zod is not just for DB objects — it's for any input validation
* Schemas should live in `/schemas`, not in feature folders
* Avatar: one-syllable names are fine abroad (e.g., "Tom", "Jay")
* Consider adding XP bar and flashcard preview to dashboard soon
