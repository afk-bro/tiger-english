import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { TrialCtaCard } from "@/features/ai-tutor/components/TrialCtaCard";
import { FeaturedLessonCard } from "@/features/ai-tutor/components/FeaturedLessonCard";
import { ScenarioCard } from "@/features/ai-tutor/components/ScenarioCard";
import { tutorAPI } from "@/features/ai-tutor/api/tutor";
import { useUserStore } from "@/stores/useUserStore";
import type { TutorScenarioSummary } from "@/features/ai-tutor/types";

/**
 * AI Tutor home page.
 *
 * Layout:
 *   - Optional VI banner (shown to non-Vietnamese learners; dismissible)
 *   - Trial CTA card (toast on click — full trial flow not wired up)
 *   - Lessons header + featured (first) scenario as a hero card
 *   - Free Talk header + grid of remaining scenarios
 *
 * The Free Talk section keeps `id="free-talk"` so the bottom-nav anchor
 * link can scroll to it even when only the seed scenario exists.
 */
export default function AiTutorHomePage() {
  const { t } = useTranslation();
  const profile = useUserStore((s) => s.profile);
  const location = useLocation();
  const [scenarios, setScenarios] = useState<TutorScenarioSummary[] | null>(
    null,
  );
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);

  // React Router pushState navigation to `/ai-tutor#free-talk` (the bottom-nav
  // entry) updates `location.hash` but doesn't natively scroll to the anchor.
  // Run this after scenarios load — the #free-talk section only mounts in the
  // loaded UI tree.
  useEffect(() => {
    if (!location.hash || isLoading) return;
    const el = document.querySelector(location.hash);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [location.hash, isLoading]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    tutorAPI
      .listScenarios()
      .then((res) => {
        if (!cancelled) setScenarios(res);
      })
      .catch((err) => {
        if (!cancelled) setError(err as Error);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (isLoading) {
    return (
      <p className="py-8 text-center text-gray-500">
        {t("tutor.home.loading", { defaultValue: "Loading…" })}
      </p>
    );
  }
  if (error) {
    return <p className="py-8 text-center text-red-600">{error.message}</p>;
  }
  if (!scenarios || scenarios.length === 0) {
    return (
      <p className="py-8 text-center text-gray-500">
        {t("tutor.home.empty", {
          defaultValue: "No scenarios available yet.",
        })}
      </p>
    );
  }

  const featured = scenarios[0];
  const rest = scenarios.slice(1);
  const showViBanner =
    profile && profile.native_language !== "vi" && !bannerDismissed;

  return (
    <div className="space-y-6 py-4">
      {showViBanner && (
        <div className="flex items-start justify-between rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950/50 dark:border-amber-700 dark:text-amber-100">
          <p>
            {t("tutor.home.nonViBanner", {
              defaultValue:
                "AI Tutor is currently optimized for Vietnamese learners. English-only mode coming soon.",
            })}
          </p>
          <button
            type="button"
            onClick={() => setBannerDismissed(true)}
            className="ml-3 text-amber-700 hover:text-amber-900"
            aria-label={t("tutor.home.dismissBanner", {
              defaultValue: "Dismiss",
            })}
          >
            ×
          </button>
        </div>
      )}

      <TrialCtaCard />

      <section>
        <h2 className="px-1 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {t("tutor.home.lessonsHeader", { defaultValue: "Lessons" })}
        </h2>
        <div className="mt-3">
          <FeaturedLessonCard scenario={featured} />
        </div>
      </section>

      <section id="free-talk">
        <h2 className="px-1 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {t("tutor.home.freeTalkHeader", { defaultValue: "Free Talk" })}
        </h2>
        <p className="px-1 mt-1 text-xs text-gray-500 dark:text-gray-400">
          {t("tutor.home.freeTalkSubtitle", {
            defaultValue:
              "Practice real conversations in everyday situations.",
          })}
        </p>
        {rest.length > 0 ? (
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {rest.map((s) => (
              <ScenarioCard key={s.slug} scenario={s} />
            ))}
          </div>
        ) : (
          // Single-scenario seed: the only scenario is the featured one above.
          // Still keep the section header (and id="free-talk") for nav-anchor
          // consistency with the footer/bottom-nav.
          <p className="px-1 mt-3 text-xs text-gray-400">
            {t("tutor.home.moreSoon", {
              defaultValue: "More scenarios coming soon.",
            })}
          </p>
        )}
      </section>
    </div>
  );
}
