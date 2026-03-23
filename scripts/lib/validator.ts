export interface SetMetaEntry {
  title: string;
  description: string;
  is_public?: boolean;
  sort_order: number;
}

export type SetMeta = Record<string, SetMetaEntry>;

/**
 * Validates metadata integrity.
 * @param meta - The SET_META object
 * @param availableFiles - List of CSV filenames on disk
 */
export function validateMeta(meta: SetMeta, availableFiles: string[]): void {
  const fileSet = new Set(availableFiles);

  // Duplicate sort_order check
  const seen = new Set<number>();
  for (const [, entry] of Object.entries(meta)) {
    const s = entry.sort_order;
    if (seen.has(s)) throw new Error(`Duplicate sort_order ${s} in SET_META`);
    seen.add(s);
  }

  // Per-entry checks
  for (const [filename, entry] of Object.entries(meta)) {
    if (!entry.title || !entry.title.trim()) {
      throw new Error(`blank title for "${filename}" in SET_META`);
    }
    if (!fileSet.has(filename)) {
      throw new Error(
        `SET_META entry "${filename}" has no matching CSV file on disk`,
      );
    }
  }

  // Warn about CSV files with no SET_META entry
  for (const file of availableFiles) {
    if (!(file in meta)) {
      console.warn(`Warning: ${file} has no SET_META entry — skipping`);
    }
  }
}

export interface ValidatableRow {
  english_text: string | null;
  category: string | null;
  sort_order: number;
}

/** Validates rows within a single CSV after normalization. */
export function validateRows(rows: ValidatableRow[], filename: string): void {
  const seenSortOrders = new Set<number>();
  const seenTuples = new Set<string>();

  for (const row of rows) {
    if (!row.english_text) {
      throw new Error(
        `${filename}: row with sort_order ${row.sort_order} has empty english_text`,
      );
    }

    if (seenSortOrders.has(row.sort_order)) {
      throw new Error(`${filename}: duplicate sort_order ${row.sort_order}`);
    }
    seenSortOrders.add(row.sort_order);

    const tuple = [
      (row.english_text ?? '').toLowerCase(),
      (row.category ?? '').toLowerCase(),
      row.sort_order,
    ].join(':');

    if (seenTuples.has(tuple)) {
      throw new Error(`${filename}: duplicate (english_text, category, sort_order) tuple: ${tuple}`);
    }
    seenTuples.add(tuple);
  }
}
