/**
 * Helper functions for SkillBar — kept in a separate module so the .tsx file
 * only exports its component (satisfies react-refresh/only-export-components).
 */

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
