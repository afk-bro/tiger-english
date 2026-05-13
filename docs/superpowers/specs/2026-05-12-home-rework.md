# `/home` rework — AI-tutor-first

**Status:** Spec — ready for plan
**Date:** 2026-05-12
**Owner:** afk-bro

## Background

The signed-in landing page `/home` (`src/pages/AuthHome.tsx`) is a 2×2 grid of
`ContinueStudying` / `RecommendedNext` / `InviteFriends` / `StudyGroups` cards
with zero AI Tutor surface area. Three of the four cards are mock-data
driven; the `ContinueStudyingCard` empty-state CTA routes to `/flashcards`,
not lessons or tutor.

At this point in the product, AI Tutor is the headline feature. The page
should be reshaped around the tutor jobs.

## Goals

- **J1 (start a session): 3 clicks → 1 click.**
- **J2 (resume session): 3+ clicks → 1 click (when applicable).**
- **J3 (review): stays 1 click; surface count on `/home` so users don't need the sidebar to see it.**
- **J4 (continue lesson): 1 click, deep-linked to the actual `:unitSlug/:sectionKey`.**

## Non-goals

- Sidebar reorder (separate spec — flagged as follow-up).
- "Quick Help" naming collision with "AI Tutor" (separate spec).
- Dashboard rework (this spec narrows the `/home` ↔ `/dashboard` gap; explicit consolidation is a follow-up — see Q3 below).
- Backfilling telemetry on the old `/home` (instrument the new one only).

## Layout

```
┌──────────────────────────────────────────┐
│  TutorHeroCard                full-width │  ← J1 + J2
├──────────────────────────────────────────┤
│  ScenarioShortcutsRow         full-width │  ← J5 (browse)
├──────────────────┬───────────────────────┤
│  TodayReviewCard │  ContinueLessonCard   │  ← J3, J4
└──────────────────┴───────────────────────┘
```

Mobile: stack everything full-width.

Drop: `InviteFriendsCard`, `StudyGroupsCard` (mock-only today; future move target is `/dashboard`).

---

## Components

### 1. `TutorHeroCard`

Lives at: `src/components/home/authenticated/TutorHeroCard.tsx`

**Three states:**

| State | Visual | Primary CTA → route |
|---|---|---|
| `active-session` | "Pick up where you left off — <scenario title>. Last spoke <relative time>." + small mistake/task progress | `Continue` → `/ai-tutor/scenarios/:slug/session/:sessionId` |
| `no-active-featured` | "Start speaking practice — <featured scenario title>" | `Start` → `/ai-tutor/scenarios/:slug/briefing` |
| `no-active-cold` (new user, scenarios still loading or empty) | "Try your first conversation" | `Open AI Tutor` → `/ai-tutor` |

**Data required:**

| Field | Source | Status |
|---|---|---|
| `activeSession` (latest active session: `{session_id, scenario_slug, scenario_title, last_activity_at, completed_task_count, total_task_count}`) | NEW: `GET /me/ai-tutor/sessions/active` | **gap — needs new endpoint** |
| `featuredScenario` (first non-completed scenario) | existing `tutorAPI.listScenarios()`, take `[0]` (matches current `AiTutorHomePage` convention) | exists |

**Backend gap (first task in plan):**
- `GET /me/ai-tutor/sessions/active` returns at most one active session row (the partial unique already enforces at most one per scenario per user; we want the most-recently-active across scenarios). Reuses `tutor_scenario_service` and a small read against `ai_tutor_sessions` joined to `ai_tutor_scenarios`.
- Returns `null` (200) when no active session — not 404.
- RLS already in place on `ai_tutor_sessions`; the service-role server-side filter on `auth.uid()` is the authoritative gate.

**Empty/loading:**
- Skeleton: full-width pulsing block, ~h-44.
- Error fetching active-session: silently fall through to `no-active-featured`. Telemetry event `home.tutor_hero.active_session_fetch_failed`.

