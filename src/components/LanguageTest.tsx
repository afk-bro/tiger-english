import { useTranslation } from 'react-i18next';
// src/main.tsx
import '../lib/i18n';


const LanguageTest = () => {
  const { t, i18n } = useTranslation();

  const switchLanguage = (lang: 'en' | 'th') => {
    i18n.changeLanguage(lang);
  };

  return (
    <div className="p-4 border rounded max-w-md mx-auto mt-10 bg-white dark:bg-neutral-800 shadow">
      <h2 className="text-xl font-semibold mb-4">{t('greeting')}</h2>
      <button
        className="mr-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        onClick={() => switchLanguage('en')}
      >
        English
      </button>
      <button
        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        onClick={() => switchLanguage('th')}
      >
        ภาษาไทย
      </button>

      <div className="mt-6">
        <p className="text-lg">{t('cta')}</p>
      </div>
    </div>
  );
};

export default LanguageTest;
