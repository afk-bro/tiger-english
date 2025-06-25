// src/components/home/FinalCtaSection.tsx
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "../ui/Button";

export default function FinalCtaSection() {
  const { t } = useTranslation();

  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 dark:from-primary-800 dark:via-primary-700 dark:to-accent-700"></div>
      <div className="relative text-center py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            {t("cta.heading")}
          </h2>
          <p className="text-xl text-white/90 max-w-2xl mx-auto mb-12">
            {t("cta.desc")}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link to="/register">
              <Button
                to="/register"
                variant="primary"
                iconRight={<ArrowRight />}
              >
                {t("cta.button")}
              </Button>
            </Link>
            <Link to="/contact">
              <Button to="/contact" variant="outline" iconRight={<ArrowRight />}>
                {t("cta.contact")}
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
