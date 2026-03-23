import { createHash } from 'crypto';

/** Formats first 32 hex characters of a SHA-256 digest as a UUID (8-4-4-4-12). */
export function toUuid(hex: string): string {
  const h = hex.slice(0, 32);
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20, 32)}`;
}

export function sha256SetId(filename: string): string {
  return toUuid(createHash('sha256').update(filename).digest('hex'));
}

export function sha256CardId(
  filename: string,
  englishText: string,
  category: string | null,
  sortOrder: number,
): string {
  const key = `${filename}:${englishText}:${category ?? ''}:${sortOrder}`;
  return toUuid(createHash('sha256').update(key).digest('hex'));
}

/** Returns a SQL string literal or the keyword NULL. */
export function sqlLiteral(value: string | null | undefined): string {
  if (value == null) return 'NULL';
  const escaped = value.replace(/'/g, "''").replace(/\n/g, '\\n').replace(/\r/g, '\\r');
  return `'${escaped}'`;
}

const CURLY_QUOTE_MAP: [RegExp, string][] = [
  [/[\u2018\u2019]/g, "'"],
  [/[\u201C\u201D]/g, '"'],
];

/** Normalizes a text field: replace curly quotes, trim, collapse internal whitespace, null-for-empty. */
export function normalizeText(value: string | null | undefined): string | null {
  if (value == null) return null;
  let s = value;
  for (const [pattern, replacement] of CURLY_QUOTE_MAP) {
    s = s.replace(pattern, replacement);
  }
  s = s.trim().replace(/\s+/g, ' ');
  return s.length === 0 ? null : s;
}

/** Like normalizeText but also lowercases (for category field). */
export function normalizeCategory(value: string | null | undefined): string | null {
  const s = normalizeText(value);
  return s === null ? null : s.toLowerCase();
}
