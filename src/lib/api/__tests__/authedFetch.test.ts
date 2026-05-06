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

// ── Mock Response factories ─────────────────────────────────────────────
//
// authedFetch calls `res.clone()` on the 503 path so it can speculatively
// json()-parse and still fall back to text() for the error path. The
// mocks below provide a working clone() that yields a fresh object with
// the same body — sufficient for both code paths.

function jsonResponse(status: number, body: unknown): Response {
  const make = (): Response =>
    ({
      ok: status >= 200 && status < 300,
      status,
      json: async () => body,
      text: async () => JSON.stringify(body),
      clone: () => make(),
    }) as unknown as Response;
  return make();
}

function textResponse(status: number, body: string): Response {
  const make = (): Response =>
    ({
      ok: status >= 200 && status < 300,
      status,
      json: async () => {
        throw new SyntaxError("Unexpected token in JSON");
      },
      text: async () => body,
      clone: () => make(),
    }) as unknown as Response;
  return make();
}

// Pull the headers off the last fetch call as a normalized lookup.
// authedFetch calls fetch with a Headers instance; tests that assert on
// it should go through this so they're robust to future changes (and
// to the case-insensitive nature of HTTP headers).
function lastCallHeaders(): Headers {
  const init = fetchMock.mock.calls.at(-1)?.[1];
  return new Headers(init?.headers);
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

    it("attaches Bearer token", async () => {
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: "tok-abc" } },
      });
      fetchMock.mockResolvedValue(jsonResponse(200, { ok: true }));
      const { authedFetch } = await import("../authedFetch");

      await authedFetch("/me/something");

      expect(fetchMock).toHaveBeenCalledTimes(1);
      const [url] = fetchMock.mock.calls[0];
      expect(url).toContain("/me/something");
      expect(lastCallHeaders().get("authorization")).toBe("Bearer tok-abc");
    });

    it("overrides any caller-supplied Authorization header (helper owns auth)", async () => {
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: "real-tok" } },
      });
      fetchMock.mockResolvedValue(jsonResponse(200, {}));
      const { authedFetch } = await import("../authedFetch");

      await authedFetch("/me/x", {
        headers: { Authorization: "Bearer caller-supplied" },
      });

      expect(lastCallHeaders().get("authorization")).toBe("Bearer real-tok");
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

    it("does NOT auto-set Content-Type (callers passing FormData/Blob/etc. must not get JSON injected)", async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, {}));
      const { authedFetch } = await import("../authedFetch");

      await authedFetch("/me/x", {
        method: "POST",
        body: JSON.stringify({ a: 1 }),
      });

      // No Content-Type touched by the helper.
      expect(lastCallHeaders().get("content-type")).toBeNull();
    });

    it("preserves Content-Type set explicitly via a plain-object headers init", async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, {}));
      const { authedFetch } = await import("../authedFetch");

      await authedFetch("/me/x", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: "raw text",
      });

      expect(lastCallHeaders().get("content-type")).toBe("text/plain");
    });
  });

  describe("HeadersInit shapes", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: "tok" } },
      });
      fetchMock.mockResolvedValue(jsonResponse(200, {}));
    });

    it("plain-object headers are merged with Authorization", async () => {
      const { authedFetch } = await import("../authedFetch");
      await authedFetch("/me/x", { headers: { "X-Custom": "v" } });

      const headers = lastCallHeaders();
      expect(headers.get("authorization")).toBe("Bearer tok");
      expect(headers.get("x-custom")).toBe("v");
    });

    it("Headers instance is preserved (not silently dropped)", async () => {
      const { authedFetch } = await import("../authedFetch");
      const headers = new Headers({ "X-Custom": "hdr-instance" });
      await authedFetch("/me/x", { headers });

      const final = lastCallHeaders();
      expect(final.get("authorization")).toBe("Bearer tok");
      expect(final.get("x-custom")).toBe("hdr-instance");
    });

    it("string[][] headers are preserved", async () => {
      const { authedFetch } = await import("../authedFetch");
      await authedFetch("/me/x", {
        headers: [
          ["X-Custom", "tuple"],
          ["X-Other", "two"],
        ],
      });

      const headers = lastCallHeaders();
      expect(headers.get("authorization")).toBe("Bearer tok");
      expect(headers.get("x-custom")).toBe("tuple");
      expect(headers.get("x-other")).toBe("two");
    });

    it("lowercase content-type from caller is respected (case-insensitive lookup)", async () => {
      const { authedPostJson } = await import("../authedFetch");
      await authedPostJson("/me/x", { a: 1 }, {
        headers: { "content-type": "application/vnd.api+json" },
      });

      // Helper must NOT add a second Content-Type — the case-insensitive
      // .has('content-type') check should detect the existing one.
      expect(lastCallHeaders().get("content-type")).toBe(
        "application/vnd.api+json",
      );
    });
  });

  describe("FormData / non-JSON bodies", () => {
    beforeEach(() => {
      mockGetSession.mockResolvedValue({
        data: { session: { access_token: "tok" } },
      });
      fetchMock.mockResolvedValue(jsonResponse(200, {}));
    });

    it("does not set Content-Type when body is FormData (fetch handles multipart boundary)", async () => {
      const { authedFetch } = await import("../authedFetch");
      const fd = new FormData();
      fd.append("file", new Blob(["x"], { type: "text/plain" }));

      await authedFetch("/me/upload", { method: "POST", body: fd });

      expect(lastCallHeaders().get("content-type")).toBeNull();
    });

    it("does not set Content-Type when body is URLSearchParams", async () => {
      const { authedFetch } = await import("../authedFetch");
      const params = new URLSearchParams({ a: "1" });

      await authedFetch("/me/x", { method: "POST", body: params });

      expect(lastCallHeaders().get("content-type")).toBeNull();
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

    it("throws on 503 WITHOUT ai_disabled, preserving the JSON body in error.body", async () => {
      fetchMock.mockResolvedValue(jsonResponse(503, { detail: "down" }));
      const { authedFetch, AuthedFetchError } = await import("../authedFetch");

      try {
        await authedFetch("/me/x");
        throw new Error("expected throw");
      } catch (err) {
        expect(err).toBeInstanceOf(AuthedFetchError);
        const e = err as InstanceType<typeof AuthedFetchError>;
        expect(e.status).toBe(503);
        expect(e.body).toContain("down");
      }
    });

    it("throws on 503 with NON-JSON body, preserving the raw text in error.body", async () => {
      // Reverse-of-PR-#129-review: previously this lost diagnostics
      // (body became "null" via JSON.stringify(null)). The clone()
      // pattern preserves the original "Service Unavailable" text.
      fetchMock.mockResolvedValue(textResponse(503, "Service Unavailable"));
      const { authedFetch, AuthedFetchError } = await import("../authedFetch");

      try {
        await authedFetch("/me/x");
        throw new Error("expected throw");
      } catch (err) {
        expect(err).toBeInstanceOf(AuthedFetchError);
        const e = err as InstanceType<typeof AuthedFetchError>;
        expect(e.status).toBe(503);
        expect(e.body).toBe("Service Unavailable");
      }
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

    const init = fetchMock.mock.calls[0][1];
    expect(init.method).toBe("POST");
    expect(lastCallHeaders().get("content-type")).toBe("application/json");
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

  it("respects caller-supplied Content-Type (case-insensitive) without doubling up", async () => {
    fetchMock.mockResolvedValue(jsonResponse(200, {}));
    const { authedPostJson } = await import("../authedFetch");

    await authedPostJson("/me/x", { a: 1 }, {
      headers: { "Content-Type": "application/vnd.custom+json" },
    });

    expect(lastCallHeaders().get("content-type")).toBe(
      "application/vnd.custom+json",
    );
  });
});
