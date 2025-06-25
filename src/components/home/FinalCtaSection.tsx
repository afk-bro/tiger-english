// src/components/home/FinalCtaSection.tsx
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function FinalCtaSection() {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 dark:from-primary-800 dark:via-primary-700 dark:to-accent-700"></div>
      <div className="relative text-center py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {t('cta.heading')}
          </h2>
          <p className="text-xl text-white/90 max-w-2xl mx-auto mb-12">
            {t('cta.desc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/register">
              <button className="group bg-white text-primary-600 hover:bg-primary-50 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 flex items-center gap-2">
                {t('cta.button')}
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
            <Link to="/contact">
              <button className="text-white hover:text-white/80 px-8 py-4 text-lg font-medium border border-white/30 hover:border-white/50 rounded-xl transition-all duration-200">
                {t('cta.contact')}
              </button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
