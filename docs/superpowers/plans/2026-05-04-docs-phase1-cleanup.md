# Phase 1 docs cleanup implementation plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Bring `README.md` Tech Stack and `CLAUDE.md` Backend Structure + Database Schema in sync with what Phase 1 (PR #107) shipped.

**Architecture:** Pure documentation update across two files in three localized edits. Single commit. No code, tests, or migrations.

**Tech Stack:** Markdown only.

**Spec:** `docs/superpowers/specs/2026-05-04-docs-phase1-cleanup-design.md`.

---

## File map

| File | Edit |
|---|---|
| `README.md` (line 20) | Single-line update: `**Backend:**` bullet now names FastAPI |
| `CLAUDE.md` (Backend Structure section, ~lines 86-99) | Replace tree block + add a parallel Note paragraph |
| `CLAUDE.md` (Database Schema section, ~lines 101-105) | Update `profiles` line and append 4 Phase 1 table bullets |

No other files. No code. No tests.

---

## Task 1: Apply all three documentation edits and commit

**Files:**
- Modify: `README.md`
- Modify: `CLAUDE.md`

- [ ] **Step 1.1: Update `README.md` Tech Stack Backend bullet**

Open `README.md`. Find line 20:

```
- **Backend:** Supabase (Auth + Database)
```

Replace with:

```
- **Backend:** FastAPI + Supabase (PostgreSQL + Auth)
```

That is the only change to `README.md` in this PR.

- [ ] **Step 1.2: Replace `CLAUDE.md` Backend Structure tree block**

Open `CLAUDE.md`. Find the existing Backend Structure tree (lines 86-97 approximately, starting with the `### Backend Structure` heading and the code-fenced block immediately below it). The current block is:

```
backend/app/
├── api/v1/auth.py       # Auth endpoints: /register, /check-username, /logout (injected via Depends)
├── core/
│   ├── config.py        # Pydantic BaseSettings (reads .env)
│   ├── security.py      # JWT helpers, password hashing
│   └── supabase.py      # Supabase client (uses service role key)
├── models/auth.py       # Pydantic request/response models
└── services/auth_service.py  # Business logic: create user, verify credentials; AuthService injected via FastAPI Depends()
```

Replace the entire code-fenced block with:

```
backend/app/
├── api/v1/
│   ├── auth.py        # Auth endpoints: /register, /check-username, /logout, /profile (PATCH)
│   └── progress.py    # Progress endpoints under /me/progress/: complete-section, attempt-exercise, review-flashcard, summary (auth via get_current_user)
├── core/
│   ├── config.py      # Pydantic BaseSettings (reads backend/.env)
│   ├── security.py    # JWT helpers, password hashing, get_current_user dependency
│   └── supabase.py    # Supabase admin client (uses SUPABASE_SECRET_KEY)
├── models/
│   ├── auth.py        # Pydantic auth models (UpdateProfile validates timezone)
│   └── progress.py    # Pydantic progress models (SectionKey Literal, regex-validated unit_slug + exercise_id)
└── services/
    ├── auth_service.py     # Business logic: create user, verify credentials
    └── progress_service.py # Domain functions: complete_lesson_section, submit_exercise_attempt, review_flashcard, get_summary

backend/tests/         # pytest infrastructure; tests are mock-based — real DB verification happens in manual walkthroughs
```

