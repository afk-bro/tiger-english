# Gain English Backend API

FastAPI backend for the Gain English learning platform, providing secure authentication and user management.

## Features

- **Secure Authentication**: JWT-based authentication with Supabase integration
- **User Registration**: Complete user registration flow with validation
- **Username Checking**: Real-time username availability checking
- **Service Role Security**: Supabase service role key kept secure on backend
- **Automatic Documentation**: Interactive API docs via FastAPI
- **CORS Support**: Configured for frontend integration

## Setup

### Prerequisites

- Python 3.8+
- pip or poetry
- Supabase project with service role key

### Installation

1. **Create virtual environment**:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. **Install dependencies**:
```bash
pip install -r requirements.txt
```

3. **Environment Configuration**:
```bash
cp .env.example .env
# Edit .env with your actual values
```

Required environment variables:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SECRET_KEY`: Your Supabase secret key (`sb_secret_…` format from Project Settings → API; keep secure!)
- `SECRET_KEY`: JWT secret key (generate a strong random key)

### Running the Server

**Development mode**:
```bash
python run.py
```

**Or with uvicorn directly**:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at:
- **API**: http://localhost:8000
- **Interactive Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc

## API Endpoints

### Authentication

- `POST /api/v1/auth/register` — Register new user
- `POST /api/v1/auth/logout` — User logout
- `GET /api/v1/auth/check-username/{username}` — Check username availability
- `PATCH /api/v1/auth/profile` — Update authenticated user's profile (auth required via `get_current_user`); accepts partial updates for `native_language` and `timezone`

There is no `POST /auth/login` HTTP endpoint — login goes directly through `supabase.auth.signInWithPassword()` from the frontend. `AuthService.login_user()` exists for future internal use only.

### Progress (Phase 1)

All endpoints require authentication via the `Authorization: Bearer <jwt>` header. Writes route through transactional Postgres functions (`*_tx`) granted only to `service_role`.

- `POST /api/v1/me/progress/complete-section` — Mark a lesson section complete (idempotent on `user_id, unit_slug, section_key`)
- `POST /api/v1/me/progress/attempt-exercise` — Record an exercise attempt (correct or incorrect)
- `POST /api/v1/me/progress/review-flashcard` — Record a flashcard review (`status: 'known' | 'unknown'`)
- `GET /api/v1/me/progress/summary` — Aggregated dashboard read: sections completed, exercises (total + correct), flashcards (reviewed + currently_known), streak, study days this week, last active

### Health

- `GET /` — Root endpoint
- `GET /health` — Health check

## Project Structure

```
backend/
├── app/
│   ├── api/v1/          # API endpoints
│   ├── core/            # Core configuration
│   ├── models/          # Pydantic models
│   ├── services/        # Business logic
│   ├── utils/           # Utilities
│   └── main.py          # FastAPI app
├── requirements.txt     # Dependencies
├── run.py              # Development server
└── .env.example        # Environment template
```

## Security Features

- **Service Role Protection**: Supabase service role key never exposed to frontend
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Pydantic models validate all inputs
- **CORS Configuration**: Restricted to allowed origins
- **Error Handling**: Structured error responses

## Integration with Frontend

The backend is designed to replace the frontend's direct Supabase admin usage. Update your frontend to call these API endpoints instead of using `supabaseAdmin` directly.

Example frontend integration:
```typescript
const API_BASE_URL = 'http://localhost:8000/api/v1';

export async function registerUser(userData: RegisterFormData) {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData)
  });
  return response.json();
}
