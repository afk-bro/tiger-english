# Codebase audit — 2026-05-06

**Scope.** Frontend (`src/`) and backend (`backend/app/`), excluding tests, generated types, and `node_modules`. ~208 source files, ~19.9k LOC source, ~8k LOC tests.

**Method.** Mechanical sweeps for size, duplication, type discipline, i18n parity, test coverage gaps, and dead code. Findings are grouped by **expected ROI** (high → low). Each finding lists evidence, recommended action, and an estimated effort tier (S = afternoon, M = day, L = week).

This is an audit, not a plan. The goal is to surface signal so we can pick what's worth changing — not to imply that everything listed should be done.

---

## TL;DR — top six

1. **Three concurrent API client conventions.** `auth.ts` rolls its own `makeRequest`; `aiTutor.ts` and `progress.ts` each implement their own `authedFetch`; 10 hooks/components inline the bearer-token + fetch dance directly. **Effort: M.** [§1.1](#11)
2. **`API_BASE` constant duplicated 6× verbatim.** Same `import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1"` literal in six files. **Effort: S.** [§1.2](#12)
3. **`MissionRunnerPage.tsx` is 845 lines** mixing 8 components, hooks, fetch logic, and a hardcoded stub-reply generator. **Effort: M.** [§2.1](#21)
4. **`backend/app/api/v1/conversations.py` is 682 lines** holding rate-limiting, scenarios, turn handling, scoring, and feedback in one file. **Effort: M.** [§2.2](#22)
5. **Five whole frontend feature folders have zero tests** (admin, assessment, conversations, org-admin, teacher) — covering `MissionRunnerPage` (845 LOC) and `AssessmentRunnerPage` (492 LOC). **Effort: M–L.** [§4.1](#41)
6. **6 of 8 backend API routers have no endpoint tests**, including `conversations.py` (682 LOC). **Effort: M.** [§4.2](#42)

---

## 1. Cross-cutting duplication

### 1.1 Three coexisting API client conventions <a id="11"></a>

The codebase has settled into three different ways to call the FastAPI backend:

| Convention | Files | Notes |
|---|---|---|
| **Class instance with private `makeRequest<T>`** | `src/lib/api/auth.ts` | No bearer wiring on the helper itself; callers pass `accessToken` per-call |
| **Class instance with private `authedFetch<T>`** | `src/lib/api/aiTutor.ts`, `src/lib/api/progress.ts` | Helper grabs the supabase session and injects the bearer; both implement their own copy of the same ~15 lines |
| **Inline bearer-token boilerplate** | 10 files (see below) | Each call site re-implements `getSession` → `Authorization: Bearer …` → `fetch` → status handling |

Files with inline bearer boilerplate (no client class):

```
src/features/conversations/hooks/useScenarios.ts
src/features/review/useReviewCount.ts
src/features/ai-tutor/components/ExplainTab.tsx
src/features/skills/useSkillsSummary.ts
src/features/skills/pages/SkillsPage.tsx
src/features/review/pages/ReviewPage.tsx
src/features/admin/pages/AdminAiUsagePage.tsx
src/features/conversations/pages/MissionRunnerPage.tsx
src/components/AppInitializer.tsx
src/pages/Settings.tsx
```

This is the highest-leverage refactor in the codebase. Three concrete consequences I can point at from recent work:

- The **PR #122 fix** for `503 + ai_disabled` only landed in `aiTutor.ts::authedFetch`. Every inline call site is still vulnerable to the same class of bug — a 503 with `{code: "ai_disabled"}` from a hypothetical future endpoint will throw a generic error.
- The **API_BASE duplication** in §1.2 is a direct consequence — there's no shared helper to host the constant.
- **`PR #121` reviewer comment** about hardcoded API_BASE in the e2e spec was the same shape of bug.

**Recommendation.** Extract a single `src/lib/api/authedFetch.ts` that:
- Reads the bearer token from supabase
- Returns `null` for unauthed callers (matches existing convention)
- Special-cases `503 + {code: "ai_disabled"}` (matches PR #122)
- Has a typed `<T>` return

Migrate the 10 inline call sites incrementally. The two existing class-based clients (`aiTutor.ts`, `progress.ts`) should delegate to it; `auth.ts` is sufficiently different (per-call tokens, no supabase coupling) to leave alone.

**Effort: M** (1 PR for the helper + tests; another 1–2 PRs for the migration, can be done piecemeal).

### 1.2 `API_BASE` literal in 6 files <a id="12"></a>

Each of these files has its own copy of:

```ts
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api/v1";
```

```
src/features/review/useReviewCount.ts:4
src/features/admin/pages/AdminAiUsagePage.tsx:8
src/features/lessons/pages/LessonsIndex.tsx:12
src/features/skills/useSkillsSummary.ts:5
src/lib/api/progress.ts:3
src/lib/api/auth.ts:2  (named API_BASE_URL)
```

Plus `src/features/conversations/pages/MissionRunnerPage.tsx` and `src/features/conversations/hooks/useScenarios.ts` define their own variants of the same constant.

**Recommendation.** A single `src/lib/api/config.ts` exporting `API_BASE`. Replace the literals as part of the §1.1 migration.

**Effort: S.**

### 1.3 Identical Tailwind class strings repeated up to 9× <a id="13"></a>

```
9× className="text-primary-600 dark:text-..."
9× className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:..."
8× className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:..."
```

Most of these are call-to-action buttons, table-header labels, and section titles that don't currently use shared components.

**Recommendation.** Extract two or three component primitives — `<PrimaryButton>`, `<TableHeading>`, `<SectionTitle>` — and migrate. Don't try to extract everything; the long tail of one-off classes is fine inline.

**Effort: S–M.** Low risk, satisfying.

### 1.4 Three concurrent in-memory store patterns in backend <a id="14"></a>

`backend/app/core/` has three module-level dicts/lists that act as fallbacks when the corresponding Supabase table is missing:

| Module | Pattern |
|---|---|
| `in_memory_skills` | `_store: Dict[str, Dict[str, dict]]` |
| `pending_reviews` | `_pending: Dict[str, List[dict]]` |
| `ai_usage_log` | `_log: List[Dict[str, Any]]` |

PR #126 added an autouse cleanup fixture for these in `backend/tests/conftest.py`. The fixture works, but the underlying *production* concern is that all three are process-lifetime caches that don't survive backend restart and aren't shared across worker processes. They are deliberately minimal stubs intended to disappear once their backing tables are migrated.

**Recommendation.** Track each one with a TODO that links to the migration that will replace it. Or, if the team has decided these are permanent, replace `Dict[str, Any]` with proper Pydantic models (currently 5 instances of `Dict[str, Any]` in `ai_usage_log.py` alone).

**Effort: S** (TODOs) or **M** (typed conversion + migrations).

---

## 2. Files that have outgrown themselves

### 2.1 `src/features/conversations/pages/MissionRunnerPage.tsx` (845 lines) <a id="21"></a>

This single file contains:

- The page component (`MissionRunnerPage`)
- A `useScenario` hook
- 6 sub-components: `ChatBubble`, `VocabPanel`, `VocabChipBadge`, `ScoreBar`, `MissionResultsCard`, `MissionEndedCard`, `EndMissionModal`
- A `getStubReply` text generator with hardcoded English strings
- 11 `useState` calls in the main component
- 3 inline `fetch` calls

**Concrete pain points.**

- The 11 `useState` calls suggest the state machine deserves to be a `useReducer` (or a Zustand slice).
- The hardcoded `getStubReply` text is dead code once the AI conversation backend is wired up — it shouldn't ship to production.
- 6 sub-components are each candidates for moves to `src/features/conversations/components/`.

**Recommendation.** Extract the sub-components and `useScenario` hook into sibling files; consider a `useMissionRunner` reducer for the state.

**Effort: M.**

### 2.2 `backend/app/api/v1/conversations.py` (682 lines) <a id="22"></a>

Contains rate limiting (`_check_rate_limit`), three route handlers (`list_scenarios`, `conversation_turn`, `end_conversation`), Pydantic models for end-session payloads, scoring math (`_calculate_scores`), and a feedback generator (`_generate_feedback`), plus a stub-reply text generator (`_generate_stub_reply`).

**Recommendation.** Move scoring + feedback into `backend/app/services/conversation_service.py`; keep the router file thin. Mirror the existing `ai_tutor_service.py` pattern.

**Effort: M.**

### 2.3 Other large-file flags <a id="23"></a>

| File | Lines | Notes |
|---|---|---|
| `src/features/assessment/pages/AssessmentRunnerPage.tsx` | 492 | 6 inline `Section` components (`ListeningSection`, `ReadingSection`, …). All hardcoded mock data. Extract section components into siblings; replace hardcoded passages with API-driven content once the assessment backend is built. |
| `src/features/ai-tutor/components/WritingCoachTab.tsx` | 390 | Manageable but a candidate for a `useWritingCoach` hook. |
| `backend/app/api/v1/ai_tutor.py` | 345 | The mock writing-coach (`_mock_writing_coach`) is 80 lines of pattern matching that belongs in a sibling module. |

**Effort: S–M each.** None of these are urgent.

---

## 3. Type discipline + dead code

### 3.1 Stub data hardcoded in production components <a id="31"></a>

```
src/features/teacher/pages/TeacherStudentDetailPage.tsx:27   "Napat Suwannakorn"
src/features/teacher/pages/TeacherStudentsPage.tsx           hardcoded student list
src/features/conversations/pages/MissionRunnerPage.tsx       getStubReply()
src/features/teacher/pages/TeacherClassesPage.tsx            mock classes
src/features/conversations/pages/ConversationDetailPage.tsx  no fetches
src/features/conversations/pages/ConversationHistoryPage.tsx no fetches
src/features/assessment/pages/AssessmentResultsPage.tsx      hardcoded scores
```

**Recommendation.** Each ships to production today and renders fake data. Either:
- Tag with a `// STUB` comment + a feature flag that hides them in production builds, OR
- Wire them to real endpoints, OR
- Move them out of the user-reachable route tree until they're real.

The current state — fake names rendering for any logged-in user who navigates to `/teacher/students` — is worse than a 404.

**Effort: S** to gate them, **L** to wire all of them up.

### 3.2 i18n compliance gaps <a id="32"></a>

**Hardcoded English strings outside of locale files** — confirmed in:

- `src/features/teacher/pages/TeacherClassDetailPage.tsx` (tab labels: `"Roster"`, `"Assignments"`)
- `src/features/teacher/pages/TeacherStudentDetailPage.tsx` (tab labels and skill labels)
- `src/features/org-admin/pages/OrgBillingPage.tsx` (plan feature bullets)

**Locale parity gaps:**

```
th     missing 7 keys: lessons.exercises.{check,correct,incorrect,tryAgain,fillInTheBlank,apostropheReminder} + common.stub.mission_coming_soon
zh-CN  missing 7 keys: same as th
vi     missing 1 key:  common.stub.mission_coming_soon
```

The English fallback masks these at runtime, so they aren't visible bugs — but they are real translation gaps for non-English users.

**Recommendation.** A `src/test/__tests__/i18n-parity.test.ts` already exists; it should fail on these instead of warning. Then add the missing keys.

**Effort: S.**

### 3.3 Unused frontend dependency <a id="33"></a>

`i18next-http-backend` is in `package.json` but has zero imports in `src/`. It was probably wired up early and abandoned when the locale loading switched to bundled JSON files.

**Recommendation.** Remove from `package.json` and `package-lock.json`.

**Effort: S** (one PR, single line).

### 3.4 Dead service methods <a id="34"></a>

`backend/app/services/auth_service.py::login_user` is referenced nowhere in the codebase:

```
$ grep -rn "login_user(" backend/ --include="*.py"
backend/app/services/auth_service.py:77:    async def login_user(self, login_data: UserLogin) -> dict:
```

`CLAUDE.md` calls it "future internal use (org membership checks, invite-only flows, admin tooling)." If the use case is real, leave it; if speculative, delete it (`git revert` is cheap if needed later).

**Effort: S.**

### 3.5 ESLint disables <a id="35"></a>

Four `eslint-disable` directives in `src/`. Worth auditing whether each is still necessary:

```
src/features/flashcards/api/flashcards.ts:47           @typescript-eslint/no-explicit-any
src/features/flashcards/hooks/useCardProgress.ts:33    react-hooks/exhaustive-deps
src/components/LanguageSwitcher.tsx:44                 react-hooks/exhaustive-deps
src/pages/AuthCallback.tsx:102                         react-hooks/exhaustive-deps
```

The three exhaustive-deps suppressions are smell-equivalent to "this hook has a stale-closure bug we hid." Worth a one-pass review.

**Effort: S.**

### 3.6 Type discipline overall <a id="36"></a>

- **Frontend.** 0 `@ts-ignore`, 0 `@ts-expect-error`, 0 explicit `: any`, 1 `as any` cast (the eslint-disable above). This is genuinely good — better than most TypeScript codebases at this size.
- **Backend.** 5 instances of `Dict[str, Any]` in `ai_usage_log.py` for usage-log entries. Reasonable for a stub but worth typing if the module survives.

**No action recommended right now** — flagging for completeness.

### 3.7 47 `TODO`/`FIXME`/`HACK`/`XXX` comments <a id="37"></a>

47 occurrences across `src/` and `backend/app/`. None are obviously load-bearing, but no one is tracking them. A 30-minute pass to triage (delete obsolete, file as issues, leave the genuinely-pending ones) would close the loop.

**Effort: S.**

---

## 4. Test coverage gaps

### 4.1 Frontend feature folders without tests <a id="41"></a>

```
src/features/admin/         no __tests__/
src/features/assessment/    no __tests__/
src/features/conversations/ no __tests__/
src/features/org-admin/     no __tests__/
src/features/teacher/       no __tests__/
```

Combined LOC for these untested folders is **~3,500 lines**, including:

- `MissionRunnerPage.tsx` (845)
- `AssessmentRunnerPage.tsx` (492)
- `AdminAiUsagePage.tsx` (298)
- `OrgOverviewPage.tsx` (285)

Test count by feature (those that *do* have tests):

```
20  lessons       (rich coverage)
 9  flashcards    (good)
 5  auth          (basic)
 2  review
 2  ai-tutor
 1  skills
 1  dashboard
```

The walkthrough Playwright spec exercises some of these surfaces end-to-end, but unit-level coverage of state machines (mission runner, assessment runner) is absent.

**Recommendation.** Prioritize: `MissionRunnerPage` state-machine tests > `AssessmentRunnerPage` section navigation > teacher/org-admin gating tests. Skip the stub pages until they're wired to real data.

**Effort: M–L.**

### 4.2 Backend API routers without endpoint tests <a id="42"></a>

```
✓  ai_tutor.py        test_ai_tutor_api.py
✓  progress.py        test_progress_api.py
✗  admin.py
✗  auth.py
✗  conversations.py   (682 LOC, fully untested at the API layer)
✗  lessons.py         (337 LOC)
✗  review.py          (320 LOC)
✗  skills.py          (31 LOC, low-risk)
```

`conversations.py` is the biggest miss — rate limiting, scoring math, feedback generation are all untested.

**Recommendation.** At minimum add `test_conversations_api.py` covering the three route handlers and `_check_rate_limit`. Mirror the `test_ai_tutor_api.py` fixture pattern.

**Effort: M.**

### 4.3 Backend service without tests <a id="43"></a>

`auth_service.py` has no `test_auth_service.py`. Fewer business-logic branches than the others, but `login_user` (currently dead) and `register_user` both deserve at least happy-path coverage.

**Effort: S.**

---

## 5. React-specific concerns

### 5.1 React 19 / StrictMode-induced double-effects <a id="51"></a>

The walkthrough diagnostic in PR #125 surfaced duplicate fetches in dev mode:

- `/me/review/due` × 2
- `/profiles` × 3
- `/me/review/count` × 2

These collapse to single fires in production builds (StrictMode is dev-only), so they aren't a user-visible bug. But:

- They make backend logs noisy in dev
- They mask real duplicate-fire bugs that *would* survive prod
- They double the rate-limit budget consumed during development

**Recommendation.** Each `useEffect` with a fetch should be idempotent under double-mount. The `cancelled` boolean pattern (used correctly in `useScenarios.ts` and `LessonsIndex.tsx`) is the standard fix; auditing the 19 `useEffect` call sites for fetch-without-cancellation would find the gaps.

**Effort: S–M.**

### 5.2 ErrorBoundary scope <a id="52"></a>

`src/components/ErrorBoundary.tsx` exists but is not wired into `src/App.tsx`. Any thrown error in a lazy-loaded route currently bubbles to a blank page.

**Recommendation.** Wrap each layout block (PublicLayout, AuthLayout, FlashcardsLayout) with the boundary, or wrap individual `<Route>` elements that are most likely to throw (the assessment runner, mission runner).

**Effort: S.**

---

## 6. Build / bundle health

### 6.1 Bundle vendor split — closed <a id="61"></a>

PR #127 split the main JS chunk from 746 kB → 150 kB by adding `manualChunks` to `vite.config.ts`. The `chunks > 500 kB` warning is gone. **No further action.**

### 6.2 Tree-shaking audit candidate <a id="62"></a>

51 components import from `lucide-react`. The library has hundreds of icons; tree-shaking *should* drop unused ones, but it's worth verifying with `npx vite-bundle-visualizer` (the npm script `bundle-report` is already wired up in `package.json`). If bloat exists, switch to per-icon imports (`import { ArrowRight } from 'lucide-react/dist/esm/icons/arrow-right'`).

**Effort: S** to audit, **S** to fix if needed.

---

## What I'd actually do

If you only ever touch this list, in order of ROI:

1. **§1.1** — extract a single `authedFetch` helper, migrate the 10 inline call sites incrementally. Touches the most files, fixes the most latent bugs, makes future endpoint additions ~1/3 the boilerplate.
2. **§1.2** — fold `API_BASE` constant into the same migration. Free piggyback.
3. **§3.1** — gate the stub teacher / org-admin / conversation pages behind a feature flag so production users don't see "Napat Suwannakorn" rendered as a real student. Ship-blocker if anyone non-internal sees the build.
4. **§4.2** — add `test_conversations_api.py`. The 682-line file is shipping with zero API-level tests; rate-limiting and scoring math are untouched.
5. **§3.3** — drop unused `i18next-http-backend` dep.

The rest is opportunistic — refactor when you're already touching the file. Don't do them as a sweep.

---

## What I deliberately did not flag

- **Deeper architecture** (state management library, server-state library, design system). Those decisions are too big for an audit and depend on team taste.
- **Performance under load.** No backend benchmarks were run; SQL query patterns and N+1 risks weren't checked.
- **Security review.** Auth, RLS, CORS, secret rotation were out of scope.
- **Accessibility audit beyond what existing tests cover.** Some pages probably have a11y issues; would need a real a11y pass with axe-core or similar.

Each of those would be a separate report.
