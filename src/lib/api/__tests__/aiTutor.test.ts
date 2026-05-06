import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const mockGetSession = vi.fn();
vi.mock("@/lib/supabase", () => ({
  supabase: { auth: { getSession: () => mockGetSession() } },
}));

const fetchMock = vi.fn();
beforeEach(() => {
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockReset();
  mockGetSession.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

describe("aiTutorAPI authedFetch", () => {
  it("returns null when there is no session (no fetch call)", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    const { aiTutorAPI } = await import("../aiTutor");

    const result = await aiTutorAPI.explain({ question: "what is the present perfect?" });
    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns the ai_disabled payload as a value on 503 (graceful degrade)", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: "tok" } },
    });
    const aiDisabled = {
      code: "ai_disabled",
      detail: "AI features are not enabled on this server.",
    };
    fetchMock.mockResolvedValue(jsonResponse(503, aiDisabled));
    const { aiTutorAPI } = await import("../aiTutor");

    const result = await aiTutorAPI.explain({ question: "x" });
    expect(result).toEqual(aiDisabled);
    expect(result).not.toBeNull();
    if (result && "code" in result) {
      expect(result.code).toBe("ai_disabled");
    }
  });

  it("returns null on a 503 that lacks the ai_disabled code (real error)", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: "tok" } },
    });
    fetchMock.mockResolvedValue(
      jsonResponse(503, { detail: "service unavailable" }),
    );
    const { aiTutorAPI } = await import("../aiTutor");

    const result = await aiTutorAPI.correct({ sentence: "she go school" });
    expect(result).toBeNull();
  });

  it("returns null on non-503 server errors (caught and logged)", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: "tok" } },
    });
    fetchMock.mockResolvedValue(jsonResponse(500, { detail: "boom" }));
    const { aiTutorAPI } = await import("../aiTutor");

    const result = await aiTutorAPI.practice({ topic: "verbs" });
    expect(result).toBeNull();
  });

  it("returns the typed response body on 200", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: "tok" } },
    });
    fetchMock.mockResolvedValue(
      jsonResponse(200, { explanation: "Use 'have' for first/second person and 'has' for third." }),
    );
    const { aiTutorAPI } = await import("../aiTutor");

    const result = await aiTutorAPI.explain({ question: "have vs has" });
    expect(result).not.toBeNull();
    if (result && "explanation" in result) {
      expect(result.explanation).toContain("have");
    }
  });

  it("attaches the Bearer token and Content-Type", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: "tok-123" } },
    });
    fetchMock.mockResolvedValue(jsonResponse(200, { explanation: "ok" }));
    const { aiTutorAPI } = await import("../aiTutor");

    await aiTutorAPI.explain({ question: "q" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    expect(init.headers.Authorization).toBe("Bearer tok-123");
    expect(init.headers["Content-Type"]).toBe("application/json");
  });
});
