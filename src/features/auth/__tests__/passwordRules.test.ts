/// <reference types="vitest/globals" />
import {
  UPPERCASE_RE,
  SPECIAL_CHAR_RE,
  PASSWORD_RULES,
  isPasswordValid,
} from '../passwordRules';

describe('UPPERCASE_RE', () => {
  it('matches a string containing an uppercase letter', () => {
    expect(UPPERCASE_RE.test('Hello')).toBe(true);
  });
  it('rejects a lowercase-only string', () => {
    expect(UPPERCASE_RE.test('hello')).toBe(false);
  });
});

describe('SPECIAL_CHAR_RE', () => {
  it('matches strings containing !@#$%^&*', () => {
    expect(SPECIAL_CHAR_RE.test('hello!')).toBe(true);
    expect(SPECIAL_CHAR_RE.test('hello@')).toBe(true);
    expect(SPECIAL_CHAR_RE.test('hello#')).toBe(true);
  });
  it('rejects alphanumeric-only strings', () => {
    expect(SPECIAL_CHAR_RE.test('hello123')).toBe(false);
  });
  it('rejects characters outside !@#$%^&* (e.g. dash, underscore)', () => {
    expect(SPECIAL_CHAR_RE.test('hello-world')).toBe(false);
    expect(SPECIAL_CHAR_RE.test('hello_world')).toBe(false);
  });
});

describe('PASSWORD_RULES[0] — minLength', () => {
  it('passes at exactly 8 characters', () => {
    expect(PASSWORD_RULES[0].test('12345678')).toBe(true);
  });
  it('fails at 7 characters', () => {
    expect(PASSWORD_RULES[0].test('1234567')).toBe(false);
  });
});

describe('PASSWORD_RULES[1] — uppercase', () => {
  it('passes when at least one uppercase letter is present', () => {
    expect(PASSWORD_RULES[1].test('Hello')).toBe(true);
  });
  it('fails with no uppercase letter', () => {
    expect(PASSWORD_RULES[1].test('hello')).toBe(false);
  });
});

describe('PASSWORD_RULES[2] — special character', () => {
  it('passes when a special character is present', () => {
    expect(PASSWORD_RULES[2].test('hello!')).toBe(true);
  });
  it('fails with no special character', () => {
    expect(PASSWORD_RULES[2].test('hello123')).toBe(false);
  });
});

describe('isPasswordValid', () => {
  it('returns true when all three rules pass', () => {
    expect(isPasswordValid('Secure1!')).toBe(true);
  });
  it('returns false when minLength fails', () => {
    expect(isPasswordValid('Sh1!')).toBe(false);
  });
  it('returns false when uppercase fails', () => {
    expect(isPasswordValid('secure1!')).toBe(false);
  });
  it('returns false when special character fails', () => {
    expect(isPasswordValid('Secure123')).toBe(false);
  });
  it('returns false for empty string', () => {
    expect(isPasswordValid('')).toBe(false);
  });
});
