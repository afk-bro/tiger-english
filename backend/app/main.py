from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.config import settings
from .core.supabase import get_supabase_admin
from .api.v1.auth import router as auth_router
from .api.v1.progress import router as progress_router
from .api.v1.ai_tutor import router as ai_tutor_router
from .api.v1.skills import router as skills_router
from .api.v1.review import router as review_router
from .api.v1.conversations import router as conversations_router
from .api.v1.admin import router as admin_router
from .api.v1.lessons import router as lessons_router

app = FastAPI(
    title="Gain English API",
    description="Backend API for the Gain English learning platform",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/api/v1")
app.include_router(progress_router, prefix="/api/v1")
app.include_router(ai_tutor_router, prefix="/api/v1")
app.include_router(skills_router, prefix="/api/v1")
app.include_router(review_router, prefix="/api/v1")
app.include_router(conversations_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
app.include_router(lessons_router, prefix="/api/v1")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Gain English API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def liveness():
    """Lightweight liveness probe for the host platform (Railway, etc.).

    Intentionally does no I/O — a 200 here means the process is up and
    serving. For application-level readiness (DB, AI keys, etc.) see
    /api/v1/health.
    """
    return {"status": "ok"}

@app.get("/api/v1/health")
async def health_check():
    """
    Health check endpoint.
    Returns status of AI tutor, voice mode, and database connectivity.
    """
    # Check database reachability
    db_reachable = False
    try:
        supabase = get_supabase_admin()
        # Simple query to verify DB connection
        result = supabase.table("profiles").select("id").limit(1).execute()
        db_reachable = True
    except Exception:
        db_reachable = False

    # Check if Anthropic API is reachable (just check if configured)
    anthropic_reachable = settings.ai_tutor_enabled

    return {
        "status": "ok",
        "ai_tutor_enabled": settings.ai_tutor_enabled,
        "voice_enabled": settings.ai_voice_enabled,
        "anthropic_reachable": anthropic_reachable,
        "db_reachable": db_reachable,
    }
