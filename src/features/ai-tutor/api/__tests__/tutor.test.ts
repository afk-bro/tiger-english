import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

const mockGetSession = vi.fn();
vi.mock("@/lib/supabase", () => ({
  supabase: { auth: { getSession: () => mockGetSession() } },
}));

const fetchMock = vi.fn();
let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  mockGetSession.mockReset();
  mockGetSession.mockResolvedValue({
    data: { session: { access_token: "fake-token" } },
  });
  consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  consoleErrorSpy.mockRestore();
});

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => (body === undefined ? "" : JSON.stringify(body)),
    json: async () => body,
  } as unknown as Response;
}

function getHeader(init: RequestInit, name: string): string | null {
  const headers = new Headers(init.headers);
  return headers.get(name);
}

describe("tutorAPI.listScenarios", () => {
  it("issues GET with Bearer token and returns the parsed JSON array", async () => {
    const scenarios = [
      {
        slug: "ordering-coffee",
        title_en: "Ordering Coffee",
        title_vi: "Gọi Cà Phê",
        level: "A1",
        mode: "course",
        is_free: true,
      },
    ];
    fetchMock.mockResolvedValueOnce(jsonResponse(200, scenarios));

    const { tutorAPI } = await import("../tutor");
    const result = await tutorAPI.listScenarios();

    expect(result).toEqual(scenarios);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/ai-tutor\/scenarios$/);
    expect(init.method).toBe("GET");
    expect(getHeader(init, "authorization")).toBe("Bearer fake-token");
  });
});

describe("tutorAPI.startSession", () => {
  it("issues POST with JSON body {scenario_slug, mode} and Bearer token", async () => {
    const startResponse = {
      session_id: "sess-1",
      status: "active",
      current_task_id: "task-1",
      opening_turn: {
        id: "turn-1",
        speaker: "ai",
        text_en: "Hello!",
        audio_url: null,
        correction: null,
        task_completed: false,
        created_at: "2026-05-11T00:00:00Z",
      },
    };
    fetchMock.mockResolvedValueOnce(jsonResponse(200, startResponse));

    const { tutorAPI } = await import("../tutor");
    const result = await tutorAPI.startSession("ordering-coffee", "fresh");

    expect(result).toEqual(startResponse);

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/me\/ai-tutor\/sessions$/);
    expect(init.method).toBe("POST");
    expect(getHeader(init, "authorization")).toBe("Bearer fake-token");
    expect(getHeader(init, "content-type")).toBe("application/json");
    expect(JSON.parse(init.body as string)).toEqual({
      scenario_slug: "ordering-coffee",
      mode: "fresh",
    });
  });
});

