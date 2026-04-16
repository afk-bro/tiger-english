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

  test("renders 4 unit cards with Unit 1 available and Units 2-4 coming soon", async ({
    page,
  }) => {
    await page.goto("/lessons");
    await expect(
      page.getByRole("link", { name: /To Be: Introduction/ }),
    ).toBeVisible();
    await expect(page.getByText("Available")).toHaveCount(1);
    await expect(page.getByText("Coming soon")).toHaveCount(3);
  });

  test("coming-soon cards are disabled divs, not navigable links", async ({
    page,
  }) => {
    await page.goto("/lessons");
    await expect(
      page.getByRole("link", { name: /To Be: Yes\/No Questions/ }),
    ).toHaveCount(0);
    const unit2Card = page
      .locator("[aria-disabled='true']")
      .filter({ hasText: "To Be: Yes/No Questions" });
    await expect(unit2Card).toBeVisible();
  });

  // ── UnitHub ────────────────────────────────────────────────────────────────

  test("Unit 1 hub shows sections with Start Unit CTA", async ({ page }) => {
    await page.goto("/lessons/unit-1");
    await expect(
      page.getByRole("heading", { level: 1, name: /Unit 1.*To Be: Introduction/ }),
    ).toBeVisible();

    // All 5 section cards visible
    for (const section of ["Overview", "Grammar", "Vocabulary", "Dialogues", "Activities"]) {
      await expect(page.getByText(section)).toBeVisible();
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
    await page.goto("/lessons/unit-2");
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
    await expect(page.getByText("hello")).toBeVisible();
    await expect(page.getByText("Tap to reveal").first()).toBeVisible();
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
    await expect(page.getByPlaceholder("...")).toBeVisible();
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

    // activities → back to unit (last section, nav button not header link)
    await page.getByRole("link", { name: "Back to Unit", exact: true }).click();
    await expect(page).toHaveURL("/lessons/unit-1");
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
    await page.goto("/lessons/unit-2/overview");
    await expect(
      page.getByText(/This unit isn.?t ready yet/),
    ).toBeVisible();
  });
});
