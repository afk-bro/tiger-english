/**
 * Frontend client for the AI Tutor speech endpoints (Spec 1).
 *
 * Style reference: `src/lib/api/progress.ts` — same shape (a class with a
 * private `authedFetch` helper that injects the Supabase bearer token).
 *
 * Why this module ships its own `authedFetch` rather than reusing the
 * shared `@/lib/api/authedFetch` helper:
 *
 *   - The shared helper returns `null` when the user is unauthenticated.
 *     For an interactive voice session that's the wrong UX: the page
 *     needs to surface a "please sign in" error to the user, not silently
 *     receive null and try to keep going. So this helper throws instead.
 *   - The `submitTurn` endpoint takes multipart/form-data (audio Blob),
 *     which the shared `authedPostJson` wrapper doesn't model.
 *   - Most methods here propagate errors to the UI (the page-level hooks
 *     decide whether to retry, show a toast, or fall back). Only the
 *     "fire-and-forget" `abandonSession` swallows errors.
 *
 * Endpoint shapes are defined by the FastAPI backend under
 * `/api/v1/ai-tutor/*` (public reads) and `/api/v1/me/ai-tutor/*`
 * (authenticated session lifecycle).
 */
import { API_BASE } from "@/lib/api/config";
import { supabase } from "@/lib/supabase";
import type {
  ActiveTutorSessionDTO,
  FinishResponse,
  StartSessionResponse,
  TurnResponse,
  TutorScenarioDetail,
  TutorScenarioSummary,
  TutorSessionDTO,
} from "@/features/ai-tutor/types";

// Client-side guardrails for the multipart audio upload. The backend has its
// own limits — these are belt-and-suspenders to fail fast on tampered or
// malformed blobs without burning a round-trip.
//
// A 20s WebM/Opus recording at 48 kHz is typically <500 KB, so 5 MiB
// (5,242,880 bytes) sits comfortably above any legitimate ceiling. The 20s
// recorder cap lives in `useMicRecorder.ts` as `maxMs` (default 20_000).
const MAX_AUDIO_BYTES = 5 * 1024 * 1024;

/**
 * Error thrown by the tutor client for either:
 *  - any non-2xx HTTP response (status + raw body from the server), or
 *  - client-side guardrail rejections in `submitTurn` (no HTTP round-trip;
 *    status mirrors the would-be server semantics — 413 oversize, 415 bad
 *    MIME — and `path` is prefixed with `client:` so callers can tell them
 *    apart from server-origin errors).
 *
 * Page-level hooks can branch on (e.g.) 503 + body containing "stt_failed".
 */
export class TutorAPIError extends Error {
  readonly status: number;
  readonly path: string;
  readonly body: string;
  constructor(path: string, status: number, body: string) {
    super(`${path} → ${status}: ${body}`);
    this.name = "TutorAPIError";
    this.path = path;
    this.status = status;
    this.body = body;
  }
}

/** Map a recorder MIME type to a sensible file extension for the multipart upload. */
function mimeTypeToExt(mimeType: string): string {
  // Strip codec parameters: "audio/webm;codecs=opus" → "audio/webm".
  const base = mimeType.split(";")[0].trim().toLowerCase();
  switch (base) {
    case "audio/webm":
      return "webm";
    case "audio/ogg":
      return "ogg";
    case "audio/mp4":
    case "audio/x-m4a":
      return "m4a";
    case "audio/mpeg":
      return "mp3";
    case "audio/wav":
    case "audio/x-wav":
      return "wav";
    default:
      return "bin";
  }
}

class TutorAPI {
  /**
   * Private fetch helper. Injects the Supabase bearer token, throws on
   * missing session or non-2xx, parses JSON on 2xx (returns `undefined`
   * for 204 / empty bodies).
   *
   * `Content-Type` is NOT auto-set: JSON callers add it themselves;
   * FormData callers MUST leave it unset so `fetch` can generate the
   * multipart boundary.
   */
  private async authedFetch<T>(path: string, init?: RequestInit): Promise<T> {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error("TutorAPI: not authenticated (no Supabase session)");
    }

    const headers = new Headers(init?.headers);
    headers.set("Authorization", `Bearer ${session.access_token}`);

