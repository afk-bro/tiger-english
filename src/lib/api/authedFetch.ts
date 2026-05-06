/**
 * Shared `authedFetch` helper for the FastAPI backend.
 *
 * Replaces the three coexisting conventions documented in
 * docs/2026-05-06-codebase-audit.md (§1.1):
 *   - the per-class `authedFetch` private methods in lib/api/aiTutor.ts and
 *     lib/api/progress.ts (each a slightly different copy of the same code)
 *   - the ~10 inline `getSession → Bearer token → fetch` blocks across hooks
 *     and components
 *
 * Contract (matches the existing aiTutor.ts behavior, which received the
 * `503 + ai_disabled` fix in PR #122):
 *
 *   - Reads the Supabase access token from `supabase.auth.getSession()`.
 *   - Returns `null` when the user has no session (anonymous). The helper
 *     does NOT make a network call in that case.
 *   - 2xx responses → returns the parsed JSON body typed as `T`.
 *   - 503 with `{code: "ai_disabled", ...}` → returns the body verbatim
 *     (typed as `T`). This is a documented graceful-degrade signal from
 *     the AI tutor endpoints; treating it as an error would defeat the
 *     fallback UI those tabs already render.
 *   - Any other non-2xx (including 503 without an `ai_disabled` body) →
 *     throws an `Error`. Callers that want silent degrade should wrap in
 *     try/catch (the existing class clients do this).
 *
 * Returns `T | null`, never `T | undefined`, so callers can use a single
 * truthiness check.
 */
import { supabase } from "@/lib/supabase";
import { API_BASE } from "@/lib/api/config";

export class AuthedFetchError extends Error {
  readonly status: number;
  readonly path: string;
  readonly body: string;
  constructor(path: string, status: number, body: string) {
    super(`${path} → ${status}`);
    this.name = "AuthedFetchError";
    this.path = path;
    this.status = status;
    this.body = body;
  }
}

async function readSessionToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}

/**
 * Generic authed fetch. Caller controls method / body / headers via
 * `init`. The helper injects `Authorization: Bearer …` and merges callers'
 * headers on top. JSON parsing is automatic — callers expecting a
 * non-JSON response should switch to a custom fetch.
 */
export async function authedFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T | null> {
  const token = await readSessionToken();
  if (!token) return null;

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init?.body !== undefined && !(init?.headers && "Content-Type" in (init.headers as Record<string, string>))
        ? { "Content-Type": "application/json" }
        : {}),
      ...(init?.headers as Record<string, string> | undefined),
    },
  });

  // Documented graceful-degrade signal — surface the body as a value so
  // callers can branch on `result.code === 'ai_disabled'` instead of
  // catching a generic error. See PR #122.
  if (res.status === 503) {
    const body = (await res.json().catch(() => null)) as
      | { code?: string }
      | null;
    if (body && body.code === "ai_disabled") {
      return body as T;
    }
    const text = JSON.stringify(body);
    throw new AuthedFetchError(path, 503, text);
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new AuthedFetchError(path, res.status, text);
  }

  return (await res.json()) as T;
}

/** Convenience wrapper for GET requests. */
export function authedGet<T>(path: string, init?: RequestInit): Promise<T | null> {
  return authedFetch<T>(path, { ...init, method: "GET" });
}

/** Convenience wrapper for POST + JSON body — the most common write shape. */
export function authedPostJson<T>(
  path: string,
  body: unknown,
  init?: RequestInit,
): Promise<T | null> {
  return authedFetch<T>(path, {
    ...init,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers as Record<string, string> | undefined),
    },
    body: JSON.stringify(body),
  });
}