The fence (` ``` `) markers stay in place; only the content between them changes.

- [ ] **Step 1.3: Add a parallel Note paragraph after the existing `/auth/login` Note**

Immediately below the Backend Structure tree, the current `CLAUDE.md` has a single Note paragraph:

```
Note: there is no `/auth/login` HTTP endpoint. `login_user()` exists on `AuthService` for future internal use (org membership checks, invite-only flows, admin tooling) but is not exposed as a route.
```

Insert a second Note paragraph immediately after that one (with a blank line between them). Add this exact text:

```
Note: All progress writes go through transactional Postgres functions (`complete_lesson_section_tx`, `submit_exercise_attempt_tx`, `review_flashcard_tx`) that do projection-table inserts and event-log inserts atomically. The functions are REVOKEd from PUBLIC/anon/authenticated and GRANTed only to `service_role`. Frontend never writes the new tables directly — all writes go through `services/progress_service.py`.
```

- [ ] **Step 1.4: Update `CLAUDE.md` Database Schema bullet list**

Find the Database Schema bullet list (around lines 103-105 of the original file, after the `### Database Schema (Supabase)` heading). The current bullets are:

```
- `profiles` — id (FK auth.users), first_name, last_name, email, username (unique)
- `user_stats` — user_id (FK auth.users), xp, level, study_streak, last_login
- `flashcards` — in progress
```

Replace with:

```
- `profiles` — id (FK auth.users), first_name, last_name, email, username (unique), native_language, timezone
- `user_stats` — user_id (FK auth.users), xp, level, study_streak, last_login
- `flashcards` — in progress
- `user_activity_log` — single-source-of-truth event stream (lesson_section_completed, exercise_attempted, flashcard_reviewed)
- `lesson_section_progress` — projection: which sections each user has completed (idempotent on user/unit/section)
- `exercise_attempts` — projection: every exercise attempt (correct OR incorrect)
- `flashcard_reviews` — projection: flashcard known/unknown reviews
```

The `profiles` line gains `native_language, timezone`. The `user_stats` and `flashcards` lines stay verbatim. Four new bullets are appended.

- [ ] **Step 1.5: Spot-check the diffs**

```bash
git diff README.md CLAUDE.md | head -120
```

Verify visually:

- `README.md` shows exactly one `-` and one `+` line for the Backend bullet swap.
- `CLAUDE.md` shows the tree block replaced (multi-line `-` followed by multi-line `+`), the new Note paragraph added, and the four new bullets appended to the schema list.
- No other lines anywhere should be modified.

- [ ] **Step 1.6: Verify content is reachable via grep**

```bash
grep -c "FastAPI" README.md
grep -c "progress_service" CLAUDE.md
grep -c "user_activity_log" CLAUDE.md
grep -c "complete_lesson_section_tx" CLAUDE.md
```

Expected: each command returns at least `1`. (`README.md` should newly have `FastAPI` somewhere; the three CLAUDE.md grep targets each have at least one new mention.)

- [ ] **Step 1.7: Commit**

```bash
git add README.md CLAUDE.md
git commit -m "docs: bring README + CLAUDE.md in sync with Phase 1"
```

---

## Task 2: Verify, push, open PR

This task ships the work. No code gates to run beyond the doc-content sanity checks already done in Task 1.

- [ ] **Step 2.1: Confirm the branch state**

```bash
git status --short
git log --oneline -3
```

Expected: working tree clean (the spec was already committed at `7d88386`, the docs cleanup commit from Task 1 is on top of that), HEAD shows the docs-cleanup commit.

- [ ] **Step 2.2: Push the branch**

```bash
git push -u origin chore/docs-phase1-cleanup
```

- [ ] **Step 2.3: Open the PR**

```bash
gh pr create --title "docs: bring README + CLAUDE.md in sync with Phase 1" --body "$(cat <<'EOF'
## Summary

Two reference docs got stale during Phase 1 (PR #107) and were never updated. This PR is pure documentation:

- **`README.md` Tech Stack** Backend bullet now names FastAPI alongside Supabase. The FastAPI backend has been load-bearing since the service-role key was moved server-side; the README was misleading new contributors who'd otherwise expect a Supabase-only stack.
- **`CLAUDE.md` Backend Structure** tree gains the four progress files (`api/v1/progress.py`, `models/progress.py`, `services/progress_service.py`) plus the `tests/` directory. A parallel Note paragraph documents the transactional `*_tx` Postgres function pattern + service_role-only grants used for progress writes.
- **`CLAUDE.md` Database Schema** bullet list adds the 4 Phase 1 tables (`user_activity_log` + 3 projection tables) and both new `profiles` columns (`native_language` from the translations work, `timezone` from Phase 1).

Spec: \`docs/superpowers/specs/2026-05-04-docs-phase1-cleanup-design.md\`
Plan: \`docs/superpowers/plans/2026-05-04-docs-phase1-cleanup.md\`

## Out of scope (intentionally)

- README's Features-section staleness (the XP bullet is from the pre-Phase-1 mock dashboard; the language list claims English-and-Thai-only). That's marketing copy; deserves its own pass.
- \`user_stats\` table deprecation audit — fields look like remnants of the old XP system but verifying that requires code grep + DB inspection.
- The \`flashcards — in progress\` schema line. Adjacent staleness; doesn't block what we're fixing.
- The \`flashcard_sets.slug\` column from PR #110.

These are all real cleanup candidates for follow-up PRs.

## Test plan

- [x] \`git diff main...HEAD\` shows only the two docs files modified
- [x] \`grep -c FastAPI README.md\` returns >= 1
- [x] \`grep -c progress_service CLAUDE.md\` returns >= 1
- [x] \`grep -c user_activity_log CLAUDE.md\` returns >= 1
- [x] No code, test, or migration files modified
EOF
)"
```

Expected: PR opened against `main`. CI is doc-only-touched, so Frontend/Vercel/semgrep checks should all be no-ops or pass-through.

---

## Self-review notes

**Spec coverage:**
- Goal #1 (README names FastAPI) → Step 1.1.
- Goal #2 (CLAUDE.md Backend Structure shows Phase 1 files + transactional-pattern note) → Steps 1.2 + 1.3.
- Goal #3 (CLAUDE.md Database Schema covers Phase 1 tables + profiles columns) → Step 1.4.
- Goal #4 (no code changes) → file map says docs-only; Task 2 verifies.

**Placeholder scan:** No "TBD"/"TODO"/incomplete sections. Every step has concrete text to insert and concrete commands to run.

**Type/identifier consistency:** No types or signatures involved (docs only). The string literals (`progress_service`, `user_activity_log`, `complete_lesson_section_tx`) match what's in the codebase post-Phase-1 and what the spec defined.

**Commit cadence:** 1 implementation commit + the spec commit already on the branch (`7d88386`). Task 2 has no commits — just push + PR.
