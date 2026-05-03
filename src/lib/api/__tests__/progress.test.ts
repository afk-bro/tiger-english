import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock the supabase module at the top — all tests share it.
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

describe("ProgressAPI", () => {
  it("returns null for write methods when user is anonymous", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    const { ProgressAPI } = await import("../progress");

    const result = await ProgressAPI.completeSection("unit-1", "overview");
    expect(result).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns null for getSummary when user is anonymous", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    const { ProgressAPI } = await import("../progress");

    const result = await ProgressAPI.getSummary();
    expect(result).toBeNull();
  });

  it("attaches Bearer token for authed requests", async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: "test-token-abc" } },
    });
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });
    const { ProgressAPI } = await import("../progress");

    await ProgressAPI.completeSection("unit-1", "overview");

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [, init] = fetchMock.mock.calls[0];
    expect((init as RequestInit).headers).toMatchObject({
      Authorization: "Bearer test-token-abc",
      "Content-Type": "application/json",
    });
  });

  it("completeSection sends the right body", async () => {
    mockGetSession.mockResolvedValue({ data: { session: { access_token: "t" } } });
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });
    const { ProgressAPI } = await import("../progress");

    await ProgressAPI.completeSection("unit-2", "grammar");

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/me/progress/complete-section");
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      unit_slug: "unit-2",
      section_key: "grammar",
    });
  });

  it("attemptExercise sends the right body", async () => {
    mockGetSession.mockResolvedValue({ data: { session: { access_token: "t" } } });
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });
    const { ProgressAPI } = await import("../progress");

    await ProgressAPI.attemptExercise({
      unitSlug: "unit-2", sectionKey: "activities",
      exerciseId: "u2-activities-mcq-1", isCorrect: true,
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/me/progress/attempt-exercise");
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      unit_slug: "unit-2",
      section_key: "activities",
      exercise_id: "u2-activities-mcq-1",
      is_correct: true,
    });
  });

  it("reviewFlashcard sends the right body", async () => {
    mockGetSession.mockResolvedValue({ data: { session: { access_token: "t" } } });
    fetchMock.mockResolvedValue({ ok: true, json: async () => ({}) });
    const { ProgressAPI } = await import("../progress");

    await ProgressAPI.reviewFlashcard({
      flashcardId: "22222222-2222-2222-2222-222222222222",
      status: "known",
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toContain("/me/progress/review-flashcard");
    expect(JSON.parse((init as RequestInit).body as string)).toEqual({
      flashcard_id: "22222222-2222-2222-2222-222222222222",
      status: "known",
    });
  });

  it("write methods do NOT throw on non-2xx — they return null and log", async () => {
    mockGetSession.mockResolvedValue({ data: { session: { access_token: "t" } } });
    fetchMock.mockResolvedValue({ ok: false, status: 500 });
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const { ProgressAPI } = await import("../progress");

    const a = await ProgressAPI.completeSection("unit-1", "overview");
    const b = await ProgressAPI.attemptExercise({
      unitSlug: "u", sectionKey: "s", exerciseId: "e", isCorrect: true,
    });
    const c = await ProgressAPI.reviewFlashcard({ flashcardId: "x", status: "known" });

    expect(a).toBeNull();
    expect(b).toBeNull();
    expect(c).toBeNull();
    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });

  it("getSummary throws on non-2xx", async () => {
    mockGetSession.mockResolvedValue({ data: { session: { access_token: "t" } } });
    fetchMock.mockResolvedValue({ ok: false, status: 500 });
    const { ProgressAPI } = await import("../progress");

    await expect(ProgressAPI.getSummary()).rejects.toThrow();
  });
});
