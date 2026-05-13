import { useEffect, useRef } from "react";
import AuthHomeLegacy from "./AuthHomeLegacy";
import { TutorHeroCard } from "@/components/home/authenticated/TutorHeroCard";
import { ScenarioShortcutsRow } from "@/components/home/authenticated/ScenarioShortcutsRow";
import { TodayReviewCard } from "@/components/home/authenticated/TodayReviewCard";
import { ContinueLessonCard } from "@/components/home/authenticated/ContinueLessonCard";
import { useActiveTutorSession } from "@/features/ai-tutor/hooks/useActiveTutorSession";
import { useScenariosList } from "@/features/ai-tutor/hooks/useScenariosList";
import { reportTutorEvent } from "@/features/ai-tutor/api/events";

export default function AuthHome() {
  const aiTutorEnabled = import.meta.env.VITE_AI_TUTOR_ENABLED === "true";
  if (!aiTutorEnabled) return <AuthHomeLegacy />;

  return <AuthHomeTutorFirst />;
}

function AuthHomeTutorFirst() {
  const {
    data: activeSession,
    isLoading: activeLoading,
    error: activeError,
  } = useActiveTutorSession();
  const { data: scenarios, isLoading: listLoading } = useScenariosList();

  // Fire-once on the first null → Error transition. The ref guard prevents
  // double-emission under React.StrictMode (which intentionally re-runs
  // effects in dev) and on any future re-fetch attempts within the same
  // page mount — one fetch failure should produce exactly one telemetry row.
  const reportedFetchFailureRef = useRef(false);
  useEffect(() => {
    if (activeError && !reportedFetchFailureRef.current) {
      reportedFetchFailureRef.current = true;
      void reportTutorEvent("home.tutor_hero.active_session_fetch_failed");
    }
  }, [activeError]);

  const featuredScenario =
    scenarios && scenarios.length > 0 ? scenarios[0] : null;

  return (
    <div className="max-w-5xl mx-auto space-y-4 pt-6">
      <TutorHeroCard
        activeSession={activeSession}
        featuredScenario={featuredScenario}
        isLoading={activeLoading || listLoading}
      />
      <ScenarioShortcutsRow scenarios={scenarios} isLoading={listLoading} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TodayReviewCard />
        <ContinueLessonCard />
      </div>
    </div>
  );
}
