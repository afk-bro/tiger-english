// e2e/lessons.spec.ts
import { test, expect } from "@playwright/test";

test.describe("Lessons area", () => {
  // ── LessonsIndex ──────────────────────────────────────────────────────────

  test("sidebar link navigates to /lessons and shows the list page", async ({
    page,
  }) => {
    await page.goto("/home");
    await page.getByRole("link", { name: "Lessons" }).first().click();
    await expect(page).toHaveURL("/lessons");
    await expect(
      page.getByRole("heading", { level: 1, name: "Lessons" }),
    ).toBeVisible();
  });

  test("renders the 44-unit curriculum with 2 available and 42 coming soon", async ({
    page,
  }) => {
    await page.goto("/lessons");
    // Both seeded units are available. Use .first() because the assigned-rail
    // can also link to unit-1 with the same accessible name.
    await expect(
      page.getByRole("link", { name: /To Be: Introduction/ }).first(),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /To Be \+ Location/ }).first(),
    ).toBeVisible();
    // Status badge totals reflect the curriculum: 2 available, 42 coming soon
    await expect(page.getByText("Available")).toHaveCount(2);
    await expect(page.getByText("Coming soon")).toHaveCount(42);
    // CEFR grouping: A1 + A2 sections both render
    await expect(page.getByRole("region", { name: /A1/i })).toBeVisible();
    await expect(page.getByRole("region", { name: /A2/i })).toBeVisible();
  });

  test("coming-soon cards are disabled divs, not navigable links", async ({
    page,
  }) => {
    await page.goto("/lessons");
    // unit-3 is the first coming-soon stub ("Greetings & Saying Goodbye")
    await expect(
      page.getByRole("link", { name: /Greetings & Saying Goodbye/ }),
    ).toHaveCount(0);
    const unit3Card = page
      .locator("[aria-disabled='true']")
      .filter({ hasText: "Greetings & Saying Goodbye" });
    await expect(unit3Card).toBeVisible();
  });

  // ── UnitHub ────────────────────────────────────────────────────────────────

  test("Unit 1 hub shows sections with Start Unit CTA", async ({ page }) => {
    await page.goto("/lessons/unit-1");
    await expect(
      page.getByRole("heading", { level: 1, name: /Unit 1.*To Be: Introduction/ }),
    ).toBeVisible();

    // All 5 section cards visible. Each section is a link — anchor by role
    // so we don't collide with the AI Tutor panel's "Ask a grammar..." copy.
    for (const section of ["Overview", "Grammar", "Vocabulary", "Dialogues", "Activities"]) {
      await expect(
        page.getByRole("link", { name: new RegExp(section, "i") }).first(),
      ).toBeVisible();
    }

    // Start Unit CTA
    await expect(
      page.getByRole("button", { name: /Start Unit/i }),
    ).toBeVisible();
  });

  test("Start Unit navigates to overview section", async ({ page }) => {
    await page.goto("/lessons/unit-1");
    await page.getByRole("button", { name: /Start Unit/i }).click();
    await expect(page).toHaveURL("/lessons/unit-1/overview");
  });

  test("coming-soon unit hub shows placeholder message", async ({ page }) => {
    // unit-3 is a coming-soon stub; unit-2 is now available.
    await page.goto("/lessons/unit-3");
    await expect(
      page.getByText(/This unit isn.?t ready yet/),
    ).toBeVisible();
  });

  test("unknown unit slug shows not-found with back link", async ({ page }) => {
    await page.goto("/lessons/unit-99");
    await expect(
      page.getByRole("heading", { level: 1, name: /not found/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Back to lessons/i }),
    ).toBeVisible();
  });

  // ── SectionPage ────────────────────────────────────────────────────────────

  test("overview section renders real content", async ({ page }) => {
    await page.goto("/lessons/unit-1/overview");
    await expect(page.getByText("What you'll learn")).toBeVisible();
    await expect(
      page.getByText(/introduce yourself/),
    ).toBeVisible();
    // Back link to unit hub
    await expect(
      page.getByRole("link", { name: /Back to unit/i }),
    ).toBeVisible();
  });

  test("vocabulary section renders vocab cards", async ({ page }) => {
    await page.goto("/lessons/unit-1/vocabulary");
    // Default test language is English — English-only mode shows the English word on front
    await expect(page.getByText("hello")).toBeVisible();
    await expect(page.getByText("Reveal answer").first()).toBeVisible();
  });

  test("grammar section renders MCQ exercise", async ({ page }) => {
    await page.goto("/lessons/unit-1/grammar");
    await expect(
      page.getByText(/Choose the correct form/),
    ).toBeVisible();
    // Click correct answer
    await page.getByRole("button", { name: "is" }).click();
    await expect(page.getByText("Correct!")).toBeVisible();
  });

  test("activities section renders fill-blank exercise", async ({ page }) => {
    await page.goto("/lessons/unit-1/activities");
    // Multiple fill-blanks per the activities section; just assert at least one.
    await expect(page.getByPlaceholder("...").first()).toBeVisible();
  });

  test("prev/next navigation works through all sections", async ({ page }) => {
    await page.goto("/lessons/unit-1/overview");

    // overview → grammar
    await page.getByRole("link", { name: /Next/i }).click();
    await expect(page).toHaveURL("/lessons/unit-1/grammar");

    // grammar → vocabulary
    await page.getByRole("link", { name: /Next/i }).click();
    await expect(page).toHaveURL("/lessons/unit-1/vocabulary");

    // vocabulary → dialogues
    await page.getByRole("link", { name: /Next/i }).click();
    await expect(page).toHaveURL("/lessons/unit-1/dialogues");

    // dialogues → activities
    await page.getByRole("link", { name: /Next/i }).click();
    await expect(page).toHaveURL("/lessons/unit-1/activities");

    // activities is the last section; because unit-2 is now also available,
    // the section nav at the bottom renders a "Next: Unit 2 — …" continue
    // CTA instead of a "Back to Unit" fallback. Clicking it should land on
    // unit-2's overview.
    await page.getByRole("link", { name: /Next:.*Unit 2/i }).click();
    await expect(page).toHaveURL("/lessons/unit-2/overview");
  });

  test("mark as complete toggles section completion", async ({ page }) => {
    await page.goto("/lessons/unit-1/overview");
    await page.getByRole("button", { name: /Mark as Complete/i }).click();
    await expect(
      page.getByRole("button", { name: /Completed/i }),
    ).toBeVisible();

    // Toggle back
    await page.getByRole("button", { name: /Completed/i }).click();
    await expect(
      page.getByRole("button", { name: /Mark as Complete/i }),
    ).toBeVisible();
  });

  test("invalid section key shows section not-found", async ({ page }) => {
    await page.goto("/lessons/unit-1/invalid-section");
    await expect(
      page.getByRole("heading", { level: 1, name: /not found/i }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Back to unit/i }),
    ).toBeVisible();
  });

  test("coming-soon unit section URL shows coming-soon message", async ({
    page,
  }) => {
    await page.goto("/lessons/unit-3/overview");
    await expect(
      page.getByText(/This unit isn.?t ready yet/),
    ).toBeVisible();
  });
});
