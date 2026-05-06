import { clsx } from "clsx";
import type { CefrLevel } from "@/features/lessons/lesson.types";
import { getCefrColorClasses, type CefrBadgeSize } from "./cefrBadge.utils";

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

export default CefrBadge;
