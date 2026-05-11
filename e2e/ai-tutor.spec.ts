/**
 * AI Tutor end-to-end coverage.
 *
 * Strategy
 * --------
 * Real Groq STT is undesirable in CI: slow, costs money, network-dependent.
 * Backend already has a `StubSTTProvider` (canned text). The trick is that
 * each turn in a tutor session needs a *different* scripted transcript
 * (introduce → ask how → say where → ask what doing).
 *
 * We solve this with a per-request header. The backend `_get_stt(request)`
 * reads `X-Test-Stub-Transcript` when `STT_PROVIDER=stub` AND env != prod;
 * this spec uses `page.route(...)` to inject the header on every POST to
 * `/turns`. The recorded audio blob from Chrome's fake media device is
 * silent — only the header value reaches the language pipeline.
 *
 * Required env (set on the dev server / backend, NOT in test code):
 *   Frontend (.env.local):  VITE_AI_TUTOR_ENABLED=true
 *                           VITE_API_BASE_URL=http://localhost:8000/api/v1
 *   Backend:                AI_TUTOR_ENABLED=true STT_PROVIDER=stub
 *   ENVIRONMENT:            != "production" (the header guard's other half)
 *
 * Chrome flags `--use-fake-ui-for-media-stream` and
 * `--use-fake-device-for-media-stream` are set in playwright.config.ts so
 * getUserMedia({audio: true}) resolves with a synthetic silent stream — no
 * physical mic required.
 */
import { test, expect, type Page, type Route } from '@playwright/test';

/**
 * Production-backend API base used by every other spec via the project's
 * `VITE_API_BASE_URL`. We redirect all AI tutor calls AWAY from this to a
 * local FastAPI instance, because only the local backend has
 * `STT_PROVIDER=stub` set and only it honours the
 * `X-Test-Stub-Transcript` test-mode header. Keeping the override local
 * to this spec means we don't disturb the production-backed phases-walkthrough
 * suite.
 */
const LOCAL_API_BASE = 'http://localhost:8000/api/v1';

/**
 * Rewrite all AI-tutor endpoints to the local FastAPI instance.
 *
 * The Vite dev server has `VITE_API_BASE_URL` pointing at the deployed
 * Railway backend (see `.env`). Without this redirect, every AI Tutor
 * fetch in this spec would hit production — where the stub STT provider
 * is not enabled and the `X-Test-Stub-Transcript` header is ignored. We
 * match by path so both the production hostname and any other prefix
 * route through.
 */
async function redirectAiTutorToLocal(page: Page): Promise<void> {
  await page.route(
    (url) =>
      /\/api\/v1\/(ai-tutor|me\/ai-tutor)\b/.test(url.pathname) &&
      url.origin !== new URL(LOCAL_API_BASE).origin,
    async (route: Route) => {
      try {
        const original = new URL(route.request().url());
        const rewritten = `${LOCAL_API_BASE}${original.pathname.replace('/api/v1', '')}${original.search}`;
        const response = await route.fetch({ url: rewritten });
        const body = await response.body();
        await route.fulfill({ response, body });
      } catch {
        // Swallow errors from routes still firing after the page has
        // navigated away or the test has finished. Playwright otherwise
        // surfaces these as spurious failures unrelated to the assertion.
      }
    },
  );
}

/**
 * Helper: rewrite every POST to /turns so it carries an
 * X-Test-Stub-Transcript header. Setting it again replaces the prior route
 * handler (Playwright matches the last-registered route first), so callers
 * can call this multiple times in a single test to "script" each turn.
 */
async function scriptTranscript(page: Page, transcript: string): Promise<void> {
  // Match by pathname so this works regardless of which API origin the
  // dev server is currently configured for (production Railway via .env,
  // or anything else). The handler always redirects to LOCAL_API_BASE
  // before forwarding the request, because only the local backend has
  // the stub STT + X-Test-Stub-Transcript header behavior wired.
  const matcher = (url: URL) =>
    /\/api\/v1\/me\/ai-tutor\/sessions\/[^/]+\/turns$/.test(url.pathname);
  await page.unroute(matcher);
  await page.route(matcher, async (route: Route) => {
    try {
    // HTTP headers are ASCII-only by spec; Vietnamese phrases like
    // "kết thúc bài học" would otherwise raise "Invalid character in
    // header content" from `route.continue`. URL-encode here and let
    // the backend's `_get_stt` percent-decode before constructing the
    // StubSTTProvider.
    //
    // We `fetch` + `fulfill` (rather than `continue`) because the small
    // extra round-trip gives React time to commit `setBlob` from the
    // recorder's async `onstop` callback before the response arrives —
    // empirically this makes the subsequent state machine transition
    // (processing → end_lesson_confirm / ai_speaking) settle in a
    // single render cycle. With raw `route.continue` the modal can
    // race with state updates and the spec sees the wrong snapshot.
    const original = new URL(route.request().url());
    const rewritten = `${LOCAL_API_BASE}${original.pathname.replace('/api/v1', '')}${original.search}`;
    const headers = {
      ...route.request().headers(),
      'x-test-stub-transcript': encodeURIComponent(transcript),
    };
    const response = await route.fetch({ url: rewritten, headers });
    const body = await response.body();
    await route.fulfill({ response, body });
    } catch {
      // Tolerate post-test in-flight route firings, mirroring the
      // redirect helper above.
    }
  });
}

