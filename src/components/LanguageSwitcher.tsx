// src/components/LanguageSwitcher.tsx
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Globe, ChevronDown } from 'lucide-react';

const UI_LANGUAGES = ['en', 'th', 'vi'] as const;
type UILang = typeof UI_LANGUAGES[number];

// Always show each language's own name in its own script
const LANG_META: Record<UILang, { native: string; short: string }> = {
  en: { native: 'English',    short: 'EN' },
  th: { native: 'ไทย',        short: 'TH' },
  vi: { native: 'Tiếng Việt', short: 'VI' },
};

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Normalise to base code (e.g. "en-US" → "en"); fall back to "en"
  const rawLang = i18n.language.split('-')[0].toLowerCase();
  const currentLang: UILang = (UI_LANGUAGES as readonly string[]).includes(rawLang)
    ? (rawLang as UILang)
    : 'en';

  // WCAG SC 3.1.1 — keep <html lang> in sync so AT pronounces content correctly
  useEffect(() => {
    document.documentElement.lang = currentLang;
  }, [currentLang]);

  // Focus the currently-selected option when the menu opens
  useEffect(() => {
    if (!isOpen) return;
    const idx = UI_LANGUAGES.indexOf(currentLang);
    optionRefs.current[idx >= 0 ? idx : 0]?.focus();
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Close on outside click — no focus return (user intentionally clicked elsewhere)
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

  /** Close the menu and return keyboard focus to the trigger button. */
  const closeAndReturnFocus = () => {
    setIsOpen(false);
    triggerRef.current?.focus();
  };

  const handleSelect = (lang: UILang) => {
    i18n.changeLanguage(lang); // LanguageDetector auto-persists to localStorage
    closeAndReturnFocus();
  };

  /** Open on ArrowDown/ArrowUp from the trigger (ARIA APG menu pattern). */
  const handleTriggerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setIsOpen(true);
    }
  };

  /** Full keyboard navigation inside the menu (ARIA APG menu pattern). */
  const handleOptionKeyDown = (e: React.KeyboardEvent, index: number) => {
    const last = UI_LANGUAGES.length - 1;
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        optionRefs.current[(index + 1) % UI_LANGUAGES.length]?.focus();
        break;
      case 'ArrowUp':
        e.preventDefault();
        optionRefs.current[(index - 1 + UI_LANGUAGES.length) % UI_LANGUAGES.length]?.focus();
        break;
      case 'Home':
        e.preventDefault();
        optionRefs.current[0]?.focus();
        break;
      case 'End':
        e.preventDefault();
        optionRefs.current[last]?.focus();
        break;
      case 'Escape':
        closeAndReturnFocus();
        break;
      case 'Tab':
        // Let Tab move focus naturally; close the menu without forcing focus back
        setIsOpen(false);
        break;
    }
  };

  const { native, short } = LANG_META[currentLang];

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleTriggerKeyDown}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={t('common.language_switcher.change_language')}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/40"
      >
        <Globe className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
        {/* Desktop: full native name  |  Mobile: 2-letter code */}
        <span className="hidden md:inline">{native}</span>
        <span className="md:hidden">{short}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          aria-hidden="true"
        />
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <ul
          role="menu"
          aria-label={t('common.language_switcher.select_language')}
          className="absolute right-0 mt-1.5 min-w-[9rem] bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg py-1 z-50"
        >
          {UI_LANGUAGES.map((lang, index) => {
            const selected = lang === currentLang;
            return (
              <li key={lang} role="none">
                <button
                  ref={(el) => { optionRefs.current[index] = el; }}
                  type="button"
                  role="menuitemradio"
                  aria-checked={selected}
                  lang={lang}
                  onClick={() => handleSelect(lang)}
                  onKeyDown={(e) => handleOptionKeyDown(e, index)}
                  className={`w-full text-left px-4 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary-400/40 ${
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
