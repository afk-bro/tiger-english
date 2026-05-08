// scripts/generate-lesson-images.ts
// Author-time CLI that generates lesson illustrations via Leonardo and writes
// per-unit sidecar JSON. Reads backend/.env directly via dotenv. Never runs
// in the browser. See docs/superpowers/specs/2026-05-02-lesson-image-generation-design.md.

import { config as loadDotenv } from "dotenv";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createInterface } from "readline";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { computePromptHash, MODEL_ID, IMAGE_DIM } from "./lesson-image-config";
import { units } from "../src/features/lessons/data/units";
import { lookupSection } from "../src/features/lessons/data/sectionRegistry";
import { lookupExercise } from "../src/features/lessons/data/exerciseRegistry";
import { buildCandidates, type Candidate } from "./lib/lesson-image-candidates";
// Single bootstrap shared with getSection.ts so the section registration list
// has one source of truth.
import "../src/features/lessons/data/registerAllSections";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

loadDotenv({ path: resolve(REPO_ROOT, "backend/.env") });

type Args = {
  unit: string;
  item?: string;
  force: boolean;
  dryRun: boolean;
  yes: boolean;
  bail: boolean;
  allowFail: boolean;
};

function parseArgs(argv: string[]): Args {
  const out: Args = { unit: "", force: false, dryRun: false, yes: false, bail: false, allowFail: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--unit") out.unit = argv[++i];
    else if (a === "--item") out.item = argv[++i];
    else if (a === "--force") out.force = true;
    else if (a === "--dry-run") out.dryRun = true;
    else if (a === "--yes") out.yes = true;
    else if (a === "--bail") out.bail = true;
    else if (a === "--allow-fail") out.allowFail = true;
    else throw new Error(`Unknown argument: ${a}`);
  }
  if (!out.unit) throw new Error("Missing required --unit <slug>");
  return out;
}

function requireEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name} (expected in backend/.env)`);
  return v;
}

async function confirm(question: string): Promise<boolean> {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(/^y(es)?$/i.test(answer.trim()));
    });
  });
}

type SidecarEntry = { url: string; promptHash: string; model: string; generatedAt: string };
type Sidecar = Record<string, SidecarEntry>;

function readSidecar(unitSlug: string): Sidecar {
  const path = resolve(REPO_ROOT, `src/features/lessons/data/images/${unitSlug}.images.json`);
  if (!existsSync(path)) return {};
  return JSON.parse(readFileSync(path, "utf-8")) as Sidecar;
}

const LEONARDO_BASE = "https://cloud.leonardo.ai/api/rest/v1";

// Universal negative prompt — applied to every generation. Keeps text /
// captions / writing artifacts out of the output (Leonardo's models
// will happily inline garbled fake words on books, clocks, signs, etc.
// without this).
const NEGATIVE_PROMPT = "text, letters, words, writing, captions, numbers, watermark, signature";

async function leonardoStartGeneration(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch(`${LEONARDO_BASE}/generations`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      negative_prompt: NEGATIVE_PROMPT,
      modelId: MODEL_ID,
      width: IMAGE_DIM.width,
      height: IMAGE_DIM.height,
      num_images: 1,
    }),
  });
  if (!res.ok) throw new Error(`Leonardo start: ${res.status} ${await res.text()}`);
  const body = await res.json() as { sdGenerationJob?: { generationId: string } };
  const id = body.sdGenerationJob?.generationId;
  if (!id) throw new Error(`Leonardo start: no generationId in response`);
  return id;
}

type CompletedGeneration = { url: string; imageId: string };

async function leonardoPoll(id: string, apiKey: string, timeoutMs = 60000): Promise<CompletedGeneration> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, 2000));
    const res = await fetch(`${LEONARDO_BASE}/generations/${id}`, {
      headers: { "Authorization": `Bearer ${apiKey}` },
    });
    if (!res.ok) throw new Error(`Leonardo poll: ${res.status}`);
    const body = await res.json() as { generations_by_pk?: { status: string; generated_images: { id: string; url: string }[] } };
    const gen = body.generations_by_pk;
    if (gen?.status === "COMPLETE") {
      const first = gen.generated_images[0];
      if (!first?.url || !first?.id) throw new Error(`Leonardo poll: no image url/id`);
      return { url: first.url, imageId: first.id };
    }
    if (gen?.status === "FAILED") throw new Error(`Leonardo poll: status FAILED`);
  }
  throw new Error(`Leonardo poll: timeout after ${timeoutMs}ms`);
}

// Background-removal post-processing via Leonardo's /variations/nobg
// endpoint. Costs ~5 credits per image on top of the ~2 for the
// original generation, but the resulting RGBA PNG drops the solid
// backdrop the model would otherwise paint, which makes lesson
// thumbnails composite cleanly onto any tile color.
async function leonardoStartNobg(imageId: string, apiKey: string): Promise<string> {
  const res = await fetch(`${LEONARDO_BASE}/variations/nobg`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ id: imageId }),
  });
  if (!res.ok) throw new Error(`Leonardo nobg start: ${res.status} ${await res.text()}`);
  const body = await res.json() as { sdNobgJob?: { id: string } };
  const id = body.sdNobgJob?.id;
  if (!id) throw new Error(`Leonardo nobg start: no job id in response`);
  return id;
}

async function leonardoPollNobg(jobId: string, apiKey: string, timeoutMs = 90000): Promise<string> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, 2000));
    const res = await fetch(`${LEONARDO_BASE}/variations/${jobId}`, {
      headers: { "Authorization": `Bearer ${apiKey}` },
    });
    if (!res.ok) throw new Error(`Leonardo nobg poll: ${res.status}`);
    // Response shape:
    //   { generated_image_variation_generic: [{ url, status, ... }] }
    const body = await res.json() as {
      generated_image_variation_generic?: { url: string; status: string }[];
    };
    const variation = body.generated_image_variation_generic?.[0];
    if (variation?.status === "COMPLETE") {
      if (!variation.url) throw new Error(`Leonardo nobg poll: no url`);
      return variation.url;
    }
    if (variation?.status === "FAILED") throw new Error(`Leonardo nobg poll: status FAILED`);
  }
  throw new Error(`Leonardo nobg poll: timeout after ${timeoutMs}ms`);
}

async function withRetry<T>(fn: () => Promise<T>, attempts = 3): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try { return await fn(); }
    catch (e) {
      lastErr = e;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, i)));
    }
  }
  throw lastErr;
}

async function uploadToStorage(supabase: SupabaseClient, unitSlug: string, key: string, bytes: Buffer): Promise<string> {
  // Object names can include only [a-zA-Z0-9_\-./]; sidecar keys may contain ":".
  const safeKey = key.replace(/[^a-zA-Z0-9_-]/g, "_");
  const path = `${unitSlug}/${safeKey}.png`;
  const { error } = await supabase.storage.from("lesson-images").upload(path, bytes, {
    contentType: "image/png",
    upsert: true,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("lesson-images").getPublicUrl(path);
  return data.publicUrl;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));

  console.log(`[lesson-images] unit=${args.unit} dryRun=${args.dryRun} force=${args.force}`);

  const unit = units.find((u) => u.slug === args.unit);
  if (!unit) throw new Error(`Unit not found: ${args.unit}`);
  let candidates = buildCandidates({ unit, lookupSection, lookupExercise });
  if (args.item) {
    candidates = candidates.filter((c) => c.id === args.item);
    if (candidates.length === 0) {
      throw new Error(`No image-eligible item with id ${args.item} in ${args.unit}`);
    }
  }

  const sidecar = readSidecar(args.unit);
  const toGenerate: Candidate[] = [];
  const skipped: Candidate[] = [];
  for (const cand of candidates) {
    const hash = computePromptHash(cand.prompt);
    const entry = sidecar[cand.id];
    if (!args.force && entry && entry.promptHash === hash) {
      skipped.push(cand);
    } else {
      toGenerate.push(cand);
    }
  }

  console.log(`[lesson-images] plan: generate=${toGenerate.length} skip=${skipped.length}`);
  for (const cand of toGenerate) console.log(`  + ${cand.kind} ${cand.id}`);
  for (const cand of skipped) console.log(`  ↷ ${cand.kind} ${cand.id} (unchanged)`);

  if (args.dryRun) {
    console.log("[lesson-images] DRY RUN — no API calls, no writes. Exiting.");
    return;
  }

  // Only require secrets when actually generating — keeps dry-run usable on
  // machines/CI where these are intentionally absent.
  const env = {
    leonardoKey: requireEnv("LEONARDO_API_KEY"),
    supabaseUrl: requireEnv("SUPABASE_URL"),
    supabaseSecretKey: requireEnv("SUPABASE_SECRET_KEY"),
  };

  // Per-image cost = generation (~$0.04) + nobg variation (~$0.10).
  // Real spend may differ; this is just a heads-up before confirm.
  const costPerImage = 0.14;
  const estimated = (toGenerate.length * costPerImage).toFixed(2);
  console.log(`[lesson-images] ${toGenerate.length} images to generate (estimated $${estimated} at $${costPerImage}/image, includes nobg)`);

  if (!args.yes && toGenerate.length > 0) {
    const ok = await confirm("Continue? [y/N] ");
    if (!ok) {
      console.log("[lesson-images] Aborted.");
      return;
    }
  }

  const supabase = createClient(env.supabaseUrl, env.supabaseSecretKey);
  const failed: { id: string; error: string }[] = [];

  for (const cand of toGenerate) {
    try {
      // 1. Start generation
      const id = await withRetry(() => leonardoStartGeneration(cand.prompt, env.leonardoKey));
      // 2. Poll for the source image (returns url + image id we feed to nobg)
      const { imageId } = await withRetry(() => leonardoPoll(id, env.leonardoKey));
      // 3. Strip the background — produces an RGBA PNG.
      const nobgJobId = await withRetry(() => leonardoStartNobg(imageId, env.leonardoKey));
      const nobgUrl = await withRetry(() => leonardoPollNobg(nobgJobId, env.leonardoKey));
      const downloadRes = await fetch(nobgUrl);
      if (!downloadRes.ok) {
        throw new Error(`Leonardo CDN download failed: ${downloadRes.status} ${downloadRes.statusText}`);
      }
      const pngBytes = Buffer.from(await downloadRes.arrayBuffer());
      const publicUrl = await withRetry(() => uploadToStorage(supabase, args.unit, cand.id, pngBytes));
      sidecar[cand.id] = {
        url: publicUrl,
        promptHash: computePromptHash(cand.prompt),
        model: MODEL_ID,
        generatedAt: new Date().toISOString(),
      };
      console.log(`✓ ${cand.kind} ${cand.id}`);
    } catch (e) {
      failed.push({ id: cand.id, error: (e as Error).message });
      console.error(`✗ ${cand.kind} ${cand.id}: ${(e as Error).message}`);
      if (args.bail) break;
    }
  }

  const sidecarPath = resolve(REPO_ROOT, `src/features/lessons/data/images/${args.unit}.images.json`);
  writeFileSync(sidecarPath, JSON.stringify(sidecar, null, 2) + "\n");
  console.log(`[lesson-images] Wrote ${sidecarPath}`);
  console.log(`[lesson-images] generated=${toGenerate.length - failed.length} skipped=${skipped.length} failed=${failed.length}`);
  if (failed.length > 0 && !args.allowFail) process.exit(1);
}

main().catch((err) => {
  console.error(`[lesson-images] FATAL: ${err.message}`);
  process.exit(1);
});
