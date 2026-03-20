import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "../ui/Button";

export default function FinalCtaSection() {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 dark:from-primary-400 dark:via-primary-600 dark:to-accent-700" />
      <div className="relative py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4 md:px-6 text-center">
          <div className="max-w-2xl mx-auto space-y-6">
            <h2 className="text-display text-white">
              {t("cta.heading")}
            </h2>
            <p className="text-sm md:text-base leading-relaxed text-white/90">
              {t("cta.desc")}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button to="/register" variant="white" iconRight={<ArrowRight />}>
                {t("cta.button")}
              </Button>
              <Button to="/contact" variant="outline" iconRight={<ArrowRight />}>
                {t("cta.contact")}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
