/**
 * Generate translation review CSVs for flashcard sets.
 *
 * Usage (Claude Code OAuth — no API key needed):
 *   npx tsx scripts/generate-translations.ts --lang th --cards-file src/data/translations/cards.json
 *
 * Or with Supabase credentials to fetch cards directly:
 *   SUPABASE_URL=https://... SUPABASE_SERVICE_ROLE_KEY=... \
 *   npx tsx scripts/generate-translations.ts --lang th
 *
 * Uses ANTHROPIC_CODE_OAUTH_TOKEN if present (Claude Code sessions),
 * falls back to ANTHROPIC_API_KEY for standalone use.
 *
 * Output: src/data/translations/<lang>_review.csv
 * Flagged rows (low confidence) are sorted to the top for fast human review.
 * After reviewing, run generate-translations-migration.ts to emit SQL.
 */

import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { writeFileSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';

// ─── Config ──────────────────────────────────────────────────────────────────

const SUPPORTED_LANGUAGES: Record<string, string> = {
  th: 'Thai',
  zh: 'Chinese',
  vi: 'Vietnamese',
};

const BATCH_SIZE = 20;
const OUTPUT_DIR = 'src/data/translations';

// ─── Args ─────────────────────────────────────────────────────────────────────

const langArg = process.argv.find((a) => a.startsWith('--lang='))?.split('=')[1]
  ?? process.argv[process.argv.indexOf('--lang') + 1];

if (!langArg || !SUPPORTED_LANGUAGES[langArg]) {
  console.error(`Usage: npx tsx scripts/generate-translations.ts --lang <${Object.keys(SUPPORTED_LANGUAGES).join('|')}> [--cards-file <path>]`);
  process.exit(1);
}

const lang = langArg;
const langName = SUPPORTED_LANGUAGES[lang];

const cardsFileIdx = process.argv.indexOf('--cards-file');
const cardsFilePath = cardsFileIdx !== -1 ? process.argv[cardsFileIdx + 1] : null;

// ─── Clients ─────────────────────────────────────────────────────────────────

const anthropic = process.env.ANTHROPIC_CODE_OAUTH_TOKEN
  ? new Anthropic({ authToken: process.env.ANTHROPIC_CODE_OAUTH_TOKEN })
  : new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ─── Fetch untranslated cards ─────────────────────────────────────────────────

type CardRow = { id: string; english_text: string; category: string | null };

let cards: CardRow[];

if (cardsFilePath) {
  console.log(`Reading cards from ${cardsFilePath}...`);
  cards = JSON.parse(readFileSync(cardsFilePath, 'utf-8')) as CardRow[];
  console.log(`Loaded ${cards.length} card(s) from file.`);
} else {
  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  console.log(`Fetching cards without a reviewed ${langName} translation...`);

  const { data, error } = await supabase
    .from('flashcards')
    .select('id, english_text, category')
    .not(
      'id',
      'in',
      `(SELECT flashcard_id FROM flashcard_translations WHERE language_code = '${lang}' AND is_reviewed = true)`,
    );

  if (error) {
    console.error('Supabase error:', error.message);
    process.exit(1);
  }
  cards = data ?? [];
}

if (!cards || cards.length === 0) {
  console.log(`No untranslated cards found for ${langName}. Nothing to do.`);
  process.exit(0);
}

console.log(`Found ${cards.length} card(s) to translate.`);

// ─── Translate in batches ─────────────────────────────────────────────────────

type TranslationResult = {
  id: string;
  english_text: string;
  category: string | null;
  native_text: string;
  flagged: boolean;
};

const results: TranslationResult[] = [];

for (let i = 0; i < cards.length; i += BATCH_SIZE) {
  const batch = cards.slice(i, i + BATCH_SIZE);
  const batchNum = Math.floor(i / BATCH_SIZE) + 1;
  const totalBatches = Math.ceil(cards.length / BATCH_SIZE);
  console.log(`Translating batch ${batchNum}/${totalBatches} (${batch.length} cards)...`);

  const prompt = `Translate the following English words/phrases to ${langName}.
Return ONLY a JSON array with this exact shape:
[{ "id": "<flashcard_id>", "native_text": "<translation>" }, ...]
If you are not confident about a translation, prefix native_text with "?".
Do not add explanations, romanisation, or alternatives.

Cards:
${JSON.stringify(batch.map((c) => ({ id: c.id, english_text: c.english_text, category: c.category })))}`;

  const message = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  });

  const content = message.content[0];
  if (content.type !== 'text') {
    console.error(`Unexpected response type in batch ${batchNum}`);
    process.exit(1);
  }

  let parsed: { id: string; native_text: string }[];
  try {
    // Strip markdown code fences if present
    const jsonText = content.text.replace(/^```json?\n?/, '').replace(/\n?```$/, '').trim();
    parsed = JSON.parse(jsonText);
  } catch {
    console.error(`Failed to parse JSON in batch ${batchNum}:`, content.text);
    process.exit(1);
  }

  const cardMap = new Map(batch.map((c) => [c.id, c]));
  for (const item of parsed) {
    const card = cardMap.get(item.id);
    if (!card) {
      console.warn(`Unknown card id in response: ${item.id}`);
      continue;
    }
    const flagged = item.native_text.startsWith('?');
    results.push({
      id: item.id,
      english_text: card.english_text,
      category: card.category,
      native_text: flagged ? item.native_text.slice(1).trim() : item.native_text,
      flagged,
    });
  }
}

// ─── Write CSV ────────────────────────────────────────────────────────────────

// Sort: flagged rows first for fast human review
results.sort((a, b) => (b.flagged ? 1 : 0) - (a.flagged ? 1 : 0));

const escCsv = (s: string | null) =>
  s == null ? '' : `"${String(s).replace(/"/g, '""')}"`;

const header = 'flashcard_id,english_text,category,native_text,flagged';
const rows = results.map(
  (r) => `${escCsv(r.id)},${escCsv(r.english_text)},${escCsv(r.category)},${escCsv(r.native_text)},${r.flagged}`,
);

mkdirSync(OUTPUT_DIR, { recursive: true });
const outputPath = join(OUTPUT_DIR, `${lang}_review.csv`);
writeFileSync(outputPath, [header, ...rows].join('\n') + '\n', 'utf-8');

const flaggedCount = results.filter((r) => r.flagged).length;
console.log(`\nWrote ${results.length} translations to ${outputPath}`);
if (flaggedCount > 0) {
  console.log(`⚠  ${flaggedCount} row(s) flagged — review and edit native_text, then clear flagged=false before running the migration generator.`);
} else {
  console.log('✓ No flagged rows. Ready for migration generation.');
}