    const res = await fetch(`${API_BASE}${path}`, { ...init, headers });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new TutorAPIError(path, res.status, text);
    }

    // 204 No Content, or an empty body on 2xx — return undefined.
    if (res.status === 204) return undefined as T;
    const text = await res.text();
    if (!text) return undefined as T;
    return JSON.parse(text) as T;
  }

  // ── Reads (errors propagate) ────────────────────────────────────────

  listScenarios(): Promise<TutorScenarioSummary[]> {
    return this.authedFetch<TutorScenarioSummary[]>("/ai-tutor/scenarios", {
      method: "GET",
    });
  }

  getScenario(slug: string): Promise<TutorScenarioDetail> {
    return this.authedFetch<TutorScenarioDetail>(
      `/ai-tutor/scenarios/${encodeURIComponent(slug)}`,
      { method: "GET" },
    );
  }

  getSession(sessionId: string): Promise<TutorSessionDTO> {
    return this.authedFetch<TutorSessionDTO>(
      `/me/ai-tutor/sessions/${encodeURIComponent(sessionId)}`,
      { method: "GET" },
    );
  }

  getActiveSession(): Promise<ActiveTutorSessionDTO | null> {
    return this.authedFetch<ActiveTutorSessionDTO | null>(
      "/me/ai-tutor/sessions/active",
      { method: "GET" },
    );
  }

  // ── Writes (errors propagate to page-level hooks) ───────────────────

  startSession(
    scenarioSlug: string,
    mode: "fresh" | "continue",
  ): Promise<StartSessionResponse> {
    return this.authedFetch<StartSessionResponse>("/me/ai-tutor/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ scenario_slug: scenarioSlug, mode }),
    });
  }

  async submitTurn(
    sessionId: string,
    audioBlob: Blob,
    mimeType: string,
    currentTaskId: string,
  ): Promise<TurnResponse> {
    // Client-side validation — reject obviously bad blobs before they
    // touch the wire. Status codes mirror semantics: 413 (Payload Too Large)
    // for size, 415 (Unsupported Media Type) for MIME. Both fall through to
    // the page's existing network-error toast via useTutorSession's catch.
    // `async` here ensures these throws surface as promise rejections.
    if (audioBlob.size > MAX_AUDIO_BYTES) {
      throw new TutorAPIError(
        "client:submitTurn:invalid_blob",
        413,
        `audio blob too large: ${audioBlob.size} > ${MAX_AUDIO_BYTES}`,
      );
    }
    // Normalize MIME before checking: strip codec parameters
    // (e.g. "audio/webm;codecs=opus"), trim whitespace, lowercase. Some
    // platforms report "AUDIO/WEBM" or trailing spaces; without
    // normalization those would falsely reject.
    const baseMime = mimeType.split(";")[0].trim().toLowerCase();
    if (!baseMime.startsWith("audio/")) {
      throw new TutorAPIError(
        "client:submitTurn:invalid_blob",
        415,
        `unsupported mime type: ${mimeType}`,
      );
    }
    const form = new FormData();
    form.append("audio", audioBlob, `audio.${mimeTypeToExt(mimeType)}`);
    form.append("current_task_id", currentTaskId);
    // NOTE: do not set Content-Type — fetch must generate the multipart
    // boundary itself. Manually setting it corrupts the body.
    return this.authedFetch<TurnResponse>(
      `/me/ai-tutor/sessions/${encodeURIComponent(sessionId)}/turns`,
      { method: "POST", body: form },
    );
  }

  finishSession(sessionId: string): Promise<FinishResponse> {
    return this.authedFetch<FinishResponse>(
      `/me/ai-tutor/sessions/${encodeURIComponent(sessionId)}/finish`,
      { method: "POST" },
    );
  }

  /**
   * Fire-and-forget abandon. The UI doesn't wait on this (typically called
   * from a `beforeunload` / route-change handler), so we swallow errors:
   * if the request fails the row will eventually be reaped by a server-
   * side timeout anyway.
   */
  async abandonSession(sessionId: string): Promise<void> {
    try {
      await this.authedFetch<void>(
        `/me/ai-tutor/sessions/${encodeURIComponent(sessionId)}/abandon`,
        { method: "POST" },
      );
    } catch (err) {
      console.error("TutorAPI.abandonSession failed", err);
    }
  }
}

export const tutorAPI = new TutorAPI();