describe("tutorAPI.submitTurn", () => {
  it("issues POST with FormData (audio + current_task_id), no manual Content-Type, Bearer token present", async () => {
    const turnResponse = {
      transcript: "I want a latte.",
      evaluation: {
        kind: "evaluated",
        task_completed: true,
        severity: "none",
        correction: null,
        should_advance: true,
        matched_pattern: "want_drink",
      },
      session: {
        id: "sess-1",
        scenario_slug: "ordering-coffee",
        status: "active",
        current_task_id: "task-2",
        completed_task_ids: ["task-1"],
        mistake_count: 0,
        xp_awarded: 0,
        started_at: "2026-05-11T00:00:00Z",
        last_activity_at: "2026-05-11T00:00:01Z",
        completed_at: null,
      },
      new_turns: [],
      current_task_id: "task-2",
      end_lesson_detected: false,
      tasks_done: 1,
      tasks_total: 3,
    };
    fetchMock.mockResolvedValueOnce(jsonResponse(200, turnResponse));

    const audioBlob = new Blob(["fake-audio-bytes"], { type: "audio/webm" });
    const { tutorAPI } = await import("../tutor");
    const result = await tutorAPI.submitTurn(
      "sess-1",
      audioBlob,
      "audio/webm;codecs=opus",
      "task-1",
    );

    expect(result).toEqual(turnResponse);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toMatch(/\/me\/ai-tutor\/sessions\/sess-1\/turns$/);
    expect(init.method).toBe("POST");

    // Bearer present.
    expect(getHeader(init, "authorization")).toBe("Bearer fake-token");
    // Content-Type must NOT be set manually — fetch generates the multipart boundary.
    expect(getHeader(init, "content-type")).toBeNull();

    // Body is a FormData with the two fields.
    expect(init.body).toBeInstanceOf(FormData);
    const form = init.body as FormData;
    const audio = form.get("audio");
    expect(audio).toBeInstanceOf(Blob);
    // File name carries the extension derived from the MIME type.
    if (audio instanceof File) {
      expect(audio.name).toBe("audio.webm");
    }
    expect(form.get("current_task_id")).toBe("task-1");
  });

  it("rejects oversize blobs client-side without issuing fetch (413)", async () => {
    // Allocates a 5 MiB + 1 byte buffer. Cheap (~5 MB heap), tolerable in
    // jsdom; the alternative would be mocking Blob.size which adds noise.
    const oversize = new Blob([new Uint8Array(5 * 1024 * 1024 + 1)], {
      type: "audio/webm",
    });
    const { tutorAPI, TutorAPIError } = await import("../tutor");

    const err = await tutorAPI
      .submitTurn("sess-1", oversize, "audio/webm", "task-1")
      .catch((e) => e);
    expect(err).toBeInstanceOf(TutorAPIError);
    expect(err).toMatchObject({
      path: "client:submitTurn:invalid_blob",
      status: 413,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects non-audio MIME types client-side without issuing fetch (415)", async () => {
    const blob = new Blob(["x"], { type: "video/mp4" });
    const { tutorAPI, TutorAPIError } = await import("../tutor");

    const err = await tutorAPI
      .submitTurn("sess-1", blob, "video/mp4", "task-1")
      .catch((e) => e);
    expect(err).toBeInstanceOf(TutorAPIError);
    expect(err).toMatchObject({
      path: "client:submitTurn:invalid_blob",
      status: 415,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("accepts MIME types with codec parameters, mixed case, and whitespace", async () => {
    // Normalization branch: strips ";codecs=opus", trims, lowercases.
    fetchMock.mockResolvedValueOnce(jsonResponse(200, {
      transcript: "ok",
      evaluation: { kind: "evaluated", task_completed: true, severity: "none", correction: null, should_advance: true, matched_pattern: null },
      session: { id: "sess-1", scenario_slug: "s", status: "active", current_task_id: null, completed_task_ids: [], mistake_count: 0, xp_awarded: 0, started_at: "", last_activity_at: "", completed_at: null },
      new_turns: [],
      current_task_id: null,
      end_lesson_detected: false,
      tasks_done: 1,
      tasks_total: 1,
    }));
    const blob = new Blob(["x"], { type: "audio/webm" });
    const { tutorAPI } = await import("../tutor");

    await expect(
      tutorAPI.submitTurn("sess-1", blob, "  AUDIO/WebM ;codecs=opus", "task-1"),
    ).resolves.toBeDefined();
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("throws an error containing the diagnostic body when the STT pipeline returns 503", async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(503, { code: "stt_failed", detail: "Whisper unavailable" }),
    );

    const audioBlob = new Blob(["x"], { type: "audio/webm" });
    const { tutorAPI } = await import("../tutor");

    await expect(
      tutorAPI.submitTurn("sess-1", audioBlob, "audio/webm", "task-1"),
    ).rejects.toThrow(/stt_failed/);
  });
});

describe("tutorAPI.abandonSession", () => {
  it("swallows errors so callers (beforeunload handlers) don't have to try/catch", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(500, { detail: "boom" }));
    const { tutorAPI } = await import("../tutor");
    await expect(tutorAPI.abandonSession("sess-1")).resolves.toBeUndefined();
  });
});

describe("tutorAPI auth", () => {
  it("throws a clear error when there is no Supabase session", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    const { tutorAPI } = await import("../tutor");

    await expect(tutorAPI.listScenarios()).rejects.toThrow(/not authenticated/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
