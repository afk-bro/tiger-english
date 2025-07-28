import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useTranslation } from 'react-i18next';
// src/main.tsx
import '../lib/i18n';
const LanguageTest = () => {
    const { t, i18n } = useTranslation();
    const switchLanguage = (lang) => {
        i18n.changeLanguage(lang);
    };
    return (_jsxs("div", { className: "p-4 border rounded max-w-md mx-auto mt-10 bg-white dark:bg-neutral-800 shadow", children: [_jsx("h2", { className: "text-xl font-semibold mb-4", children: t('greeting') }), _jsx("button", { className: "mr-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700", onClick: () => switchLanguage('en'), children: "English" }), _jsx("button", { className: "px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700", onClick: () => switchLanguage('th'), children: "\u0E20\u0E32\u0E29\u0E32\u0E44\u0E17\u0E22" }), _jsx("div", { className: "mt-6", children: _jsx("p", { className: "text-lg", children: t('cta') }) })] }));
};
export default LanguageTest;
