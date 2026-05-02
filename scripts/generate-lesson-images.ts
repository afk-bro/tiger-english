// scripts/generate-lesson-images.ts
// Author-time CLI that generates lesson illustrations via Leonardo and writes
// per-unit sidecar JSON. Reads backend/.env directly via dotenv. Never runs
// in the browser. See docs/superpowers/specs/2026-05-02-lesson-image-generation-design.md.

import { config as loadDotenv } from "dotenv";
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

import { computePromptHash, templateVocabPrompt } from "./lesson-image-config";
import { units } from "../src/features/lessons/data/units";
import { lookupSection } from "../src/features/lessons/data/sectionRegistry";
import { sidecarKeyForUnit, sidecarKeyForSection } from "../src/features/lessons/data/imageHydration";
// Side-effect imports register sections in the registry.
import "../src/features/lessons/data/sections/unit-1/overview";
import "../src/features/lessons/data/sections/unit-1/grammar";
import "../src/features/lessons/data/sections/unit-1/vocabulary";
import "../src/features/lessons/data/sections/unit-1/dialogues";
import "../src/features/lessons/data/sections/unit-1/activities";
// Note: when unit-2's section files exist, add their imports here.

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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const env = {
    leonardoKey: requireEnv("LEONARDO_API_KEY"),
    supabaseUrl: requireEnv("SUPABASE_URL"),
    supabaseServiceKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  };
  void env; // Silences "declared but not used" while the API integration is pending.

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
  for (const cand of toGenerate) {
    console.log(`  + ${cand.kind} ${cand.id}`);
  }
  for (const cand of skipped) {
    console.log(`  ↷ ${cand.kind} ${cand.id} (unchanged)`);
  }

  if (args.dryRun) {
    console.log("[lesson-images] DRY RUN — no API calls, no writes. Exiting.");
    return;
  }

  // API integration + storage upload land in Tasks 16-17.
  console.log("[lesson-images] No-op — walker complete, API integration pending.");
}

main().catch((err) => {
  console.error(`[lesson-images] FATAL: ${err.message}`);
  process.exit(1);
});