**A11y:** the CTA is a `<button>` calling `navigate(...)`, not an `<a>` with router state — keeps focus management consistent with the existing `ContinueStudyingCard`.

---

### 2. `ScenarioShortcutsRow`

Lives at: `src/components/home/authenticated/ScenarioShortcutsRow.tsx`

**Visual:** horizontal scroll row of 4–6 tiles + "Browse all →" link → `/ai-tutor`.

**Tile component:** reuse the existing `src/features/ai-tutor/components/ScenarioCard.tsx` **as-is** (see Q1).

**Data:** `tutorAPI.listScenarios()` — existing call. Sort: course-mode first (matches current `AiTutorHomePage`), then alphabetical by `title_en`. (Last-attempted-first is a follow-up once the active-session endpoint exposes it.)

**Empty:** if `listScenarios` returns `[]` or errors, render nothing (the hero card carries the new-user CTA).

---

### 3. `TodayReviewCard`

Lives at: `src/components/home/authenticated/TodayReviewCard.tsx`

**States:**
- `count > 0`: `"<N> cards due"` + `Start review` button → `/review`. Count from `useReviewCount()`.
- `count === 0`: muted "All caught up — come back tomorrow." No CTA.
- `loading`: skeleton.

**Data:** `useReviewCount()` — existing hook in `src/features/review/useReviewCount.ts` (already used by sidebar; the duplicate subscriber is fine — confirm in plan that the hook dedupes the underlying fetch, otherwise add a tiny module-level cache).

---

### 4. `ContinueLessonCard`

Lives at: `src/components/home/authenticated/ContinueLessonCard.tsx`

**v1 scope:** render only the "Browse lessons" variant → `/lessons`. The full "continue specific section" state is **deferred** (see Q3 follow-up).

**Reasoning:** there's no "most recent in-progress lesson section" endpoint today. `lesson_section_progress` only records completed sections. Adding a backend `/me/progress/last-section` endpoint that consults `user_activity_log` and computes the "next" section requires moving lesson static data into the backend (it's currently FE-only) — too much scope for this rework. File as follow-up.

---

## i18n

New keys under `authhome.*`:
- `authhome.tutor_hero.active.eyebrow` / `.subtitle` (interpolates `{{tasks_done}}` + `{{tasks_total}}`) / `.cta`
- `authhome.tutor_hero.featured.eyebrow` / `.cta`
- `authhome.tutor_hero.cold.title` / `.cta`
- `authhome.scenario_shortcuts.heading` / `.browse_all`
- `authhome.today_review.empty`
- `authhome.continue_lesson.cta`

All four locales: `en`, `vi`, `th`, `zh-CN`.

The existing `authhome.continue_studying.*`, `authhome.recommended_next.*`, `authhome.invite_friends.*`, `authhome.study_groups.*` keys can be deleted once the four old cards are removed. Flag for cleanup in the plan.

---

## Telemetry

