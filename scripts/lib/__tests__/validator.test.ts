// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { validateMeta, validateRows } from '../validator';
import type { SetMeta } from '../validator';

// validateMeta accepts meta + an explicit list of existing files for testability
const BASE_META: SetMeta = {
  'fruit.csv':  { title: 'Fruit',  description: 'Fruit', sort_order: 1 },
  'veggies.csv':{ title: 'Veggies',description: 'Veg',   sort_order: 2 },
};
const BASE_FILES = ['fruit.csv', 'veggies.csv'];

describe('validateMeta', () => {
  it('passes for valid meta with matching files', () => {
    expect(() => validateMeta(BASE_META, BASE_FILES)).not.toThrow();
  });

  it('throws on duplicate sort_order', () => {
    const meta: SetMeta = {
      'a.csv': { title: 'A', description: '', sort_order: 1 },
      'b.csv': { title: 'B', description: '', sort_order: 1 },
    };
    expect(() => validateMeta(meta, ['a.csv', 'b.csv'])).toThrow('Duplicate sort_order 1');
  });

  it('throws when a SET_META entry has no matching CSV file', () => {
    const meta: SetMeta = {
      'missing.csv': { title: 'Missing', description: '', sort_order: 1 },
    };
    expect(() => validateMeta(meta, [])).toThrow('missing.csv');
  });

  it('throws on blank title', () => {
    const meta: SetMeta = {
      'fruit.csv': { title: '   ', description: '', sort_order: 1 },
    };
    expect(() => validateMeta(meta, ['fruit.csv'])).toThrow('blank title');
  });

  it('throws on empty title', () => {
    const meta: SetMeta = {
      'fruit.csv': { title: '', description: '', sort_order: 1 },
    };
    expect(() => validateMeta(meta, ['fruit.csv'])).toThrow('blank title');
  });

  it('does not throw for CSV files with no SET_META entry (warns only)', () => {
    const meta: SetMeta = {
      'fruit.csv': { title: 'Fruit', description: '', sort_order: 1 },
    };
    // extra.csv exists on disk but not in meta — should not throw
    expect(() => validateMeta(meta, ['fruit.csv', 'extra.csv'])).not.toThrow();
  });
});

describe('validateRows', () => {
  it('passes for valid rows', () => {
    const rows = [
      { english_text: 'Apple', category: 'fruit', sort_order: 1 },
      { english_text: 'Banana', category: 'fruit', sort_order: 2 },
    ];
    expect(() => validateRows(rows, 'fruit.csv')).not.toThrow();
  });

  it('throws when english_text is null', () => {
    const rows = [{ english_text: null, category: 'fruit', sort_order: 1 }];
    expect(() => validateRows(rows, 'fruit.csv')).toThrow('english_text');
  });

  it('throws when english_text is empty string', () => {
    const rows = [{ english_text: '', category: 'fruit', sort_order: 1 }];
    expect(() => validateRows(rows, 'fruit.csv')).toThrow('english_text');
  });

  it('throws on duplicate sort_order', () => {
    const rows = [
      { english_text: 'Apple',  category: 'fruit', sort_order: 1 },
      { english_text: 'Banana', category: 'fruit', sort_order: 1 },
    ];
    expect(() => validateRows(rows, 'fruit.csv')).toThrow('duplicate sort_order 1');
  });

  it('throws on duplicate (english_text, category, sort_order) tuple', () => {
    const rows = [
      { english_text: 'Apple', category: 'fruit', sort_order: 1 },
      { english_text: 'Apple', category: 'fruit', sort_order: 1 },
    ];
    expect(() => validateRows(rows, 'fruit.csv')).toThrow('duplicate');
  });

  it('detects near-duplicates differing only by case — same sort_order', () => {
    // sort_order guard fires first, but the tuple check also catches it
    const rows = [
      { english_text: 'Apple', category: 'fruit', sort_order: 1 },
      { english_text: 'apple', category: 'fruit', sort_order: 1 },
    ];
    expect(() => validateRows(rows, 'fruit.csv')).toThrow();
  });

  it('detects near-duplicates differing only by case — tuple key is case-insensitive', () => {
    const rows = [
      { english_text: 'Apple', category: 'fruit', sort_order: 1 },
      { english_text: 'apple', category: 'fruit', sort_order: 1 },
    ];
    expect(() => validateRows(rows, 'fruit.csv')).toThrow('duplicate');
  });

  it('does not throw for Apple and apple with different sort_orders (legitimately distinct tuples)', () => {
    // apple:fruit:1 and apple:fruit:2 are different tuple keys — no duplicate
    const rows = [
      { english_text: 'Apple', category: 'fruit', sort_order: 1 },
      { english_text: 'apple', category: 'fruit', sort_order: 2 },
    ];
    expect(() => validateRows(rows, 'fruit.csv')).not.toThrow();
  });
});
