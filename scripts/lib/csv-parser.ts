import Papa from 'papaparse';

export type CsvFormat = 'v2' | 'legacy';

export interface RawRow {
  native_text: string | null;
  english_text: string | null;
  category: string | null;
  part_of_speech: string | null;
  level: string | null;
  example_sentence: string | null;
  english_audio_url: string | null;
  native_audio_url: string | null;
  image_url: string | null;
  sort_order: number;
}

const V2_REQUIRED = [
  'native_text', 'english_text', 'category', 'part_of_speech', 'level',
  'example_sentence', 'english_audio_url', 'native_audio_url', 'image_url', 'sort_order',
];
const LEGACY_REQUIRED = ['English Phrase', 'Category'];

export function detectFormat(headers: string[]): CsvFormat {
  const trimmed = headers.map((h) => h.trim());
  // Legacy checked first: a CSV with both header sets is conservatively treated as legacy.
  if (LEGACY_REQUIRED.every((h) => trimmed.includes(h))) return 'legacy';
  if (V2_REQUIRED.every((h) => trimmed.includes(h))) return 'v2';
  throw new Error(`Unrecognised CSV headers: ${JSON.stringify(headers)}`);
}

function str(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value).trim();
  return s.length === 0 ? null : s;
}

export function parseCsv(content: string, filename: string): RawRow[] {
  // Strip BOM
  const stripped = content.startsWith('\uFEFF') ? content.slice(1) : content;

  const result = Papa.parse<Record<string, string>>(stripped, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim(),
  });

  const fatalErrors = result.errors.filter((e) => e.type !== 'FieldMismatch');
  if (fatalErrors.length > 0) {
    throw new Error(`CSV parse error in ${filename}: ${fatalErrors[0].message}`);
  }
  const fieldErrors = result.errors.filter((e) => e.type === 'FieldMismatch');
  if (fieldErrors.length > 0) {
    console.warn(`Warning: ${filename} has ${fieldErrors.length} row(s) with mismatched field count — downstream validation will catch bad rows`);
  }

  if (result.data.length === 0) {
    throw new Error(`${filename} is empty`);
  }

  const headers = Object.keys(result.data[0]);
  const format = detectFormat(headers);

  return result.data.map((row, i) => {
    if (format === 'legacy') {
      const englishText = str(row['English Phrase']);
      return {
        native_text: englishText,
        english_text: englishText,
        category: str(row['Category']),
        part_of_speech: null,
        level: null,
        example_sentence: null,
        english_audio_url: null,
        native_audio_url: null,
        image_url: null,
        sort_order: i + 1,
      };
    }

    return {
      native_text: str(row['native_text']),
      english_text: str(row['english_text']),
      category: str(row['category']),
      part_of_speech: str(row['part_of_speech']),
      level: str(row['level']),
      example_sentence: str(row['example_sentence']),
      english_audio_url: str(row['english_audio_url']),
      native_audio_url: str(row['native_audio_url']),
      image_url: str(row['image_url']),
      sort_order: (Number.isFinite(Number(row['sort_order'])) && row['sort_order'].trim() !== '') ? Number(row['sort_order']) : i + 1,
    };
  });
}
