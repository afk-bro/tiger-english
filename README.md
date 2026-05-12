# Gain English

A full-stack English learning platform for adult learners (CEFR A0 → C1). Frontend is a React 19 SPA on Vercel; backend is a FastAPI service on Railway; data + auth via Supabase.

Live at **https://tiger-english.com**.

## Features

- **Lessons** — short, deterministic, completable units. Heading / text / examples / vocab / dialogue / exercise (MCQ, fill-blank, match-word-to-image) blocks.
- **Practice** — `/practice` hub for AI-driven applied modes (AI Conversation, Guided Writing).
- **Review** — SM-2 spaced repetition for vocabulary and missed exercises.
- **AI Tutor** *(behind `VITE_AI_TUTOR_ENABLED`)* — speech-driven roleplay practice with Vietnamese support. Browser MediaRecorder → Groq Whisper STT → rule-based task evaluator → pre-generated ElevenLabs TTS playback (with browser SpeechSynthesis fallback). One scenario seeded ("Meeting someone new"); more in Spec 2+.
- **Skills** — 11-skill EWMA scoring derived from exercise + conversation activity.
- **Flashcards** — 17 curated sets plus user-created sets, with native-language translations.
- **Multi-locale UI** — `en`, `vi`, `th`, `zh-CN` via `react-i18next` (browser language detection, English fallback).
- **Auth** — Supabase email/password + Google OAuth.
- **Dark mode**, **mobile-first** layouts, **responsive** sidebar.

## Tech stack

- **Frontend** — React 19, TypeScript, Vite, Tailwind CSS, Headless UI, Zustand, React Router 7, React Hook Form + Zod, Vitest + Testing Library
- **Backend** — FastAPI, Pydantic v2, uvicorn, supabase-py, anthropic SDK, pytest
- **Database / Auth / Storage** — Supabase (Postgres + Auth + Storage)
- **AI** — Anthropic Claude (Sonnet for tutoring + conversation, Haiku for evaluation), Groq Whisper (STT for the AI Tutor), ElevenLabs (author-time TTS for the AI Tutor's fixed lines)
- **Hosting** — Vercel (frontend), Railway (backend)
- **Image generation** (author-time) — Leonardo AI

## Project structure (key directories)

Not exhaustive — there are also `src/{__tests__, assets, data, docs, mocks, pages, schemas, test, types, utils}/` plus `src/App.tsx` and `src/main.tsx` at the root.

```
src/
├── components/         # Cross-feature UI (sidebar, exercises, header/footer, …)
├── features/
│   ├── admin/          # Org admin pages (billing, overview)
│   ├── ai-tutor/       # AI Tutor: speech feature (audio, hooks, state, components) + legacy Explain/Correct/Practice/Writing Coach surface
│   ├── assessment/     # CEFR-level placement assessment + results
│   ├── auth/           # Login / Register / RequireAuth / RequireGuest
│   ├── conversations/  # AI roleplay scenarios + mission runner
│   ├── dashboard/      # Progress summary, stats, streak
│   ├── flashcards/     # Curated + user-created flashcard sets
│   ├── lessons/        # Units, sections, blocks, registry, image hydration
│   ├── org-admin/      # Cross-org admin views (e.g. AI usage)
│   ├── practice/       # /practice hub (Conversation + Writing cards)
│   ├── review/         # SM-2 review queue UI
│   ├── skills/         # 11-skill summary + per-skill drill-in
│   └── teacher/        # Teacher dashboard (classes, students)
├── lib/
│   ├── api/            # Backend HTTP clients (auth, progress, ai-tutor, …)
│   ├── storageImage.ts # Supabase Storage URL → render-image transform helper
│   └── supabase.ts
├── locales/            # en / vi / th / zh-CN JSON
└── stores/             # Zustand (useUserStore)

backend/
├── app/
│   ├── api/v1/         # FastAPI routers (auth, progress, ai_tutor, conversations, review, skills, lessons, admin)
│   ├── core/           # config, security, supabase admin client
│   ├── models/         # Pydantic models
│   └── services/       # ai_tutor_service, progress_service, sm2_service, skill_scoring_service, …
├── tests/
├── railway.toml        # Railway deploy config
└── requirements.txt

scripts/
├── generate-lesson-images.ts   # Leonardo → Supabase Storage author-time pipeline
└── lib/                        # vendor-chunks, image-config, validators

supabase/migrations/   # Schema migrations (applied via Supabase Management API or dashboard)
```

## Local development

### Prerequisites
- Node.js 18+ and npm
- Python 3.12+ and `venv`
- Supabase project (free tier works)

### 1. Clone + install

```bash
git clone https://github.com/afk-bro/tiger-english.git
cd tiger-english
npm install
```

### 2. Frontend env (`.env`)

```env
VITE_SUPABASE_URL=https://<your-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-key>
VITE_API_BASE_URL=http://localhost:8000/api/v1
# Leave VITE_AI_CONVERSATION_ENABLED unset to render the Practice card as "Coming soon"
```

### 3. Backend env (`backend/.env`)

```env
SUPABASE_URL=https://<your-ref>.supabase.co
SUPABASE_SECRET_KEY=sb_secret_…   # Project Settings → API → "Service role" (NEW format)
SECRET_KEY=<long-random>           # python -c "import secrets; print(secrets.token_urlsafe(64))"
ALLOWED_ORIGINS=["http://localhost:5173"]
ENVIRONMENT=development

# Optional — required only for AI features
ANTHROPIC_API_KEY=sk-ant-…
LEONARDO_API_KEY=<leonardo-key>    # only used by scripts/generate-lesson-images.ts
```

### 4. Run

In two terminals:

```bash
# Frontend (localhost:5173)
npm run dev

# Backend (localhost:8000, FastAPI docs at /docs)
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python run.py
```

### Common commands

```bash
# Frontend
npm run dev          # Vite dev server
npm run build        # type-check + production build
npm run lint         # ESLint
npm run type-check   # tsc --noEmit
npm test             # Vitest
npm run test:watch
npm run format       # Prettier

# Backend (from backend/ with venv active)
python run.py
python -m pytest tests/

# Author-time image generation
npm run lesson-images -- --unit unit-2 --dry-run
npm run lesson-images -- --unit unit-2
```

## Production

- **Frontend → Vercel.** Auto-deploys from `main`. Env vars set in **Settings → Environment Variables** (NOT `.env` files in the repo); Vite bakes `VITE_*` vars at build time, so changing one needs a redeploy with cache disabled.
- **Backend → Railway.** Service Root Directory is `backend`; build via Nixpacks. `backend/railway.toml` defines the start command, healthcheck (`/health`), and restart policy. Env vars set in Railway's **Variables** tab.

The frontend reaches the backend via `VITE_API_BASE_URL` baked at build time. To enable AI features in production, set `ANTHROPIC_API_KEY` on Railway and `VITE_AI_CONVERSATION_ENABLED=true` on Vercel, then redeploy the frontend.

## Architecture notes

For implementation details that matter when working in this repo (auth flow, routing layouts, the lesson-image pipeline, the three-mode product structure, etc.) see [`CLAUDE.md`](./CLAUDE.md).

## Contributing

- Always work on a feature branch — never commit to `main` directly. Naming: `feat/<name>`, `fix/<name>`, `refactor/<name>`, `chore/<name>`, `perf/<name>`, `docs/<name>`.
- Conventional-commit style messages.
- Run `npm test`, `npm run type-check`, and `npm run lint` before opening a PR. The backend has its own `pytest` suite.

## License

MIT.
