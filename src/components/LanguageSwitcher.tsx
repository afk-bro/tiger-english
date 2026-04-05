// src/components/LanguageSwitcher.tsx
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown } from 'lucide-react';

const UI_LANGUAGES = ['en', 'th', 'vi'] as const;
type UILang = typeof UI_LANGUAGES[number];

// Native-script names — always shown in their own language regardless of UI locale
const LANG_META: Record<UILang, { native: string; short: string }> = {
  en: { native: 'English', short: 'EN' },
  th: { native: 'ไทย',     short: 'TH' },
  vi: { native: 'Tiếng Việt', short: 'VI' },
};

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Normalise to base code (e.g. "en-US" → "en"); fall back to "en"
  const rawLang = i18n.language.split('-')[0].toLowerCase();
  const currentLang: UILang = (UI_LANGUAGES as readonly string[]).includes(rawLang)
    ? (rawLang as UILang)
    : 'en';

  // WCAG SC 3.1.1 — keep <html lang> in sync so assistive tech pronounces content correctly
  useEffect(() => {
    document.documentElement.lang = currentLang;
  }, [currentLang]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const onMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onMouseDown);
    return () => document.removeEventListener('mousedown', onMouseDown);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  const handleSelect = (lang: UILang) => {
    i18n.changeLanguage(lang); // LanguageDetector auto-persists to localStorage
    setIsOpen(false);
  };

  const { native, short } = LANG_META[currentLang];

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label="Change language"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/40"
      >
        <Globe className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
        {/* Desktop: full language name  |  Mobile: 2-letter code */}
        <span className="hidden md:inline">{native}</span>
        <span className="md:hidden">{short}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <ul
          role="listbox"
          aria-label="Select language"
          className="absolute right-0 mt-1.5 min-w-[9rem] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-1 z-50"
        >
          {UI_LANGUAGES.map((lang) => {
            const selected = lang === currentLang;
            return (
              <li key={lang} role="option" aria-selected={selected}>
                <button
                  type="button"
                  lang={lang}
                  onClick={() => handleSelect(lang)}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors ${
                    selected
                      ? 'text-primary-600 dark:text-primary-400 font-semibold bg-primary-50 dark:bg-primary-900/20'
                      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {LANG_META[lang].native}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
