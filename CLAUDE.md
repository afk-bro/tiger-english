# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Gain English** is a full-stack English learning platform with:
- **Frontend:** React 19 + TypeScript + Vite SPA at `/src/`
- **Backend:** FastAPI + Python at `/backend/`
- **Database/Auth:** Supabase (PostgreSQL + Auth)

The backend was added to secure the Supabase service role key — it must never be exposed to the frontend.

## Development Commands

### Frontend
```bash
npm run dev          # Start Vite dev server (localhost:5173)
npm run build        # TypeScript check + Vite production build
npm run lint         # ESLint
npm run type-check   # TypeScript type checking only
npm test             # Run Vitest tests
npm run test:watch   # Tests in watch mode
npm run format       # Prettier format
```

### Backend
```bash
cd backend
source venv/bin/activate
python run.py        # Dev server on localhost:8000 (with --reload)
# Docs: http://localhost:8000/docs
```

### Running a single test
```bash
npm test -- path/to/test.spec.ts   # Frontend: single file
```

## Architecture

### Frontend → Backend → Supabase Flow

- **Frontend** uses `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (safe, limited permissions)
- **Backend** uses `SUPABASE_SERVICE_ROLE_KEY` (never exposed to frontend)
- All privileged operations (user creation, profile writes) go through the FastAPI backend

API base: `VITE_API_BASE_URL` (defaults to `http://localhost:8000/api/v1`)

Frontend API client: `src/lib/api/auth.ts` — `AuthAPI` singleton class with typed request/response interfaces.

### Auth Flow

1. **AppInitializer** (`src/components/AppInitializer.tsx`) restores Supabase session on app start
2. **Zustand store** (`src/stores/useUserStore.ts`) holds global user profile/auth state
3. **UserLayout** (`src/routes/UserLayout.tsx`) guards `/u/:username` routes — redirects unauthenticated users
4. Registration/login go through FastAPI → backend creates Supabase user + `profiles` + `user_stats` rows

### State Management

Zustand (`src/stores/useUserStore.ts`) is the single source of truth for user state. It syncs with Supabase auth session.

### Routing

React Router DOM v7. Pages are lazy-loaded with Suspense.

- Public: `/`, `/register`, `/login`, `/about`, `/contact`, `/flashcards`, `/flashcard-test`
- Protected (requires auth): `/u/:username/*`

### Forms

React Hook Form + Zod schemas for all forms. Real-time username availability via `authAPI.checkUsernameAvailability()`.

### i18n

i18next with browser language detection. Supported: English (`en`), Thai (`th`). Locale files at `src/locales/{en,th}/`.

### Styling

Tailwind CSS with dark mode (class-based). Custom colors defined in `tailwind.config.js`:
- Primary blue: `#326de2`
- Accent gold: `#fcd34d`
- Custom 3D transform utilities for flashcard flip animations

### Backend Structure

```
backend/app/
├── api/v1/auth.py       # Auth endpoints (register, login, check-username, logout)
├── core/
│   ├── config.py        # Pydantic BaseSettings (reads .env)
│   └── supabase.py      # Supabase client (uses service role key)
├── models/auth.py       # Pydantic request/response models
└── services/auth_service.py  # Business logic: create user, verify credentials
```

### Database Schema (Supabase)

- `profiles` — id (FK auth.users), first_name, last_name, email, username (unique)
- `user_stats` — user_id (FK auth.users), xp, level, study_streak, last_login
- `flashcards` — in progress

## Environment Variables

**Frontend** (`.env`):
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_API_BASE_URL=http://localhost:8000/api/v1
```

**Backend** (`backend/.env`):
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SECRET_KEY=
ALLOWED_ORIGINS=["http://localhost:5173"]
ENVIRONMENT=development
```

## Git Workflow

Always work on a feature branch — never commit directly to `main`. Branch naming: `feat/<name>`, `fix/<name>`, `refactor/<name>`. Open a PR targeting `main` when the work is ready.

## Path Aliases

`@/` maps to `src/` (configured in `vite.config.ts` and `tsconfig.json`).
