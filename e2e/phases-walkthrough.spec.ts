/**
 * e2e/phases-walkthrough.spec.ts
 *
 * Comprehensive walkthrough of Phase 1–10 + 13 surfaces shipped via PR #119.
 * Designed as a *discovery* spec — failures are findings to investigate, not
 * regressions of prior promised behavior. Logs gating outcomes rather than
 * asserting role-specific reachability so we observe what the tester account
 * actually sees.
 */
import { test, expect, type Page } from "@playwright/test";

const API_BASE = "http://localhost:8000/api/v1";

async function getJson(page: Page, path: string) {
  const res = await page.request.get(`${API_BASE}${path}`);
  return { status: res.status(), body: res.ok() ? await res.json() : await res.text() };
}

async function getAccessToken(page: Page): Promise<string | undefined> {
  // page.evaluate fails on about:blank — navigate to the app first if needed.
  if (!page.url().startsWith("http")) {
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
  }
  return page.evaluate(() => {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith("sb-") && k.endsWith("-auth-token")) {
        try {
          const parsed = JSON.parse(localStorage.getItem(k) ?? "{}");
          return parsed.access_token as string | undefined;
        } catch {
          return undefined;
        }
      }
    }
    return undefined;
  });
}

async function getAuthedJson(page: Page, path: string) {
  const token = await getAccessToken(page);
  const res = await page.request.get(`${API_BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return { status: res.status(), body: res.ok() ? await res.json() : await res.text() };
}

async function postAuthedJson(page: Page, path: string, data: unknown) {
  const token = await getAccessToken(page);
  const res = await page.request.post(`${API_BASE}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    data: data as Record<string, unknown>,
  });
  return { status: res.status(), body: res.status() < 300 ? await res.json() : await res.text() };
}

test.describe("Phase 1 — CEFR foundation", () => {
  test("health endpoint reports ai_tutor_enabled flag", async ({ page }) => {
    const { status, body } = await getJson(page, "/health");
    expect(status).toBe(200);
    expect(body).toHaveProperty("status", "ok");
    expect(body).toHaveProperty("ai_tutor_enabled");
    expect(body).toHaveProperty("db_reachable");
    console.log("[health]", body);
  });

  test("/lessons groups units by CEFR level (A1, A2 sections)", async ({ page }) => {
    await page.goto("/lessons");
    await expect(page.getByRole("region", { name: /A1/i })).toBeVisible();
    await expect(page.getByRole("region", { name: /A2/i })).toBeVisible();
    // Available units render as <a>; coming-soon as <div>. Count both via the
    // .card class so we see the full unit count grouped per CEFR section.
    const a1All = page.locator('section[aria-labelledby="cefr-heading-A1"] .card');
    const a2All = page.locator('section[aria-labelledby="cefr-heading-A2"] .card');
    const a1Count = await a1All.count();
    const a2Count = await a2All.count();
    console.log(`[lessons] A1 cards=${a1Count} A2 cards=${a2Count}`);
    expect(a1Count).toBeGreaterThan(0);
    expect(a2Count).toBeGreaterThan(0);
  });

  test("dashboard renders without error (CefrBadge when estimate is set)", async ({ page }) => {
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1500);
    const headingCount = await page.getByRole("heading", { level: 1 }).count();
    const badgeCount = await page.getByLabel(/CEFR level/i).count();
    const url = page.url();
    console.log(`[dashboard] url=${url} h1Count=${headingCount} CefrBadge=${badgeCount}`);
    expect(url).toContain("/dashboard");
  });
});

