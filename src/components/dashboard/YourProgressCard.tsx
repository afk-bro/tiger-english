import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";

type ActivityCounts = {
  lessons_completed: number;
  exercises_attempted: number;
  exercises_correct: number;
  flashcards_reviewed: number;
  flashcards_mastered: number;
};

type Props = {
  activity: ActivityCounts;
  lastActiveAt: string | null;
  timezone: string;
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

export default function YourProgressCard({ activity, lastActiveAt, timezone }: Props) {
  const { t } = useTranslation();
  const accuracy = activity.exercises_attempted > 0
    ? Math.round((activity.exercises_correct / activity.exercises_attempted) * 100)
    : 0;
  const relative = relativeStudyLabel(lastActiveAt, timezone, t);

  return (
    <div className="card p-6">
      <h2 className="text-lg font-semibold text-semantic-text mb-4">
        {t("dashboard.yourProgress.heading")}
      </h2>
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
    </div>
  );
}
