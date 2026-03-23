// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  toUuid,
  sha256SetId,
  sha256CardId,
  sqlLiteral,
  normalizeText,
  normalizeCategory,
} from '../seed-utils';

describe('toUuid', () => {
  it('formats 32 hex chars as 8-4-4-4-12 UUID', () => {
    expect(toUuid('abcdef1234567890abcdef1234567890')).toBe(
      'abcdef12-3456-7890-abcd-ef1234567890'
    );
  });

  it('truncates input longer than 32 chars', () => {
    const result = toUuid('a'.repeat(40));
    expect(result).toBe('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');
  });
});

describe('sha256SetId', () => {
  it('returns a deterministic UUID for a filename', () => {
    const id1 = sha256SetId('fruit_20_basic.csv');
    const id2 = sha256SetId('fruit_20_basic.csv');
    expect(id1).toBe(id2);
  });

  it('returns different UUIDs for different filenames', () => {
    expect(sha256SetId('fruit_20_basic.csv')).not.toBe(
      sha256SetId('vegetables_20_basic.csv')
    );
  });

  it('returns a valid UUID format', () => {
    const uuid = sha256SetId('fruit_20_basic.csv');
    expect(uuid).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });
});

describe('sha256CardId', () => {
  it('returns deterministic UUID for same inputs', () => {
    const id1 = sha256CardId('fruit.csv', 'Apple', 'fruit', 1);
    const id2 = sha256CardId('fruit.csv', 'Apple', 'fruit', 1);
    expect(id1).toBe(id2);
  });

  it('differs from set ID for same filename', () => {
    expect(sha256CardId('fruit.csv', 'Apple', 'fruit', 1)).not.toBe(
      sha256SetId('fruit.csv')
    );
  });

  it('changes when sort_order changes', () => {
    expect(sha256CardId('fruit.csv', 'Apple', 'fruit', 1)).not.toBe(
      sha256CardId('fruit.csv', 'Apple', 'fruit', 2)
    );
  });

  it('handles null category', () => {
    const id = sha256CardId('fruit.csv', 'Apple', null, 1);
    expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });
});

describe('sqlLiteral', () => {
  it('wraps a string in single quotes', () => {
    expect(sqlLiteral('hello')).toBe("'hello'");
  });

  it('escapes single quotes by doubling them', () => {
    expect(sqlLiteral("I'm fine")).toBe("'I''m fine'");
  });

  it('escapes embedded newlines as literal \\n', () => {
    expect(sqlLiteral('line1\nline2')).toBe("'line1\\nline2'");
  });

  it('escapes carriage returns as literal \\r', () => {
    expect(sqlLiteral('a\rb')).toBe("'a\\rb'");
  });

  it('returns NULL (unquoted) for null', () => {
    expect(sqlLiteral(null)).toBe('NULL');
  });

  it('returns NULL (unquoted) for undefined', () => {
    expect(sqlLiteral(undefined)).toBe('NULL');
  });
});

describe('normalizeText', () => {
  it('returns null for null input', () => {
    expect(normalizeText(null)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(normalizeText('')).toBeNull();
  });

  it('returns null for whitespace-only string', () => {
    expect(normalizeText('   ')).toBeNull();
  });

  it('trims leading and trailing whitespace', () => {
    expect(normalizeText('  hello  ')).toBe('hello');
  });

  it('collapses internal whitespace to single space', () => {
    expect(normalizeText('hello   world')).toBe('hello world');
  });

  it('replaces left single curly quote', () => {
    expect(normalizeText('\u2018hello')).toBe("'hello");
  });

  it('replaces right single curly quote', () => {
    expect(normalizeText('it\u2019s')).toBe("it's");
  });

  it('replaces left double curly quote', () => {
    expect(normalizeText('\u201Chello')).toBe('"hello');
  });

  it('replaces right double curly quote', () => {
    expect(normalizeText('hello\u201D')).toBe('hello"');
  });
});

describe('normalizeCategory', () => {
  it('lowercases the category', () => {
    expect(normalizeCategory('Fruit')).toBe('fruit');
  });

  it('lowercases and trims', () => {
    expect(normalizeCategory('  FRUIT  ')).toBe('fruit');
  });

  it('returns null for null', () => {
    expect(normalizeCategory(null)).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(normalizeCategory('')).toBeNull();
  });
});
