// src/components/flashcards/WelcomeBanner.tsx
import { useTranslation } from 'react-i18next';

export function WelcomeBanner() {
  const { t } = useTranslation();

  return (
    <div className="text-center py-8 px-4">
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary-800 mb-4">
        {t('flashcards.welcome.title')}{" "}
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-600 to-accent-400">
          {t('flashcards.welcome.title_highlight')}
        </span>
      </h1>
      <p className="text-lg md:text-xl text-primary-600 max-w-2xl mx-auto leading-relaxed">
        {t('flashcards.welcome.subtitle')}
      </p>
      <div className="mt-6 w-24 h-1 bg-gradient-to-r from-accent-600 to-accent-400 mx-auto rounded-full"></div>
    </div>
  );
}