/**
 * Drive a single "speak → submit" turn. The recording panel goes
 * idle → recording (Speak now) → submit. We wait briefly after Speak now
 * for MediaRecorder to spin up against the fake device so the resulting
 * blob is non-empty.
 *
 * Submit is a single click now that `handleSubmitRecording` awaits
 * `mic.stop()` (which resolves only after MediaRecorder.onstop fires), so
 * there's no longer a stale-closure window where the first click no-ops.
 */
async function speakAndSubmit(page: Page, transcript: string): Promise<void> {
  await scriptTranscript(page, transcript);
  // Idle button — could be off-screen on small viewports; force-click it.
  const speakBtn = page.getByRole('button', { name: /Speak now/i });
  await expect(speakBtn).toBeEnabled({ timeout: 10_000 });
  await speakBtn.click();
  // Wait for the recording UI (Submit button appears) AND give MediaRecorder
  // enough time to actually emit a non-empty chunk against the fake device.
  const submitBtn = page.getByRole('button', { name: /^Submit$/i });
  await expect(submitBtn).toBeVisible({ timeout: 5_000 });
  await page.waitForTimeout(1200);
  await submitBtn.click();
}

test.describe('AI Tutor', () => {
  // Tests in this file mutate per-user tutor session state on the shared
  // tester account. The `ai_tutor_sessions` table has a unique partial
  // index on (user_id, scenario_slug) WHERE status='active', so two tests
  // starting a session in parallel collide on insert and the loser sees
  // 409 Conflict on /turns. Running serially keeps each session uniquely
  // active; the suite is small enough that loss of parallelism is
  // acceptable.
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page, context }) => {
    // Even with the fake-ui flag, explicitly grant permissions so the
    // permission-state observer in useMicRecorder doesn't take the
    // "denied" branch and fire a mic.denied event before recording starts.
    await context.grantPermissions(['microphone'], {
      origin: 'http://localhost:5173',
    });
    // Force all AI tutor API calls onto the local FastAPI backend
    // regardless of what `VITE_API_BASE_URL` is set to. Playwright's
    // last-registered-route-wins ordering means `scriptTranscript`'s
    // more-specific /turns matcher takes precedence when needed.
    await redirectAiTutorToLocal(page);
  });

  test('home → phrasebook → briefing flow renders seeded content', async ({
    page,
  }) => {
    await page.goto('/ai-tutor');

    // The seeded "Meeting someone new" scenario is the only / featured one.
    await expect(page.getByText(/Gặp người mới/)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText('Meeting someone new')).toBeVisible();
    // Featured card carries the Free pill.
    await expect(page.getByText(/^Free$/)).toBeVisible();

    // Start → phrasebook.
    await page.getByRole('link', { name: /^Start$/ }).click();
    await expect(page).toHaveURL(/\/phrasebook$/);
    await expect(
      page.getByText(/Useful phrases for this conversation/i),
    ).toBeVisible();
    // Spot-check a couple of seeded phrases.
    await expect(page.getByText('Hi, nice to meet you.')).toBeVisible();
    await expect(page.getByText('Where are you from?')).toBeVisible();

    // Next → briefing.
    await page.getByRole('link', { name: /^Next$/i }).click();
    await expect(page).toHaveURL(/\/briefing$/);
    await expect(page.getByText(/Mục tiêu:/)).toBeVisible();
    await expect(page.getByText(/Giới thiệu bản thân/)).toBeVisible();
  });

  test('first task accept-pattern match advances + end-lesson confirm → lesson_complete', async ({
    page,
  }) => {
    // Scope: shortest happy path — first task matches, AI advance-line
    // renders, then we early-end via "end lesson" → modal → finish →
    // LessonCompleteScreen. The full 4-task walkthrough is exercised in
    // the next test.
    await page.goto('/ai-tutor/scenarios/meeting-someone-new/briefing');

    const startCta = page
      .getByRole('button', { name: /^(Start lesson|Start fresh)$/i })
      .first();
    await expect(startCta).toBeVisible({ timeout: 15_000 });
    await startCta.click();
    await expect(page).toHaveURL(/\/session\//, { timeout: 15_000 });
    await expect(page.getByText(/Tasks:\s*0\s*\/\s*4 completed/)).toBeVisible({
      timeout: 15_000,
    });

    // Turn 1: introduce_self matches "my name is" → AI advance line
    // "Nice to meet you! How are you today?".
    await speakAndSubmit(page, 'my name is Tom');
    await expect(page.getByText(/How are you today/i)).toBeVisible({
      timeout: 15_000,
    });

    // Turn 2: end-lesson trigger (English) — end_lesson_detected runs
    // BEFORE evaluation so it works regardless of current task pointer.
    await speakAndSubmit(page, 'end lesson');
    await expect(page.getByText(/Finish lesson\?/i)).toBeVisible({
      timeout: 15_000,
    });
    await page.getByRole('button', { name: /^End lesson$/i }).click();

    // Lesson-complete screen renders xp + nav buttons.
    await expect(page.getByText(/Lesson finished/i)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/XP/)).toBeVisible();
    await expect(
      page.getByRole('button', { name: /^Continue$/i }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /View dashboard/i }),
    ).toBeVisible();
  });

  test('full session: 4 task progressions → wrap-up → end-lesson confirm → lesson_complete', async ({
    page,
  }) => {
    // Drives all four tasks for `meeting-someone-new`, then triggers the
    // end-lesson detector after the wrap-up line. Exercises the
    // current_task_id advance logic (each turn must evaluate against the
    // currently-pointed task, not the initial one).
    await page.goto('/ai-tutor/scenarios/meeting-someone-new/briefing');
    const startCta = page
      .getByRole('button', { name: /^(Start lesson|Start fresh)$/i })
      .first();
    await expect(startCta).toBeVisible({ timeout: 15_000 });
    await startCta.click();
    await expect(page).toHaveURL(/\/session\//, { timeout: 15_000 });
    await expect(page.getByText(/Tasks:\s*0\s*\/\s*4 completed/)).toBeVisible({
      timeout: 15_000,
    });

    // Turn 1: introduce_self → AI advance line.
    await speakAndSubmit(page, 'my name is Tom');
    await expect(page.getByText(/How are you today/i)).toBeVisible({
      timeout: 15_000,
    });

    // Turn 2: ask_how_are_you → AI asks where from.
    await speakAndSubmit(page, 'how are you');
    await expect(page.getByText(/Where are you from/i)).toBeVisible({
      timeout: 15_000,
    });

    // Turn 3: say_where_from → AI asks what doing today.
    await speakAndSubmit(page, "I'm from Vietnam");
    await expect(page.getByText(/What are you doing today/i)).toBeVisible({
      timeout: 15_000,
    });

    // Turn 4: ask_what_doing_today → wrap-up line.
    await speakAndSubmit(page, 'what are you doing today');
    await expect(
      page.getByText(/Great job.*really nice chat/i),
    ).toBeVisible({ timeout: 15_000 });

    // The wrap-up line itself contains "end here" — say "end lesson" to
    // open the finish modal.
    await speakAndSubmit(page, 'end lesson');
    await expect(page.getByText(/Finish lesson\?/i)).toBeVisible({
      timeout: 15_000,
    });
    await page.getByRole('button', { name: /^End lesson$/i }).click();

    // Lesson complete.
    await expect(page.getByText(/Lesson finished/i)).toBeVisible({
      timeout: 15_000,
    });
    await expect(page.getByText(/XP/)).toBeVisible();
    await expect(
      page.getByRole('button', { name: /^Continue$/i }),
    ).toBeVisible();
  });

  test('Vietnamese end-lesson phrase + dismiss returns to recording', async ({
    page,
  }) => {
    await page.goto('/ai-tutor/scenarios/meeting-someone-new/briefing');
    const startCta = page
      .getByRole('button', { name: /^(Start lesson|Start fresh)$/i })
      .first();
    await expect(startCta).toBeVisible({ timeout: 15_000 });
    await startCta.click();
    await expect(page).toHaveURL(/\/session\//, { timeout: 15_000 });

    // Vietnamese end-lesson trigger — distinct path through the evaluator.
    await speakAndSubmit(page, 'kết thúc bài học');
    await expect(page.getByText(/Finish lesson\?/i)).toBeVisible({
      timeout: 15_000,
    });

    // Dismiss returns to the recording flow.
    await page
      .getByRole('button', { name: /Continue practicing/i })
      .click();
    await expect(page.getByText(/Finish lesson\?/i)).not.toBeVisible();
    await expect(
      page.getByRole('button', { name: /Speak now/i }),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('footer nav Review + Challenge open ComingSoon sheets', async ({
    page,
  }) => {
    await page.goto('/ai-tutor');

    // Review item — bottom-nav button (not a link) → ComingSoonSheet.
    await page.getByRole('button', { name: /^Review$/i }).first().click();
    await expect(
      page.getByText(/Speech review coming soon/i),
    ).toBeVisible();
    // Each sheet renders a "Got it" close affordance.
    await page.getByRole('button', { name: /Got it/i }).click();
    await expect(
      page.getByText(/Speech review coming soon/i),
    ).not.toBeVisible();

    // Challenge item.
    await page.getByRole('button', { name: /^Challenge$/i }).first().click();
    await expect(
      page.getByText(/Challenge mode coming soon/i),
    ).toBeVisible();
  });
});
