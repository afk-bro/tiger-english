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

import { computePromptHash, templateVocabPrompt, MODEL_ID, IMAGE_DIM } from "./lesson-image-config";
import { units } from "../src/features/lessons/data/units";
import { lookupSection } from "../src/features/lessons/data/sectionRegistry";
import { sidecarKeyForUnit, sidecarKeyForSection } from "../src/features/lessons/data/imageHydration";
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

type Candidate = {
  kind: "unit" | "section" | "vocab" | "dialogue" | "exercise";
  id: string;
  prompt: string;
};

function buildCandidates(unitSlug: string): Candidate[] {
  const unit = units.find((u) => u.slug === unitSlug);
  if (!unit) throw new Error(`Unit not found: ${unitSlug}`);
  const out: Candidate[] = [];

  if (unit.imagePrompt) {
    out.push({ kind: "unit", id: sidecarKeyForUnit(), prompt: unit.imagePrompt });
  }

  for (const meta of unit.sections) {
    const section = lookupSection(unitSlug, meta.key);
    if (!section) continue;
    if (section.imagePrompt) {
      out.push({ kind: "section", id: sidecarKeyForSection(section.key), prompt: section.imagePrompt });
    }
    for (const block of section.blocks) {
      if (block.type === "vocab-list") {
        for (const item of block.items) {
          const prompt = item.imagePrompt ?? templateVocabPrompt(item.word);
          out.push({ kind: "vocab", id: item.id, prompt });
        }
      } else if (block.type === "dialogue" && block.imagePrompt) {
        out.push({ kind: "dialogue", id: block.id, prompt: block.imagePrompt });
      } else if (block.type === "exercise" && block.imagePrompt) {
        out.push({ kind: "exercise", id: block.id, prompt: block.imagePrompt });
      }
    }
  }

  return out;
}

type SidecarEntry = { url: string; promptHash: string; model: string; generatedAt: string };
type Sidecar = Record<string, SidecarEntry>;

function readSidecar(unitSlug: string): Sidecar {
  const path = resolve(REPO_ROOT, `src/features/lessons/data/images/${unitSlug}.images.json`);
  if (!existsSync(path)) return {};
  return JSON.parse(readFileSync(path, "utf-8")) as Sidecar;
}

const LEONARDO_BASE = "https://cloud.leonardo.ai/api/rest/v1";

async function leonardoStartGeneration(prompt: string, apiKey: string): Promise<string> {
  const res = await fetch(`${LEONARDO_BASE}/generations`, {
    method: "POST",
    headers: { "Authorization": `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
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

async function leonardoPoll(id: string, apiKey: string, timeoutMs = 60000): Promise<string> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    await new Promise((r) => setTimeout(r, 2000));
    const res = await fetch(`${LEONARDO_BASE}/generations/${id}`, {
      headers: { "Authorization": `Bearer ${apiKey}` },
    });
    if (!res.ok) throw new Error(`Leonardo poll: ${res.status}`);
    const body = await res.json() as { generations_by_pk?: { status: string; generated_images: { url: string }[] } };
    const gen = body.generations_by_pk;
    if (gen?.status === "COMPLETE") {
      const url = gen.generated_images[0]?.url;
      if (!url) throw new Error(`Leonardo poll: no image url`);
      return url;
    }
    if (gen?.status === "FAILED") throw new Error(`Leonardo poll: status FAILED`);
  }
  throw new Error(`Leonardo poll: timeout after ${timeoutMs}ms`);
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

  let candidates = buildCandidates(args.unit);
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
    supabaseServiceKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  };

  const costPerImage = 0.04;
  const estimated = (toGenerate.length * costPerImage).toFixed(2);
  console.log(`[lesson-images] ${toGenerate.length} images to generate (estimated $${estimated} at $${costPerImage}/image)`);

  if (!args.yes && toGenerate.length > 0) {
    const ok = await confirm("Continue? [y/N] ");
    if (!ok) {
      console.log("[lesson-images] Aborted.");
      return;
    }
  }

  const supabase = createClient(env.supabaseUrl, env.supabaseServiceKey);
  const failed: { id: string; error: string }[] = [];

  for (const cand of toGenerate) {
    try {
      const id = await withRetry(() => leonardoStartGeneration(cand.prompt, env.leonardoKey));
      const leonardoUrl = await withRetry(() => leonardoPoll(id, env.leonardoKey));
      const downloadRes = await fetch(leonardoUrl);
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
