import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { CefrBadge } from "@/components/CefrBadge";
import type { CefrLevel } from "@/features/lessons/lesson.types";
import { getSkillBarColor } from "@/features/skills/components/SkillBar";
import { SKILL_LABELS } from "@/features/skills/skills.types";
import type { SkillScore } from "@/features/skills/skills.types";

type ActivityCounts = {
  lessons_completed: number;
  exercises_attempted: number;
  exercises_correct: number;
  flashcards_reviewed: number;
  flashcards_mastered: number;
};

const DASHBOARD_SKILL_KEYS = [
  "grammar_accuracy", "vocabulary_accuracy", "grammar_range", "vocabulary_range",
  "fluency", "pronunciation", "listening_comprehension", "reading_comprehension",
  "writing_organization", "task_completion", "interaction_quality",
] as const;

type Props = {
  activity: ActivityCounts;
  lastActiveAt: string | null;
  timezone: string;
  /** Learner's estimated CEFR proficiency. When provided, a badge is shown in the card header. */
  cefrEstimate?: CefrLevel | null;
  /** Learner's self-set target CEFR level. When provided, a 'Target: X' pill is shown. */
  targetCefrLevel?: CefrLevel | null;
  /** Number of review items due. When > 0, a review prompt button is shown. */
  reviewDueCount?: number;
  /** Skill scores for the mini skill breakdown section. */
  skillScores?: SkillScore[];
};

function localDayInTz(d: Date, tz: string): Date {
  // Convert d into a Date that represents the local-day midnight in tz.
  const dateStr = d.toLocaleDateString("en-CA", { timeZone: tz }); // YYYY-MM-DD
  return new Date(`${dateStr}T00:00:00Z`);
}

function relativeStudyLabel(lastActiveAt: string | null, tz: string, t: TFunction): string {
  if (!lastActiveAt) return t("dashboard.yourProgress.lastStudied.never");
  const lastLocal = localDayInTz(new Date(lastActiveAt), tz);
  const todayLocal = localDayInTz(new Date(), tz);
  const diffMs = todayLocal.getTime() - lastLocal.getTime();
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  if (diffDays <= 0) return t("dashboard.yourProgress.lastStudied.today");
  if (diffDays === 1) return t("dashboard.yourProgress.lastStudied.yesterday");
  return t("dashboard.yourProgress.lastStudied.daysAgo", { count: diffDays });
}

export default function YourProgressCard({ activity, lastActiveAt, timezone, cefrEstimate, targetCefrLevel, reviewDueCount, skillScores }: Props) {
  const { t } = useTranslation();
  const accuracy = activity.exercises_attempted > 0
    ? Math.round((activity.exercises_correct / activity.exercises_attempted) * 100)
    : 0;
  const relative = relativeStudyLabel(lastActiveAt, timezone, t);

  // Filter to only the 3 dashboard skill keys, in order
  const miniSkills = DASHBOARD_SKILL_KEYS
    .map((key) => skillScores?.find((s) => s.skill === key))
    .filter((s): s is SkillScore => s != null);

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-semantic-text">
          {t("dashboard.yourProgress.heading")}
        </h2>
        <div className="flex items-center gap-2">
          {targetCefrLevel && (
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
              title={t("dashboard.yourProgress.targetLevel", { level: targetCefrLevel, defaultValue: `Target: ${targetCefrLevel}` })}
            >
              <span className="text-amber-400" aria-hidden="true">🎯</span>
              {t("dashboard.yourProgress.targetLabel", { defaultValue: "Target:" })} {targetCefrLevel}
            </span>
          )}
          {cefrEstimate && (
            <CefrBadge
              level={cefrEstimate}
              size="sm"
              aria-label={t("dashboard.yourProgress.cefrEstimate", { level: cefrEstimate, defaultValue: `CEFR estimate: ${cefrEstimate}` })}
            />
          )}
        </div>
      </div>

      <ul className="space-y-2 text-sm text-semantic-text">
        <li>{t("dashboard.yourProgress.lessonsCompleted", { count: activity.lessons_completed })}</li>
        <li>{t("dashboard.yourProgress.exercises", {
          attempts: activity.exercises_attempted,
          accuracy,
        })}</li>
        <li>{t("dashboard.yourProgress.flashcards", {
          reviewed: activity.flashcards_reviewed,
          mastered: activity.flashcards_mastered,
        })}</li>
        <li>{t("dashboard.yourProgress.lastStudied.label", { relative })}</li>
      </ul>

      {/* Review due prompt */}
      {reviewDueCount != null && reviewDueCount > 0 && (
        <div className="mt-4">
          <Link
            to="/review"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            <span
              className="w-2 h-2 rounded-full bg-orange-400 animate-pulse flex-shrink-0"
              aria-hidden="true"
            />
            {t("dashboard.yourProgress.reviewDue", {
              count: reviewDueCount,
              defaultValue: `Today's review: ${reviewDueCount} due`,
            })}
          </Link>
        </div>
      )}

      {/* Skill breakdown mini-row */}
      {miniSkills.length > 0 && (
        <div className="mt-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
              {t("dashboard.yourProgress.skillBreakdown", { defaultValue: "Skill breakdown" })}
            </span>
            <Link
              to="/skills"
              className="text-xs text-primary-600 dark:text-primary-400 hover:underline"
            >
              {t("dashboard.yourProgress.viewAllSkills", { defaultValue: "View all skills" })}
            </Link>
          </div>
          <ul className="space-y-1">
            {miniSkills.map((skill) => {
              const colorClasses = getSkillBarColor(skill.score);
              const pct = Math.round((Math.min(Math.max(skill.score, 0), 5) / 5) * 100);
              return (
                <li key={skill.skill} className="flex items-center gap-2">
                  <span className="w-24 text-xs text-gray-500 dark:text-gray-400 truncate flex-shrink-0">
                    {SKILL_LABELS[skill.skill]}
                  </span>
                  <div className="flex-1 h-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r ${colorClasses}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
                    {skill.score.toFixed(0)}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
