/**
 * SkillBar — animated progress bar for a single skill score (0–5).
 *
 * Color scheme:
 *   0.0 – 1.5  → red/orange gradient
 *   1.5 – 3.0  → yellow/amber gradient
 *   3.0 – 5.0  → green gradient
 *
 * Animates from 0 → score on mount via CSS transition.
 */
import { useState, useEffect, useId } from "react";
import { useTranslation } from "react-i18next";

export type SkillBarProps = {
  /** Score in [0, 5] */
  score: number;
  /** Number of data points (for tooltip) */
  sampleSize?: number;
  /** ISO timestamp (for tooltip) */
  lastUpdatedAt?: string | null;
  /** Additional className */
  className?: string;
  /** Accessible label for the bar (e.g. skill name) */
  label?: string;
};

/** Returns tailwind-compatible gradient stop colours based on score 0–5. */
export function getSkillBarColor(score: number): string {
  if (score < 1.5) {
    return "from-red-500 to-orange-400";
  }
  if (score < 3.0) {
    return "from-yellow-400 to-amber-300";
  }
  return "from-green-500 to-emerald-400";
}

/** Returns accessible aria-valuetext for the score. */
export function getSkillLevel(score: number): string {
  if (score < 1.0) return "Beginner";
  if (score < 2.0) return "Elementary";
  if (score < 3.0) return "Intermediate";
  if (score < 4.0) return "Upper intermediate";
  if (score < 4.8) return "Advanced";
  return "Mastery";
}

export default function SkillBar({
  score,
  sampleSize,
  lastUpdatedAt,
  className = "",
  label,
}: SkillBarProps) {
  const { t } = useTranslation();
  const [displayWidth, setDisplayWidth] = useState(0);
  const tooltipId = useId();

  // Animate in on mount
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setDisplayWidth(Math.min(Math.max(score, 0), 5) / 5);
    });
    return () => cancelAnimationFrame(frame);
  }, [score]);

  const colorClasses = getSkillBarColor(score);
  const pct = Math.round(displayWidth * 100);
  const levelLabel = getSkillLevel(score);

  const tooltipParts: string[] = [];
  if (sampleSize !== undefined) {
    tooltipParts.push(
      t("skills.bar.sampleSize", { count: sampleSize, defaultValue: `${sampleSize} attempts` })
    );
  }
  if (lastUpdatedAt) {
    const date = new Date(lastUpdatedAt).toLocaleDateString();
    tooltipParts.push(
      t("skills.bar.lastUpdated", { date, defaultValue: `Last: ${date}` })
    );
  }
  const tooltip = tooltipParts.join(" · ");

  return (
    <div className={`w-full ${className}`} title={tooltip || undefined}>
      {/* Track */}
      <div
        role="progressbar"
        aria-label={label ?? t("skills.bar.ariaLabel", { defaultValue: "Skill score" })}
        aria-valuenow={Math.round(score * 10) / 10}
        aria-valuemin={0}
        aria-valuemax={5}
        aria-valuetext={`${levelLabel} (${score.toFixed(1)} / 5)`}
        aria-describedby={tooltip ? tooltipId : undefined}
        className="relative h-2.5 w-full rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden"
      >
        {/* Fill */}
        <div
          className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${colorClasses} transition-[width] duration-700 ease-out`}
          style={{ width: `${pct}%` }}
        />
      </div>
      {/* Hidden tooltip description for screen readers */}
      {tooltip && (
        <span id={tooltipId} className="sr-only">
          {tooltip}
        </span>
      )}
    </div>
  );
}
