"""CORS allowlist tests.

Pins two pieces of the CORS contract:
  1. The exact-match list (ALLOWED_ORIGINS) still works.
  2. The optional regex (ALLOWED_ORIGIN_REGEX) is honored — the prod
     reason this exists is Vercel preview deploys, which get a fresh
     subdomain per branch and would otherwise fail CORS against Railway
     until ALLOWED_ORIGINS was manually updated and the backend redeployed.
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.testclient import TestClient


def _build_app(*, allow_origins: list[str], allow_origin_regex: str | None) -> TestClient:
    """Mirror the middleware config in app.main exactly. The duplication
    is intentional — testing through app.main directly would require
    reloading the module per-test to pick up changed settings."""
    app = FastAPI()
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allow_origins,
        allow_origin_regex=allow_origin_regex,
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
        allow_headers=["*"],
    )

    @app.get("/ping")
    def _ping():
        return {"ok": True}

    return TestClient(app)


def _preflight(client: TestClient, origin: str):
    return client.options(
        "/ping",
        headers={
            "Origin": origin,
            "Access-Control-Request-Method": "GET",
        },
    )


def test_exact_match_origin_is_allowed():
    client = _build_app(
        allow_origins=["https://tiger-english.com"],
        allow_origin_regex=None,
    )
    response = _preflight(client, "https://tiger-english.com")
    assert response.headers.get("access-control-allow-origin") == "https://tiger-english.com"


def test_origin_outside_allowlist_is_rejected_when_no_regex():
    client = _build_app(
        allow_origins=["https://tiger-english.com"],
        allow_origin_regex=None,
    )
    response = _preflight(
        client,
        "https://tiger-english-git-feat-foo-skookum-team.vercel.app",
    )
    assert "access-control-allow-origin" not in response.headers


def test_vercel_preview_origin_allowed_via_regex():
    """Reproduces the production scenario: a Vercel preview branch URL
    is not in ALLOWED_ORIGINS, but the regex matches it."""
    client = _build_app(
        allow_origins=["https://tiger-english.com"],
        allow_origin_regex=r"^https://tiger-english-[a-z0-9-]+\.vercel\.app$",
    )
    preview_origin = "https://tiger-english-git-feat-foo-skookum-team.vercel.app"
    response = _preflight(client, preview_origin)
    assert response.headers.get("access-control-allow-origin") == preview_origin


def test_regex_does_not_match_unrelated_vercel_subdomains():
    """Guard against an over-broad regex letting in any *.vercel.app."""
    client = _build_app(
        allow_origins=[],
        allow_origin_regex=r"^https://tiger-english-[a-z0-9-]+\.vercel\.app$",
    )
    response = _preflight(client, "https://evil-app-skookum-team.vercel.app")
    assert "access-control-allow-origin" not in response.headers


def test_settings_parses_allowed_origin_regex_from_env(monkeypatch):
    """Settings reads ALLOWED_ORIGIN_REGEX as a plain string and defaults
    to None. Pydantic env-var binding is what wires this in production."""
    from app.core.config import Settings

    pattern = r"^https://tiger-english-[a-z0-9-]+\.vercel\.app$"
    monkeypatch.setenv("ALLOWED_ORIGIN_REGEX", pattern)
    s = Settings()
    assert s.allowed_origin_regex == pattern

    monkeypatch.delenv("ALLOWED_ORIGIN_REGEX", raising=False)
    s2 = Settings()
    assert s2.allowed_origin_regex is None
