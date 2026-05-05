import { useParams, Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle2, AlertTriangle, RotateCcw, LayoutDashboard } from "lucide-react";

// ─── Confetti ─────────────────────────────────────────────────────────────────

const CONFETTI_CSS = `
@keyframes confetti-fall {
  0%   { transform: translateY(-20px) rotate(0deg); opacity: 1; }
  100% { transform: translateY(100vh) rotate(720deg); opacity: 0; }
}
@media (prefers-reduced-motion: no-preference) {
  .confetti-piece {
    animation: confetti-fall 3s ease-in forwards;
  }
}
`;

const CONFETTI_COLORS = ["#326de2", "#fcd34d", "#34d399", "#f87171", "#a78bfa", "#fb923c"];

function Confetti() {
  const pieces = Array.from({ length: 40 }, (_, i) => i);
  return (
    <>
      <style>{CONFETTI_CSS}</style>
      <div
        className="fixed inset-0 pointer-events-none overflow-hidden z-50"
        aria-hidden="true"
      >
        {pieces.map((i) => (
          <div
            key={i}
            className="confetti-piece absolute w-2 h-2 rounded-sm"
            style={{
              left: `${Math.random() * 100}%`,
              top: `-${Math.random() * 20 + 5}px`,
              backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
              animationDelay: `${Math.random() * 1.5}s`,
              animationDuration: `${2.5 + Math.random() * 1.5}s`,
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
          />
        ))}
      </div>
    </>
  );
}

// ─── Skill Scores ─────────────────────────────────────────────────────────────

const SKILL_SCORES = [
  { skill: "Listening Comprehension", score: 3.5, max: 5 },
  { skill: "Reading Comprehension", score: 4.0, max: 5 },
  { skill: "Vocabulary Range", score: 3.0, max: 5 },
  { skill: "Grammar Accuracy", score: 3.5, max: 5 },
  { skill: "Speaking Fluency", score: 2.5, max: 5 },
  { skill: "Writing Organisation", score: 4.5, max: 5 },
];

function scoreColor(score: number): string {
  if (score >= 4) return "bg-green-500";
  if (score >= 3) return "bg-primary-500";
  if (score >= 2) return "bg-amber-500";
  return "bg-red-500";
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AssessmentResultsPage() {
  const { username, level } = useParams<{ username: string; level: string }>();
  const [searchParams] = useSearchParams();
  const { t } = useTranslation();

  const displayLevel = level?.toUpperCase() ?? "A1";

  // Default to passed for stub; can be overridden via ?result=fail
  const passed = searchParams.get("result") !== "fail";

  const averageScore =
    SKILL_SCORES.reduce((sum, s) => sum + s.score, 0) / SKILL_SCORES.length;

  return (
    <div className="min-h-screen bg-semantic-bg">
      {passed && <Confetti />}

      <div className="max-w-2xl mx-auto px-4 py-12">
        {/* Verdict card */}
        <div
          className={`card p-8 text-center mb-8 ${
            passed
              ? "border-green-200 dark:border-green-800"
              : "border-amber-200 dark:border-amber-800"
          }`}
        >
          <div className="flex justify-center mb-4">
            {passed ? (
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            ) : (
              <AlertTriangle className="w-16 h-16 text-amber-500" />
            )}
          </div>
          <h1 className="text-3xl font-bold text-semantic-text mb-2">
            {passed ? t("assessment.results.passed") : t("assessment.results.needsWork")}
          </h1>
          <p className="text-base text-gray-600 dark:text-gray-400">
            {passed
              ? t("assessment.results.congratulations", { level: displayLevel })
              : t("assessment.results.keepPracticing")}
          </p>
          <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 dark:bg-gray-800 text-sm font-medium text-semantic-text">
            Average score: {averageScore.toFixed(1)} / 5.0
          </div>
        </div>

        {/* Skill breakdown */}
        <div className="card p-6 mb-8">
          <h2 className="text-base font-semibold text-semantic-text mb-4">
            {t("assessment.results.yourScores")}
          </h2>
          <div className="space-y-4">
            {SKILL_SCORES.map((item) => {
              const pct = Math.round((item.score / item.max) * 100);
              return (
                <div key={item.skill}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-semantic-text">{item.skill}</span>
                    <span className="text-sm font-semibold text-semantic-text">
                      {item.score.toFixed(1)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                    <div
                      className={`h-full rounded-full ${scoreColor(item.score)} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {!passed && (
            <div className="mt-5 p-4 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
              <p className="text-sm font-medium text-amber-700 dark:text-amber-300 mb-2">
                Focus areas
              </p>
              <ul className="space-y-1 text-sm text-amber-600 dark:text-amber-400">
                {SKILL_SCORES.filter((s) => s.score < 3.5).map((s) => (
                  <li key={s.skill} className="flex items-center gap-1.5">
                    <span aria-hidden="true">•</span>
                    {s.skill}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to={`/u/${username}/assessment/${level}`}
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg border border-gray-200 dark:border-gray-700 text-semantic-text text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
            {t("assessment.results.tryAgain")}
          </Link>
          <Link
            to="/dashboard"
            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
          >
            <LayoutDashboard className="w-4 h-4" />
            {t("assessment.results.backToDashboard")}
          </Link>
        </div>
      </div>
    </div>
  );
}
