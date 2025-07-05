// src/components/home/FeaturesSection.tsx
import { useTranslation } from 'react-i18next';
import { BookOpenCheck, UserCheck, Brain } from 'lucide-react';

export default function FeaturesSection() {
  const { t } = useTranslation();

  return (
    <section className="py-24 px-6 bg-surface-light dark:bg-surface-dark">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-text-light dark:text-text-dark mb-4">
            {t('features.heading')}
          </h2>
          <p className="text-xl text-text-light/70 dark:text-text-dark/70 max-w-2xl mx-auto">
            {t('features.subheading')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Flashcards */}
          <div className="group p-8 bg-white dark:bg-base-dark border border-primary-100 dark:border-primary-800/30 rounded-2xl shadow-sm hover:shadow-xl hover:border-primary-200 dark:hover:border-primary-700/50 transition-all duration-300 hover:shadow-lg transition-shadow">
            <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-800 dark:to-primary-700 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <BookOpenCheck className="w-8 h-8 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-2xl font-bold text-text-light dark:text-text-dark mb-4">
              {t('features.cards.flashcards.title')}
            </h3>
            <p className="text-text-light/70 dark:text-text-dark/70 leading-relaxed">
              {t('features.cards.flashcards.desc')}
            </p>
          </div>

          {/* Tutoring */}
          <div className="group p-8 bg-white dark:bg-base-dark border border-accent-100 dark:border-accent-800/30 rounded-2xl shadow-sm hover:shadow-xl hover:border-accent-200 dark:hover:border-accent-700/50 transition-all duration-300 hover:-translate-y-2">
            <div className="w-16 h-16 bg-gradient-to-br from-accent-100 to-accent-200 dark:from-accent-800 dark:to-accent-700 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <UserCheck className="w-8 h-8 text-accent-600 dark:text-accent-400" />
            </div>
            <h3 className="text-2xl font-bold text-text-light dark:text-text-dark mb-4">
              {t('features.cards.tutoring.title')}
            </h3>
            <p className="text-text-light/70 dark:text-text-dark/70 leading-relaxed">
              {t('features.cards.tutoring.desc')}
            </p>
          </div>

          {/* AI Learning */}
          <div className="group p-8 bg-white dark:bg-base-dark border border-success-100 dark:border-success-800/30 rounded-2xl shadow-sm hover:shadow-xl hover:border-success-200 dark:hover:border-success-700/50 transition-all duration-300 hover:-translate-y-2">
            <div className="w-16 h-16 bg-gradient-to-br from-success-100 to-success-200 dark:from-success-800 dark:to-success-700 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
              <Brain className="w-8 h-8 text-success-600 dark:text-success-400" />
            </div>
            <h3 className="text-2xl font-bold text-text-light dark:text-text-dark mb-4">
              {t('features.cards.ai.title')}
            </h3>
            <p className="text-text-light/70 dark:text-text-dark/70 leading-relaxed">
              {t('features.cards.ai.desc')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
