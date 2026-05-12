# AI Tutor Spec 1 — Manual QA Checklist

Walk through this checklist on real devices before promoting `VITE_AI_TUTOR_ENABLED=true` to production.

## Setup

- [ ] Backend env vars on Railway: `AI_TUTOR_ENABLED=true`, `GROQ_API_KEY` set, `STT_PROVIDER=groq`, `GROQ_STT_MODEL=whisper-large-v3`
- [ ] Frontend env var on Vercel (target environment): `VITE_AI_TUTOR_ENABLED=true`
- [ ] Migrations `20260510000001`, `20260510000002`, `20260510000003` applied to the target Supabase project
- [ ] Seed scenario `meeting-someone-new` exists with audio_paths populated (re-run `npm run tutor-audio` if missing)
- [ ] Health check returns `ai_tutor_enabled: true`: `curl https://<backend>/api/v1/health`

## Acceptance criteria (Spec §14)

Tick each on the chosen device. Note device + browser version inline.

### 1–4: Entry & home

- [ ] **1** — Public homepage CTA reads "Practice Speaking with Your AI Tutor" / "Start speaking" (was Flashcards before flag flip)
- [ ] **2** — Logging in (or already logged in) routes through `/ai-tutor` after the CTA click
- [ ] **3** — `/ai-tutor` renders the AI Tutor home: top tabs (Home active, Course → /lessons), trial CTA stub card, featured "Gặp người mới / Meeting someone new" card with Free pill, footer nav with 5 items
- [ ] **4** — Free Talk anchor (footer) scrolls to the `#free-talk` section on the home page
- [ ] **4a** — Trial CTA card click surfaces a toast ("Free trial coming soon …")
- [ ] **4b** — Review and Challenge footer items each open the "Coming soon" sheet; Escape closes it
- [ ] **4c** — Profile footer item routes to `/settings`
- [ ] **4d** — If your profile has `native_language !== 'vi'`: yellow banner appears and dismisses

### 5: Phrasebook

- [ ] **5** — Clicking "Start" on the featured card routes to `/ai-tutor/scenarios/meeting-someone-new/phrasebook`
- [ ] **5a** — 8 phrase cards render; each shows EN + VI
- [ ] **5b** — Tapping "🔊 Listen" plays the pre-generated MP3 (verify audio is consistent across reloads — not the device's TTS voice)
- [ ] **5c** — If the MP3 fails to load (simulate by blocking the bucket URL in DevTools), Listen falls back to browser SpeechSynthesis silently

### 6: Briefing

- [ ] **6** — "Next" button routes to `/ai-tutor/scenarios/meeting-someone-new/briefing`
- [ ] **6a** — Vi description is visually more prominent than En description
- [ ] **6b** — Goal section shows Vi-prominent, En-muted
- [ ] **6c** — Four tasks render in order: Giới thiệu bản thân / Hỏi … / Nói … / Hỏi …
- [ ] **6d** — On first visit (no active session): only "Start lesson" button. After starting and navigating back: "Continue where you left off" + "Start fresh" pair appears

### 7–10: Dialogue session

- [ ] **7** — "Start lesson" routes to `/ai-tutor/scenarios/.../session/<uuid>` and the AI's opening line plays automatically ("Hi! Nice to meet you. What's your name?")
- [ ] **7a** — On iOS Safari: first audio playback might require a tap; verify a tap somewhere in the tutor shell unlocks subsequent autoplay
- [ ] **8** — Task banner shows "Tasks: 0 / 4 completed" with the current task (Vi/En)
- [ ] **8a** — Tap the mic button → microphone permission prompt (first time) → recording starts
- [ ] **8b** — Recording panel shows the waveform animating
- [ ] **8c** — Saying "My name is Tom" then tapping Submit: within ~2.5s, your transcript appears as a chat bubble, task 1 turns green ✅, AI follows up
- [ ] **8d** — Hard 20s cap: while recording, wait 20s without submitting; the recording auto-submits
- [ ] **8e** — Cancel button mid-recording: discards the audio, returns to idle
- [ ] **9** — Repeat / Translate / Hide text buttons on the AI's dialogue card all work
- [ ] **10** — Saying something incorrect (e.g., "my name Tom" missing the verb): correction card appears AFTER the lesson ends (not mid-session)

### 11: End lesson

- [ ] **11a** — Say "End lesson" mid-session: modal "Finish lesson? You've completed N of 4 tasks" appears
- [ ] **11b** — Modal Dismiss returns to recording; Confirm finishes the session
- [ ] **11c** — Saying the Vietnamese variant "kết thúc bài học" also triggers the modal
- [ ] **11d** — Lesson-complete screen renders with "+N XP" pill + correction cards (if any mistakes were made)
- [ ] **11e** — Continue button navigates to `/ai-tutor`; View dashboard navigates to `/dashboard`

### 12: Persistence

- [ ] **12** — DB has: 1 session row (`status='completed'`), N turn rows, `user_stats.xp` incremented, `user_activity_log` has a `tutor_session_completed` row visible to the dashboard streak counter
- [ ] **12a** — Refreshing mid-session: dialogue page restores to the last AI prompt

## Error paths

- [ ] **E1** — Deny microphone permission: persistent banner with browser-specific instructions appears; `ai_tutor_events('mic.denied')` row in DB
- [ ] **E2** — Speak Vietnamese instead of English: toast "Hãy nói bằng tiếng Anh nhé! / Try speaking in English." surfaces; backend logs `turn.vi_spoken` and skips the turn write / task advance (verify via DB inspection).
- [ ] **E3** — Network failure during turn submit: toast "Couldn't hear that — try again." surfaces; no DB writes occur (verify via `ai_tutor_turns` count unchanged)
- [ ] **E4** — Submit silence (just background noise): same STT failure path
- [ ] **E5** — Backend off (`ai_tutor_enabled=false`): scenario list returns 503 with body `{"detail": {"error": "tutor_disabled"}}` (FastAPI wraps the dict under `detail`); UI displays a generic error toast

## Device matrix

Run the full acceptance criteria on each:

| Device / Browser | Tester | Date | Pass / Fail | Notes |
|---|---|---|---|---|
| **Chrome (desktop, latest)** | | | | |
| **Edge (desktop, latest)** | | | | |
| **Firefox (desktop, latest)** | | | | |
| **iOS Safari 16+** (iPhone) | | | | |
| **iOS Safari 17+** (iPhone) | | | | |
| **Chrome Android 100+** (mid-range Android) | | | | |

## Known v1 simplifications

These are not regressions — they were deliberately deferred from Spec 1 to keep the cycle shippable. Don't flag them as failures.

- **Resume mid-session** restores the dialogue page to a generic awaiting-speech state rather than replaying the last AI prompt automatically.

Each has a follow-up note in the implementation plan / spec.

## Sign-off

- [ ] All acceptance criteria pass on all 6 device/browser combinations
- [ ] Telemetry (`ai_tutor_events`) row counts are sane: <1 per minute per active user in steady state
- [ ] Groq usage dashboard shows expected character volume (~600 chars per session, well under free-tier monthly cap)
- [ ] No regressions in pre-existing routes (homepage, /home, /lessons, /flashcards, /dashboard, /settings)

Ship it ✅ / Hold ❌