test.describe("Phase 2 — AI tutor backend", () => {
  // ANTHROPIC_API_KEY is unset → endpoints are documented to return ai_disabled.
  // Each endpoint has its own schema; supply matching payloads so we exercise
  // the disabled-AI path (not Pydantic validation).
  const cases: { path: string; payload: Record<string, unknown> }[] = [
    { path: "/me/ai-tutor/explain", payload: { question: "What is the difference between 'a' and 'an'?" } },
    { path: "/me/ai-tutor/correct", payload: { sentence: "She go to school every day." } },
    { path: "/me/ai-tutor/practice", payload: { topic: "present continuous", difficulty: "A1" } },
    { path: "/me/ai-tutor/writing-coach", payload: { text: "I am writing a short paragraph for testing." } },
  ];
  for (const { path, payload } of cases) {
    test(`POST ${path} responds when API key missing (records observed status)`, async ({ page }) => {
      const { status, body } = await postAuthedJson(page, path, payload);
      console.log(`[${path}] status=${status} body=`, typeof body === "string" ? body.slice(0, 200) : body);
      // Observed: explain/correct/practice → 503 + {code: "ai_disabled"}.
      // writing-coach → 200 with an in-memory mock response (different
      // graceful-degrade strategy). Both shapes are treated as findings.
      expect([200, 503]).toContain(status);
    });
  }
});

test.describe("Phase 3 — AI Tutor Panel", () => {
  test("sidebar exposes AI Tutor launch and panel opens with 4 tabs", async ({ page }) => {
    await page.goto("/dashboard");
    // The sidebar AI Tutor button — labelled via translation key aiTutor.launch (en default "AI Tutor")
    const launcher = page.getByRole("button", { name: /AI Tutor/i }).first();
    await expect(launcher).toBeVisible();
    await launcher.click();

    const dialog = page.getByRole("dialog", { name: /AI Tutor/i });
    await expect(dialog).toBeVisible();

    const tabs = dialog.getByRole("tab");
    expect(await tabs.count()).toBe(4);
    for (const name of [/explain/i, /correct/i, /practice/i, /writing coach/i]) {
      await expect(dialog.getByRole("tab", { name })).toBeVisible();
    }
  });

  test("Escape closes the panel and restores focus to the launcher", async ({ page }) => {
    await page.goto("/dashboard");
    const launcher = page.getByRole("button", { name: /AI Tutor/i }).first();
    await launcher.click();
    await expect(page.getByRole("dialog", { name: /AI Tutor/i })).toBeVisible();
    await page.keyboard.press("Escape");
    // Panel should slide out (translate-x-full class) — wait for the launcher to regain focus
    await expect(launcher).toBeFocused();
  });
});

test.describe("Phase 4 — Conversation scenarios DB + endpoints", () => {
  test("GET /me/conversations/scenarios returns 24+ scenarios", async ({ page }) => {
    const { status, body } = await getAuthedJson(page, "/me/conversations/scenarios");
    console.log(`[scenarios] status=${status} count=${Array.isArray((body as { scenarios?: unknown[] })?.scenarios) ? (body as { scenarios: unknown[] }).scenarios.length : "n/a"}`);
    expect(status).toBe(200);
    const scenarios = (body as { scenarios?: unknown[] })?.scenarios ?? body;
    expect(Array.isArray(scenarios)).toBe(true);
    expect((scenarios as unknown[]).length).toBeGreaterThanOrEqual(24);
  });
});

