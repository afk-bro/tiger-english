// scripts/generate-lesson-images.ts
// Author-time CLI that generates lesson illustrations via Leonardo and writes
// per-unit sidecar JSON. Reads backend/.env directly via dotenv. Never runs
// in the browser. See docs/superpowers/specs/2026-05-02-lesson-image-generation-design.md.

import { config as loadDotenv } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const env = {
    leonardoKey: requireEnv("LEONARDO_API_KEY"),
    supabaseUrl: requireEnv("SUPABASE_URL"),
    supabaseServiceKey: requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
  };
  void env;

  console.log(`[lesson-images] unit=${args.unit} dryRun=${args.dryRun} force=${args.force}`);

  if (args.dryRun) {
    console.log("[lesson-images] DRY RUN — no API calls, no writes. Exiting.");
    return;
  }

  // Walker / API integration / Storage upload land in subsequent tasks.
  console.log("[lesson-images] No-op — walker, API, and upload land in later tasks.");
}

main().catch((err) => {
  console.error(`[lesson-images] FATAL: ${err.message}`);
  process.exit(1);
});
