import { Link } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "../ui/Button";

export default function HeroSection() {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-primary-900/20 dark:via-semantic-bg dark:to-accent-900/20" />
      <div className="relative py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-4 md:px-6">
          <div className="max-w-2xl space-y-6">
            <div className="inline-flex items-center gap-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-4 py-2 rounded-full text-sm font-medium">
              <Sparkles className="w-4 h-4" />
              {t("hero.badge")}
            </div>
            <h1 className="font-display text-3xl md:text-4xl lg:text-5xl leading-[1.1] md:leading-tight tracking-[-0.01em] text-semantic-text dark:text-semantic-text heading-accent-wide">
              {t("hero.title")}
            </h1>
            <p className="text-sm md:text-base leading-relaxed text-semantic-text-muted dark:text-semantic-text-muted">
              {t("hero.subtitle")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 items-start">
              <Button to="/register" variant="primary" iconRight={<ArrowRight />}>
                {t("hero.cta")}
              </Button>
              <Link
                to="/about"
                className="text-primary-600 dark:text-primary-400 hover:underline text-sm md:text-base py-2 transition-colors duration-200"
              >
                {t("hero.learn_more")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
