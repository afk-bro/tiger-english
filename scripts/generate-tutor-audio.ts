// scripts/generate-tutor-audio.ts
// Author-time CLI that pre-generates ElevenLabs TTS audio for AI Tutor
// scenarios and uploads to the public `ai-tutor-audio` Supabase Storage
// bucket. Mirrors scripts/generate-lesson-images.ts in env-loading,
// admin-client construction, and progress logging. Never imported by
// runtime code.
//
// Usage:
//   npm run tutor-audio -- --scenario meeting-someone-new --dry-run
//   npm run tutor-audio -- --scenario meeting-someone-new
//   npm run tutor-audio -- --scenario meeting-someone-new --force
//   npm run tutor-audio -- --scenario meeting-someone-new --asset opening

import { config as loadDotenv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";

import { getProvider } from "./lib/tutor-audio-providers.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");

loadDotenv({ path: resolve(REPO_ROOT, "backend/.env") });

const { values } = parseArgs({
  options: {
    scenario: { type: "string" },
    asset: { type: "string" },
    "dry-run": { type: "boolean", default: false },
    force: { type: "boolean", default: false },
    provider: { type: "string", default: "elevenlabs" },
  },
});

if (!values.scenario) {
  console.error("--scenario <slug> is required");
  process.exit(1);
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SECRET = process.env.SUPABASE_SECRET_KEY;
if (!SUPABASE_URL || !SUPABASE_SECRET) {
  console.error("SUPABASE_URL and SUPABASE_SECRET_KEY required in backend/.env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SECRET, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const BUCKET = "ai-tutor-audio";

interface AssetPlan {
  key: string; // 'opening' | task_key | `phrase-${sort_order}`
  text: string;
  path: string; // storage path: scenarios/<slug>/...
  table: string; // ai_tutor_scenarios | ai_tutor_scenario_tasks | ai_tutor_scenario_phrases
  rowId: string;
  audioColumn: string; // opening_audio_path | next_ai_line_audio_path | audio_path
  existingPath: string | null;
  promptHash: string;
}

function hashText(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}

async function buildPlan(slug: string): Promise<AssetPlan[]> {
  const { data: scenario, error: scErr } = await supabase
    .from("ai_tutor_scenarios")
    .select("id, slug, opening_line_en, opening_audio_path")
    .eq("slug", slug)
    .single();
  if (scErr || !scenario) throw new Error(`Scenario not found: ${slug}`);

  const { data: tasks, error: tErr } = await supabase
    .from("ai_tutor_scenario_tasks")
    .select("id, task_key, next_ai_line_en, next_ai_line_audio_path, sort_order")
    .eq("scenario_id", scenario.id)
    .order("sort_order");
  if (tErr) throw new Error(`Failed loading tasks: ${tErr.message}`);

  const { data: phrases, error: pErr } = await supabase
    .from("ai_tutor_scenario_phrases")
    .select("id, phrase_en, audio_path, sort_order")
    .eq("scenario_id", scenario.id)
    .order("sort_order");
  if (pErr) throw new Error(`Failed loading phrases: ${pErr.message}`);

  const plan: AssetPlan[] = [];

  // 1) Opening line
  plan.push({
    key: "opening",
    text: scenario.opening_line_en,
    path: `scenarios/${slug}/opening.mp3`,
    table: "ai_tutor_scenarios",
    rowId: scenario.id,
    audioColumn: "opening_audio_path",
    existingPath: scenario.opening_audio_path,
    promptHash: hashText(scenario.opening_line_en),
  });

  // 2) Task next-AI-lines (skip tasks with null next_ai_line_en — e.g. the
  // final task's "all done" message is a service-layer constant, not stored
  // on the row).
  for (const t of tasks ?? []) {
    if (!t.next_ai_line_en) continue;
    plan.push({
      key: t.task_key,
      text: t.next_ai_line_en,
      path: `scenarios/${slug}/tasks/${t.task_key}.mp3`,
      table: "ai_tutor_scenario_tasks",
      rowId: t.id,
      audioColumn: "next_ai_line_audio_path",
      existingPath: t.next_ai_line_audio_path,
      promptHash: hashText(t.next_ai_line_en),
    });
  }

  // 3) Phrasebook items
  for (const p of phrases ?? []) {
    plan.push({
      key: `phrase-${p.sort_order}`,
      text: p.phrase_en,
      path: `scenarios/${slug}/phrases/${p.sort_order}.mp3`,
      table: "ai_tutor_scenario_phrases",
      rowId: p.id,
      audioColumn: "audio_path",
      existingPath: p.audio_path,
      promptHash: hashText(p.phrase_en),
    });
  }

  return plan;
}

function shouldSkip(asset: AssetPlan, force: boolean): boolean {
  // v1 idempotency: skip when existingPath is non-null AND not --force.
  // Per-asset prompt hashes are computed (and could be stored alongside
  // the audio_path columns later), but the current schema only persists
  // the path, so we treat "row already has a path" as "audio exists".
  return Boolean(asset.existingPath) && !force;
}

async function uploadAsset(asset: AssetPlan, bytes: Buffer): Promise<void> {
  const { error: upErr } = await supabase.storage
    .from(BUCKET)
    .upload(asset.path, bytes, {
      contentType: "audio/mpeg",
      upsert: true,
    });
  if (upErr)
    throw new Error(`Storage upload failed for ${asset.path}: ${upErr.message}`);

  const { error: dbErr } = await supabase
    .from(asset.table)
    .update({ [asset.audioColumn]: asset.path })
    .eq("id", asset.rowId);
  if (dbErr)
    throw new Error(
      `DB update failed for ${asset.table}#${asset.rowId}: ${dbErr.message}`,
    );
}

async function main() {
  const slug = values.scenario as string;
  const provider = getProvider(values.provider as string, process.env);

  const plan = await buildPlan(slug);
  const filtered = values.asset
    ? plan.filter((a) => a.key === values.asset)
    : plan;

  if (values.asset && filtered.length === 0) {
    console.error(
      `No asset matching --asset '${values.asset}' for scenario '${slug}'`,
    );
    process.exit(1);
  }

  console.log(
    `Plan: ${filtered.length} assets for scenario '${slug}' (provider: ${provider.name})`,
  );
  console.table(
    filtered.map((a) => ({
      key: a.key,
      text: a.text.slice(0, 50) + (a.text.length > 50 ? "..." : ""),
      skip: shouldSkip(a, values.force as boolean)
        ? "skip (exists)"
        : "GEN",
      path: a.path,
    })),
  );

  if (values["dry-run"]) {
    console.log("--dry-run: no API calls or DB writes.");
    return;
  }

  let done = 0;
  let skipped = 0;
  let failed = 0;
  for (const asset of filtered) {
    if (shouldSkip(asset, values.force as boolean)) {
      skipped++;
      continue;
    }
    try {
      console.log(
        `[${done + skipped + failed + 1}/${filtered.length}] Generating: ${asset.key}`,
      );
      const bytes = await provider.synth({ text: asset.text });
      await uploadAsset(asset, bytes);
      done++;
    } catch (err) {
      failed++;
      console.error(`  x ${asset.key}:`, (err as Error).message);
    }
  }
  console.log(
    `\nDone. Generated: ${done}, Skipped: ${skipped}, Failed: ${failed}`,
  );
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