Send via existing `reportTutorEvent` (verify the backend `event_type` allowlist in `backend/app/api/v1/ai_tutor_session.py:228` before plan — if it's strict, extend it):

- `home.hero.click` with `{state: 'active'|'featured'|'cold'}`
- `home.scenario_shortcut.click` with `{scenario_slug}`
- `home.review.click` with `{due_count}`

Skip new analytics infra — reuse the tutor telemetry table since this page is now AI-tutor-shaped.

---

## Tests

- `AuthHome.test.tsx`: three render branches (active session / featured / cold) — mock `tutorAPI`. Closest template: `src/pages/__tests__/Dashboard.test.tsx`.
- `TutorHeroCard.test.tsx`: state matrix + CTA navigation assertions.
- `ScenarioShortcutsRow.test.tsx`: empty-list passthrough, scenario click navigation, "Browse all" link.
- `TodayReviewCard.test.tsx`: 0/N/loading branches.
- Backend `test_ai_tutor_session.py`: add `test_get_active_session_returns_null_when_none`, `test_get_active_session_returns_latest`, `test_get_active_session_rls_excludes_other_users`.

---

## Rollout

- Behind `VITE_AI_TUTOR_ENABLED` (we already require this flag for the tutor to exist at all — if it's off, render the legacy `/home` as-is). Branch at the top of `AuthHome.tsx`: `if (!aiTutorEnabled) return <LegacyAuthHome />`.
- Keep legacy implementation around in `AuthHomeLegacy.tsx` for one release in case of rollback, then delete.

---

## Resolved questions

### Q1: `ScenarioCard` compact variant — prop or wrapper?

**Decision: reuse as-is, no prop, no wrapper.**

The existing `ScenarioCard` is already one Link wrapping `title_vi` + `title_en` in a small bordered box (`src/features/ai-tutor/components/ScenarioCard.tsx`). Its own docstring calls it "compact." There is no denser variant to design — adding a `compact` prop would be premature abstraction.

**Caveat to verify in plan:** the card currently routes to the **phrasebook** path (`/ai-tutor/scenarios/:slug/phrasebook`), not the briefing. For `/home`'s shortcuts row, this is fine — J5 ("browse / pick a new scenario") is satisfied by landing on the scenario page, and the phrasebook → briefing → start flow remains the supported on-ramp. We are **not** changing the card's destination route.

### Q2: Data fetching strategy — React Query, or extend `useAiTutorStore`?

**Decision: neither. Stick with the existing custom-hook pattern.**

The repo has no React Query (`grep` confirms no `@tanstack/react-query` import anywhere in `src/`). `useAiTutorStore` is purely UI state (the slide-out panel's `isOpen`/`activeTab`) — not a data cache. `Dashboard.tsx` uses one hook per data dependency (`useProgressSummary`, `useReviewCount`, `useSkillsSummary`); we'll mirror that:

- `useActiveTutorSession()` — wraps the new `GET /me/ai-tutor/sessions/active` endpoint.
- `useScenariosList()` — wraps `tutorAPI.listScenarios()`. Lives at `src/features/ai-tutor/hooks/useScenariosList.ts`.

Both follow the `{ data, isLoading, error }` shape used by the dashboard hooks. The duplicate fetch with `AiTutorHomePage` (one when landing on `/home`, another if the user navigates to `/ai-tutor`) is acceptable — the scenarios list is small and cacheable at the HTTP layer. Introducing a query library is out of scope.

### Q3: `/dashboard` vs new `/home` — overlap?

**Decision: keep both; tighten the split.**

After the rework the two pages serve different intents:

- **`/home`** — "what should I do next?" (action surface; forward-looking).
- **`/dashboard`** — "how am I doing?" (stats; backward-looking — streak, progress activity, CEFR, skill scores).

The only data both pages read is `useReviewCount`, which is fine (same hook, two surfaces).

Consolidation is **not** in scope here. Once the new `/home` lands and we have one release of usage data, we can decide whether `/dashboard` should be folded into a tab on `/home`, kept as the deep stats page, or surfaced differently. File as follow-up.

---

## Known follow-ups (out of scope)

- Sidebar promotion of AI Tutor to position #2 + collapse Library/Study Groups/Ad Libs/Drag Drop into "More."
- Rename or remove the bottom-of-sidebar "Quick Help" (collision with `AI Tutor` mental model).
- Mobile bottom-nav for `AuthLayout` mirroring `TutorLayout`'s footer.
- `ContinueLessonCard` Option A: backend `/me/progress/last-section` endpoint.
- Re-evaluate `/dashboard` vs `/home` after a usage-data window.
- Delete `mocks/authHome.mock.ts` once the new cards stop importing it.
- Order `ScenarioShortcutsRow` by last-attempted (depends on active-session endpoint exposing scenario history).
