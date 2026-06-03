// scripts/generate-lesson-images.ts
// Author-time CLI that resolves lesson illustrations via Iconify + Pixabay and
// writes per-unit sidecar JSON. Reads backend/.env directly via dotenv. Never
// runs in the browser. See docs/superpowers/specs/2026-05-02-lesson-image-generation-design.md.

import { config as loadDotenv } from "dotenv";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { createInterface } from "readline";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import { resolveIcon, makeIconifyFetchers } from "./lib/icon-resolver";
import { resolvePhoto, makePixabayFetchers } from "./lib/photo-resolver";
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

type SidecarEntry = {
  url: string;
  source: "icon" | "photo";
  ref: string; // icon name (the query that resolved) or photo query
  generatedAt: string;
};
type Sidecar = Record<string, SidecarEntry>;

function readSidecar(unitSlug: string): Sidecar {
  const path = resolve(REPO_ROOT, `src/features/lessons/data/images/${unitSlug}.images.json`);
  if (!existsSync(path)) return {};
  return JSON.parse(readFileSync(path, "utf-8")) as Sidecar;
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
  const noQuery: Candidate[] = [];
  for (const cand of candidates) {
    if (!cand.query) { noQuery.push(cand); continue; }
    if (!args.force && sidecar[cand.id]?.url) skipped.push(cand);
    else toGenerate.push(cand);
  }

  console.log(`[lesson-images] plan: resolve=${toGenerate.length} skip=${skipped.length} no-query=${noQuery.length}`);
  for (const c of toGenerate) console.log(`  + ${c.kind} ${c.id}  "${c.query}"`);
  for (const c of skipped) console.log(`  ↷ ${c.kind} ${c.id} (already resolved)`);
  for (const c of noQuery) console.log(`  – ${c.kind} ${c.id} SKIPPED (no query)`);

  if (args.dryRun) {
    console.log("[lesson-images] DRY RUN — no API calls, no writes. Exiting.");
    return;
  }

  // Only require secrets when actually resolving — keeps dry-run usable on
  // machines/CI where these are intentionally absent.
  const env = {
    pixabayKey: requireEnv("PIXABAY_API_KEY"),
    supabaseUrl: requireEnv("SUPABASE_URL"),
    supabaseSecretKey: requireEnv("SUPABASE_SECRET_KEY"),
  };
  console.log(`[lesson-images] ${toGenerate.length} items to resolve (icons free; Pixabay free tier).`);

  if (!args.yes && toGenerate.length > 0) {
    const ok = await confirm("Continue? [y/N] ");
    if (!ok) {
      console.log("[lesson-images] Aborted.");
      return;
    }
  }

  const supabase = createClient(env.supabaseUrl, env.supabaseSecretKey);
  const iconFetchers = makeIconifyFetchers();
  const photoFetchers = makePixabayFetchers(env.pixabayKey);
  const failed: { id: string; error: string }[] = [];

  for (const cand of toGenerate) {
    try {
      const query = cand.query as string; // toGenerate is filtered to query-bearing
      const iconBytes = await withRetry(() => resolveIcon(query, iconFetchers));
      const bytes = iconBytes ?? (await withRetry(() => resolvePhoto(query, photoFetchers)));
      if (!bytes) {
        failed.push({ id: cand.id, error: `no icon or photo for "${query}"` });
        console.error(`✗ ${cand.kind} ${cand.id}: UNRESOLVED "${query}"`);
        if (args.bail) break;
        continue;
      }
      const source: "icon" | "photo" = iconBytes ? "icon" : "photo";
      const publicUrl = await withRetry(() => uploadToStorage(supabase, args.unit, cand.id, bytes));
      sidecar[cand.id] = { url: publicUrl, source, ref: query, generatedAt: new Date().toISOString() };
      console.log(`✓ ${cand.kind} ${cand.id} [${source}] "${query}"`);
    } catch (e) {
      failed.push({ id: cand.id, error: (e as Error).message });
      console.error(`✗ ${cand.kind} ${cand.id}: ${(e as Error).message}`);
      if (args.bail) break;
    }
  }

  const sidecarPath = resolve(REPO_ROOT, `src/features/lessons/data/images/${args.unit}.images.json`);
  writeFileSync(sidecarPath, JSON.stringify(sidecar, null, 2) + "\n");
  console.log(`[lesson-images] Wrote ${sidecarPath}`);
  console.log(`[lesson-images] resolved=${toGenerate.length - failed.length} skipped=${skipped.length} failed=${failed.length}`);
  if (failed.length > 0 && !args.allowFail) process.exit(1);
}

main().catch((err) => {
  console.error(`[lesson-images] FATAL: ${err.message}`);
  process.exit(1);
});
