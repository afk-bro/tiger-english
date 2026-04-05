// src/components/Footer.tsx
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();
  return (
    <footer className="text-center text-sm text-gray-500 dark:text-gray-400 py-6 bg-base-light dark:bg-base-dark border-t border-gray-200 dark:border-gray-700 font-sans">
      {t('common.footer', { year: new Date().getFullYear() })}
    </footer>
  );
}