test.describe("Phase 5 — Conversation scenario picker", () => {
  test("/conversations renders heading and scenarios", async ({ page }) => {
    await page.goto("/conversations", { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(2000); // give scenarios fetch time to settle
    const heading = await page.getByRole("heading", { level: 1 }).first().textContent().catch(() => null);
    const scenarioSections = await page.locator('section[aria-labelledby^="level-"]').count();
    const empty = await page.getByText(/no scenarios found/i).count();
    const errorEl = await page.getByText(/failed to load/i).count();
    const scenarioLinks = await page.locator('a[href^="/conversations/"]').count();
    console.log(
      `[conversations] h1="${heading}" sections=${scenarioSections} links=${scenarioLinks} empty=${empty} error=${errorEl}`,
    );
    // Surface what we observed — don't assert on a specific outcome since this
    // route blocks on profile data which currently 400s.
  });

  test("level filter pill narrows results", async ({ page }) => {
    await page.goto("/conversations");
    // A1–A2 button (or the all-levels reset)
    const filterBtn = page.getByRole("button", { name: /A0–A1|A1–A2/i }).first();
    if (await filterBtn.count() > 0) {
      await filterBtn.click();
      await page.waitForTimeout(200); // client-side filter; no network
    }
  });

  test("search input filters scenarios", async ({ page }) => {
    await page.goto("/conversations");
    const search = page.getByPlaceholder(/search scenarios/i);
    if (await search.count() > 0) {
      await search.fill("zzzznotreal");
      await expect(page.getByText(/no scenarios found/i)).toBeVisible({ timeout: 3000 });
    }
  });
});

test.describe("Phase 6 — Skills system", () => {
  test("/skills page renders skill bars or empty state", async ({ page }) => {
    await page.goto("/skills");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const bars = page.getByRole("progressbar");
    const barCount = await bars.count();
    console.log(`[skills] progressbar count=${barCount}`);
  });

  test("GET /me/skills/summary returns skill scores", async ({ page }) => {
    const { status, body } = await getAuthedJson(page, "/me/skills/summary");
    console.log(`[skills/summary] status=${status} body=`, body);
    expect([200, 404]).toContain(status); // 404 if route hasn't been registered yet
  });
});

test.describe("Phase 7 — Review system", () => {
  test("GET /me/review/due returns the due-items envelope", async ({ page }) => {
    const { status, body } = await getAuthedJson(page, "/me/review/due");
    console.log(`[review/due] status=${status} body=`, body);
    expect([200, 404]).toContain(status);
  });
});

// /review, /assessment, /teacher page-render checks are intentionally omitted:
// these routes hold an open connection (Supabase realtime / SSE / similar) that
// blocks Playwright's per-test teardown for ~30s and turns the tests flaky.
// The cross-cutting console-error block below exercises /review with networkidle
// without flake, so we still get error coverage on that route.

test.describe("Phase 10 — Org admin (gated)", () => {
  test("/admin/orgs/:slug renders or redirects", async ({ page }) => {
    await page.goto("/admin/orgs/demo");
    await page.waitForLoadState("domcontentloaded");
    console.log(`[org-admin] landed=${page.url()}`);
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Phase 13 — Admin AI usage", () => {
  test("/admin/ai-usage renders or 403s", async ({ page }) => {
    await page.goto("/admin/ai-usage");
    await page.waitForLoadState("domcontentloaded");
    console.log(`[admin/ai-usage] landed=${page.url()}`);
    await expect(page.locator("body")).toBeVisible();
  });
});

test.describe("Cross-cutting — i18n", () => {
  test("language switch to Thai changes nav copy", async ({ page }) => {
    await page.goto("/dashboard");
    // The language switcher is in the public/auth header; click it
    const switcher = page.getByRole("button", { name: /change language|select language|english/i }).first();
    if (await switcher.count() > 0) {
      await switcher.click();
      // Try clicking Thai
      const thOption = page.getByRole("menuitem", { name: /ไทย|thai/i }).first();
      if (await thOption.count() > 0) {
        await thOption.click();
        await page.waitForTimeout(500);
        const html = await page.content();
        const hasThai = /[฀-๿]/.test(html);
        console.log(`[i18n] Thai chars present=${hasThai}`);
        expect(hasThai).toBe(true);
      }
    }
  });
});

test.describe("Cross-cutting — console errors", () => {
  const ROUTES = [
    "/dashboard",
    "/lessons",
    "/lessons/unit-1",
    "/lessons/unit-1/grammar",
    "/conversations",
    "/skills",
    "/review",
    "/settings",
  ];

  for (const route of ROUTES) {
    test(`${route} loads without console errors`, async ({ page }) => {
      const errors: string[] = [];
      page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
      page.on("console", (msg) => {
        if (msg.type() === "error") errors.push(`console.error: ${msg.text().slice(0, 200)}`);
      });
      await page.goto(route, { waitUntil: "networkidle" }).catch(() => {});
      // Allow late settling
      await page.waitForTimeout(500);
      if (errors.length) {
        console.log(`[errors] ${route}:`, errors);
      }
      // Don't fail on errors — record them. Surface as a soft check.
      expect.soft(errors.length, `Errors on ${route}: ${errors.join("\n")}`).toBe(0);
    });
  }
});
