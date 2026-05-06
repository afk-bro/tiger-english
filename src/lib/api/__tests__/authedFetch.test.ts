import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

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
    json: async () => body,
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

function textResponse(status: number, body: string): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => {
      throw new Error("not json");
    },
    text: async () => body,
  } as unknown as Response;
}

describe("authedFetch", () => {
  describe("session handling", () => {
    it("returns null and does NOT call fetch when there is no session", async () => {
      mockGetSession.mockResolvedValue({ data: { session: null } });
      const { authedFetch } = await import("../authedFetch");

      const result = await authedFetch<{ x: number }>("/me/anything");

      expect(result).toBeNull();
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it("attaches Bearer token and forwards through to fetch", async () => {
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: "tok-abc" } },
      });
      fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }));
      const { authedFetch } = await import("../authedFetch");

      await authedFetch("/me/something");

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toContain("/me/something");
      expect((init.headers as Record<string, string>).Authorization).toBe(
        "Bearer tok-abc",
      );
    });
  });

  describe("happy path", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: "tok" } },
      });
    });

    it("returns the parsed JSON body typed as T on 200", async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, { items: [1, 2, 3] }));
      const { authedFetch } = await import("../authedFetch");

      const result = await authedFetch<{ items: number[] }>("/me/list");

      expect(result).toEqual({ items: [1, 2, 3] });
    });

    it("merges caller-supplied headers on top of Authorization", async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, {}));
      const { authedFetch } = await import("../authedFetch");

      await authedFetch("/me/x", { headers: { "X-Custom": "yes" } });

      const init = fetchMock.mock.calls[0][1];
      expect(init.headers.Authorization).toBe("Bearer tok");
      expect(init.headers["X-Custom"]).toBe("yes");
    });

    it("does not auto-set Content-Type for GET (no body)", async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, {}));
      const { authedFetch } = await import("../authedFetch");

      await authedFetch("/me/x", { method: "GET" });

      const init = fetchMock.mock.calls[0][1];
      expect(init.headers["Content-Type"]).toBeUndefined();
    });

    it("auto-sets Content-Type=application/json when a body is present", async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, {}));
      const { authedFetch } = await import("../authedFetch");

      await authedFetch("/me/x", {
        method: "POST",
        body: JSON.stringify({ a: 1 }),
      });

      const init = fetchMock.mock.calls[0][1];
      expect(init.headers["Content-Type"]).toBe("application/json");
    });

    it("respects caller-supplied Content-Type instead of auto-setting", async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, {}));
      const { authedFetch } = await import("../authedFetch");

      await authedFetch("/me/x", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: "raw text",
      });

      const init = fetchMock.mock.calls[0][1];
      expect(init.headers["Content-Type"]).toBe("text/plain");
    });
  });

  describe("503 + ai_disabled graceful-degrade", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: "tok" } },
      });
    });

    it("returns the body as a value (not throwing) when 503 has ai_disabled code", async () => {
      const aiDisabled = {
        code: "ai_disabled",
        detail: "AI features are not enabled on this server.",
      };
      fetchMock.mockResolvedValue(jsonResponse(503, aiDisabled));
      const { authedFetch } = await import("../authedFetch");

      const result = await authedFetch<{ code: string; detail: string }>(
        "/me/ai-tutor/explain",
      );

      expect(result).toEqual(aiDisabled);
    });

    it("throws on 503 WITHOUT ai_disabled (real outage)", async () => {
      fetchMock.mockResolvedValue(jsonResponse(503, { detail: "down" }));
      const { authedFetch } = await import("../authedFetch");

      await expect(authedFetch("/me/x")).rejects.toThrow(/503/);
    });

    it("throws on 503 with non-JSON body (no ai_disabled to extract)", async () => {
      fetchMock.mockResolvedValue(textResponse(503, "Service Unavailable"));
      const { authedFetch } = await import("../authedFetch");

      await expect(authedFetch("/me/x")).rejects.toThrow(/503/);
    });
  });

  describe("error handling", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: "tok" } },
      });
    });

    it("throws AuthedFetchError carrying status, path, body for 500", async () => {
      fetchMock.mockResolvedValue(jsonResponse(500, { detail: "boom" }));
      const { authedFetch, AuthedFetchError } = await import("../authedFetch");

      try {
        await authedFetch("/me/x");
        throw new Error("expected throw");
      } catch (err) {
        expect(err).toBeInstanceOf(AuthedFetchError);
        const e = err as InstanceType<typeof AuthedFetchError>;
        expect(e.status).toBe(500);
        expect(e.path).toBe("/me/x");
        expect(e.body).toContain("boom");
      }
    });

    it("throws on 401 (auth issue) — caller decides whether to refresh", async () => {
      fetchMock.mockResolvedValue(jsonResponse(401, { detail: "unauth" }));
      const { authedFetch } = await import("../authedFetch");

      await expect(authedFetch("/me/x")).rejects.toThrow(/401/);
    });

    it("throws on 422 (validation), preserving body for diagnostics", async () => {
      fetchMock.mockResolvedValue(
        jsonResponse(422, { detail: [{ msg: "field required" }] }),
      );
      const { authedFetch, AuthedFetchError } = await import("../authedFetch");

      try {
        await authedFetch("/me/x");
        throw new Error("expected throw");
      } catch (err) {
        expect(err).toBeInstanceOf(AuthedFetchError);
        expect((err as InstanceType<typeof AuthedFetchError>).status).toBe(422);
      }
    });

    it("propagates network errors from fetch", async () => {
      fetchMock.mockRejectedValue(new TypeError("network down"));
      const { authedFetch } = await import("../authedFetch");

      await expect(authedFetch("/me/x")).rejects.toThrow(/network down/);
    });
  });
});

describe("authedGet", () => {
  beforeEach(() => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: "tok" } },
    });
  });

  it("uses GET method", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }));
    const { authedGet } = await import("../authedFetch");

    await authedGet("/me/list");

    expect(fetchMock.mock.calls[0][1].method).toBe("GET");
  });

  it("returns parsed body on success", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { count: 7 }));
    const { authedGet } = await import("../authedFetch");

    const result = await authedGet<{ count: number }>("/me/list");

    expect(result).toEqual({ count: 7 });
  });

  it("returns null when anonymous", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    const { authedGet } = await import("../authedFetch");

    const result = await authedGet("/me/list");

    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("authedPostJson", () => {
  beforeEach(() => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: "tok" } },
    });
  });

  it("uses POST + Content-Type: application/json + serialized body", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }));
    const { authedPostJson } = await import("../authedFetch");

    await authedPostJson("/me/submit", { a: 1, b: "two" });

    const [, init] = fetchMock.mock.calls[0];
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("application/json");
    expect(init.body).toBe(JSON.stringify({ a: 1, b: "two" }));
  });

  it("returns the parsed response body on 200", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, { id: "abc" }));
    const { authedPostJson } = await import("../authedFetch");

    const result = await authedPostJson<{ id: string }>("/me/submit", { x: 1 });

    expect(result).toEqual({ id: "abc" });
  });

  it("returns the ai_disabled body verbatim on 503", async () => {
    fetchMock.mockResolvedValue(
      jsonResponse(503, { code: "ai_disabled", detail: "no key" }),
    );
    const { authedPostJson } = await import("../authedFetch");

    const result = await authedPostJson<{ code: string; detail: string }>(
      "/me/ai-tutor/explain",
      { question: "x" },
    );

    expect(result).toEqual({ code: "ai_disabled", detail: "no key" });
  });
});
