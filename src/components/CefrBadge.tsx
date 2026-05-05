import { clsx } from "clsx";
import type { CefrLevel } from "@/features/lessons/lesson.types";

export type CefrBadgeSize = "sm" | "md" | "lg";

interface CefrBadgeProps {
  level: CefrLevel | string;
  size?: CefrBadgeSize;
  className?: string;
}

/**
 * Pill-shaped CEFR level badge with level-appropriate color coding.
 *
 * Color scheme:
 *  - A0/A1  → stone (beginner)
 *  - A2/B1  → sky (elementary–intermediate)
 *  - B1+/B2 → indigo (upper-intermediate)
 *  - C1     → violet (advanced)
 */
export function CefrBadge({ level, size = "md", className }: CefrBadgeProps) {
  const sizeClasses: Record<CefrBadgeSize, string> = {
    sm: "h-5 px-2 text-xs",
    md: "h-6 px-3 text-sm",
    lg: "h-8 px-4 text-base",
  };

  const colorClasses = getCefrColorClasses(level);

  return (
    <span
      className={clsx(
        "inline-flex items-center justify-center rounded-full font-semibold uppercase tracking-wide",
        sizeClasses[size],
        colorClasses,
        className
      )}
      aria-label={`CEFR level ${level}`}
    >
      {level}
    </span>
  );
}

/**
 * Returns Tailwind color classes for a given CEFR level string.
 * A0/A1 → stone, A2/B1 → sky, B1+/B2 → indigo, C1 → violet
 */
export function getCefrColorClasses(level: string): string {
  if (level === "A0" || level === "A1") {
    return "bg-stone-100 text-stone-700 dark:bg-stone-800 dark:text-stone-300";
  }
  if (level === "A2" || level === "B1") {
    return "bg-sky-100 text-sky-700 dark:bg-sky-900 dark:text-sky-200";
  }
  if (level === "B1+" || level === "B2") {
    return "bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200";
  }
  if (level === "C1") {
    return "bg-violet-100 text-violet-700 dark:bg-violet-900 dark:text-violet-200";
  }
  // Default (unknown level)
  return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
}

export default CefrBadge;
