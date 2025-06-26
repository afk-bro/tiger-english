// src/lib/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from '../locales/en/en.json';
import th from '../locales/th/th.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    supportedLngs: ['en', 'th'],
    resources: {
      en: { translation: en },
      th: { translation: th },
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
