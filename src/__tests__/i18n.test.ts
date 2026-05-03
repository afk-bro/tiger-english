import { describe, it, expect, afterEach } from 'vitest';
import i18n from '@/lib/i18n';
import en from '@/locales/en/en.json';
import vi from '@/locales/vi/vi.json';

describe('i18n config', () => {
  afterEach(() => {
    i18n.changeLanguage('en');
  });

  it('supports Vietnamese', () => {
    expect(i18n.options.supportedLngs).toContain('vi');
  });

  it('supports both zh and zh-CN to avoid nonExplicit language fallback issues', () => {
    expect(i18n.options.supportedLngs).toContain('zh');
    expect(i18n.options.supportedLngs).toContain('zh-CN');
  });

  it('has nonExplicitSupportedLngs enabled so vi-VN resolves to vi', () => {
    expect((i18n.options as Record<string, unknown>).nonExplicitSupportedLngs).toBe(true);
  });

  it('vi locale has all top-level keys that en locale has (top-level check only)', () => {
    const enKeys = Object.keys(en);
    const viKeys = Object.keys(vi);
    for (const key of enKeys) {
      expect(viKeys).toContain(key);
    }
  });

  it('resolves a Vietnamese key', () => {
    i18n.changeLanguage('vi');
    expect(i18n.t('login.title')).toBe('Chào mừng trở lại');
  });

  it('falls back to English for unknown language', () => {
    i18n.changeLanguage('fr');
    expect(i18n.t('login.title')).toBe('Welcome back');
  });

  it('falls back to English for the new exercise chrome keys when the language file lacks them', () => {
    for (const lang of ['th', 'zh-CN']) {
      i18n.changeLanguage(lang);
      expect(i18n.t('lessons.exercises.correct')).toBe('Correct!');
      expect(i18n.t('lessons.exercises.incorrect')).toBe('Incorrect');
      expect(i18n.t('lessons.exercises.tryAgain')).toBe('Try again');
      expect(i18n.t('lessons.exercises.check')).toBe('Check');
      expect(i18n.t('lessons.exercises.fillInTheBlank')).toBe('Fill in the blank');
    }
  });
});
