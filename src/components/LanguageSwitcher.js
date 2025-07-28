import { jsx as _jsx } from "react/jsx-runtime";
// src/components/LanguageSwitcher.tsx
import { useTranslation } from 'react-i18next';
export default function LanguageSwitcher() {
    const { i18n } = useTranslation();
    const currentLang = i18n.language;
    const toggleLanguage = () => {
        const nextLang = currentLang === 'en' ? 'th' : 'en';
        i18n.changeLanguage(nextLang);
    };
    return (_jsx("button", { onClick: toggleLanguage, className: "px-3 py-1 rounded text-sm font-medium border border-primary-300 dark:border-primary-700 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-800 transition", children: currentLang === 'en' ? 'TH' : 'EN' }));
}
