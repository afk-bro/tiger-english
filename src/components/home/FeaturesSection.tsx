import { useTranslation } from 'react-i18next';
import { BookOpenCheck, UserCheck, Brain } from 'lucide-react';

export default function FeaturesSection() {
  const { t } = useTranslation();

  return (
    <section className="py-12 md:py-16 bg-semantic-surface dark:bg-semantic-surface">
      <div className="max-w-6xl mx-auto px-4 md:px-6">
        <div className="mb-10">
          <h2 className="text-display heading-accent">
            {t('features.heading')}
          </h2>
          <p className="text-sm md:text-base leading-relaxed text-semantic-muted dark:text-semantic-muted mt-4 max-w-2xl">
            {t('features.subheading')}
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 md:gap-6">
          {/* Flashcards — `group` on the card enables the icon halo on card hover */}
          <div className="card space-y-4 group">
            <div className="w-14 h-14 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-800 dark:to-primary-700 rounded-2xl flex items-center justify-center transition-all duration-200 group-hover:shadow-[0_0_12px_rgba(252,211,77,0.2)]">
              <BookOpenCheck className="w-7 h-7 text-primary-600 dark:text-primary-400" />
            </div>
            <h3 className="text-base md:text-lg font-semibold text-semantic-text dark:text-semantic-text">
              {t('features.cards.flashcards.title')}
            </h3>
            <p className="text-sm md:text-base leading-relaxed text-semantic-muted dark:text-semantic-muted">
              {t('features.cards.flashcards.desc')}
            </p>
          </div>

          {/* Tutoring */}
          <div className="card space-y-4">
            <div className="w-14 h-14 bg-gradient-to-br from-accent-100 to-accent-200 dark:from-accent-800 dark:to-accent-700 rounded-2xl flex items-center justify-center">
              <UserCheck className="w-7 h-7 text-accent-600 dark:text-accent-400" />
            </div>
            <h3 className="text-base md:text-lg font-semibold text-semantic-text dark:text-semantic-text">
              {t('features.cards.tutoring.title')}
            </h3>
            <p className="text-sm md:text-base leading-relaxed text-semantic-muted dark:text-semantic-muted">
              {t('features.cards.tutoring.desc')}
            </p>
          </div>

          {/* AI Learning */}
          <div className="card space-y-4">
            <div className="w-14 h-14 bg-gradient-to-br from-success-100 to-success-200 dark:from-success-800 dark:to-success-700 rounded-2xl flex items-center justify-center">
              <Brain className="w-7 h-7 text-success-600 dark:text-success-400" />
            </div>
            <h3 className="text-base md:text-lg font-semibold text-semantic-text dark:text-semantic-text">
              {t('features.cards.ai.title')}
            </h3>
            <p className="text-sm md:text-base leading-relaxed text-semantic-muted dark:text-semantic-muted">
              {t('features.cards.ai.desc')}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
