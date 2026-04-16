// src/lib/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from '../locales/en/en.json';
import th from '../locales/th/th.json';
import vi from '../locales/vi/vi.json';
import zhCN from '../locales/zh-CN/zh-CN.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'th', 'vi', 'zh-CN'],
    nonExplicitSupportedLngs: true,
    resources: {
      en: { translation: en },
      th: { translation: th },
      vi: { translation: vi },
      'zh-CN': { translation: zhCN },
      zh: { translation: zhCN },
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
