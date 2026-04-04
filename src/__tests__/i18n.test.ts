import { describe, it, expect } from 'vitest';
import i18n from '@/lib/i18n';
import en from '@/locales/en/en.json';
import vi from '@/locales/vi/vi.json';

describe('i18n config', () => {
  it('supports Vietnamese', () => {
    expect(i18n.options.supportedLngs).toContain('vi');
  });

  it('has nonExplicitSupportedLngs enabled so vi-VN resolves to vi', () => {
    expect((i18n.options as Record<string, unknown>).nonExplicitSupportedLngs).toBe(true);
  });

  it('vi locale has all keys that en locale has at top level', () => {
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
});
