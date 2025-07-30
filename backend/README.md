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
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key (keep secure!)
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

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/logout` - User logout
- `GET /api/v1/auth/check-username/{username}` - Check username availability

### Health

- `GET /` - Root endpoint
- `GET /health` - Health check

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
