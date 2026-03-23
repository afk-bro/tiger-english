// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { detectFormat, parseCsv } from '../csv-parser';

const V2_HEADER = 'native_text,english_text,category,part_of_speech,level,example_sentence,english_audio_url,native_audio_url,image_url,sort_order';
const LEGACY_HEADER = 'English Phrase,Category';

describe('detectFormat', () => {
  it('detects v2 format', () => {
    const headers = V2_HEADER.split(',');
    expect(detectFormat(headers)).toBe('v2');
  });

  it('detects legacy format', () => {
    expect(detectFormat(['English Phrase', 'Category'])).toBe('legacy');
  });

  it('throws on unrecognised headers', () => {
    expect(() => detectFormat(['foo', 'bar'])).toThrow('Unrecognised CSV headers');
  });
});

describe('parseCsv — v2 format', () => {
  const csv = [
    V2_HEADER,
    ',Apple,fruit,noun,basic,I like apple.,,,,1',
    ',Banana,fruit,noun,basic,I like banana.,,,,2',
  ].join('\n');

  it('parses rows into RawRow objects', () => {
    const rows = parseCsv(csv, 'fruit.csv');
    expect(rows).toHaveLength(2);
    expect(rows[0].english_text).toBe('Apple');
    expect(rows[0].category).toBe('fruit');
    expect(rows[0].sort_order).toBe(1);
  });

  it('returns null for empty native_text', () => {
    const rows = parseCsv(csv, 'fruit.csv');
    expect(rows[0].native_text).toBeNull();
  });

  it('handles CRLF line endings', () => {
    const crlfCsv = [V2_HEADER, ',Apple,fruit,noun,basic,,,,,1'].join('\r\n');
    const rows = parseCsv(crlfCsv, 'fruit.csv');
    expect(rows).toHaveLength(1);
    expect(rows[0].english_text).toBe('Apple');
  });

  it('strips UTF-8 BOM', () => {
    const bomCsv = '\uFEFF' + [V2_HEADER, ',Apple,fruit,noun,basic,,,,,1'].join('\n');
    const rows = parseCsv(bomCsv, 'fruit.csv');
    expect(rows).toHaveLength(1);
  });

  it('handles quoted fields containing commas', () => {
    const csvWithComma = [
      V2_HEADER,
      ',"Hello, world",greetings,phrase,basic,"Hi, there!",,,,1',
    ].join('\n');
    const rows = parseCsv(csvWithComma, 'test.csv');
    expect(rows[0].english_text).toBe('Hello, world');
    expect(rows[0].example_sentence).toBe('Hi, there!');
  });

  it('handles quoted fields containing embedded newlines', () => {
    const csvWithNewline = [
      V2_HEADER,
      ',"Line one\nLine two",greetings,phrase,basic,,,,,1',
    ].join('\n');
    const rows = parseCsv(csvWithNewline, 'test.csv');
    expect(rows[0].english_text).toBe('Line one\nLine two');
  });

  it('parses sort_order as a number', () => {
    const rows = parseCsv(csv, 'fruit.csv');
    expect(typeof rows[0].sort_order).toBe('number');
    expect(rows[0].sort_order).toBe(1);
  });
});

describe('parseCsv — legacy format', () => {
  const csv = [LEGACY_HEADER, 'Hello,Greeting', 'Goodbye,Farewell'].join('\n');

  it('maps English Phrase to english_text', () => {
    const rows = parseCsv(csv, 'travel_essentials.csv');
    expect(rows[0].english_text).toBe('Hello');
  });

  it('maps English Phrase to native_text as fallback', () => {
    const rows = parseCsv(csv, 'travel_essentials.csv');
    expect(rows[0].native_text).toBe('Hello');
  });

  it('maps Category to category', () => {
    const rows = parseCsv(csv, 'travel_essentials.csv');
    expect(rows[0].category).toBe('Greeting');
  });

  it('assigns 1-based sort_order from row position', () => {
    const rows = parseCsv(csv, 'travel_essentials.csv');
    expect(rows[0].sort_order).toBe(1);
    expect(rows[1].sort_order).toBe(2);
  });

  it('sets all other fields to null', () => {
    const rows = parseCsv(csv, 'travel_essentials.csv');
    expect(rows[0].part_of_speech).toBeNull();
    expect(rows[0].level).toBeNull();
    expect(rows[0].example_sentence).toBeNull();
  });
});
