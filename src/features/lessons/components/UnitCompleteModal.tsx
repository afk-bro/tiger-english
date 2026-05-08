/**
 * UnitCompleteModal — celebration overlay shown the first time a user
 * finishes every section in a unit.
 *
 * Trigger lives in the parent (SectionPage / UnitHub) so the modal
 * itself stays a pure presentational component. The "shown once per
 * unit" guarantee is enforced via localStorage in the parents — see
 * `unitCelebration.ts`.
 *
 * Confetti is fired once on mount via canvas-confetti. Two bursts from
 * either side gives a fuller effect than a single center burst at the
 * 1024×1024 resolution most browsers run at.
 */
import { useEffect } from "react";
import { Dialog } from "@headlessui/react";
import { PartyPopper, ArrowRight, ArrowLeft, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import confetti from "canvas-confetti";

type NextUnit = {
  slug: string;
  /** Pre-localized title — caller resolves the learner-language variant. */
  title: string;
  number: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  unitNumber: number;
  /** Pre-localized unit title from the caller. */
  unitTitle: string;
  /** When undefined, the only CTA is "Back to lessons". */
  nextUnit?: NextUnit;
};

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function fireConfetti() {
  // Respect the user's OS-level motion preference. The modal itself
  // (icon, copy, CTAs) is the meaningful celebration; the confetti is
  // decorative and skipping it for reduced-motion users avoids
  // animation that can trigger nausea or vestibular discomfort.
  if (prefersReducedMotion()) return;

  // Two side bursts angled inward — feels celebratory without feeling
  // like an ad. Particle count kept moderate so low-end devices don't
  // stutter. Origin x is the firing point on each side; spread is the
  // angular range, in degrees.
  const common = {
    particleCount: 80,
    spread: 70,
    startVelocity: 45,
    ticks: 200,
    gravity: 0.9,
    decay: 0.92,
    scalar: 1.0,
  } as const;
  confetti({ ...common, angle: 60, origin: { x: 0, y: 0.7 } });
  confetti({ ...common, angle: 120, origin: { x: 1, y: 0.7 } });
}

export default function UnitCompleteModal({
  open,
  onClose,
  unitNumber,
  unitTitle,
  nextUnit,
}: Props) {
  const { t } = useTranslation();

  useEffect(() => {
    if (open) fireConfetti();
  }, [open]);

  return (
    <Dialog open={open} onClose={onClose} className="relative z-50">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        aria-hidden="true"
      />
      <div className="fixed inset-0 flex items-center justify-center p-4 overflow-y-auto">
        <Dialog.Panel className="relative w-full max-w-md rounded-2xl bg-semantic-surface text-semantic-text border border-semantic-border shadow-2xl p-8 text-center">
          <button
            type="button"
            onClick={onClose}
            aria-label={t("common.close", { defaultValue: "Close" })}
            className="absolute top-3 right-3 p-1.5 rounded-md text-semantic-text-muted hover:text-semantic-text hover:bg-semantic-surface-2 transition-colors"
          >
            <X className="w-5 h-5" aria-hidden="true" />
          </button>

          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-green-100 dark:bg-green-900/40 p-4">
              <PartyPopper
                className="w-10 h-10 text-green-600 dark:text-green-300"
                aria-hidden="true"
              />
            </div>
          </div>

          <Dialog.Title className="text-2xl font-bold mb-2">
            {t("lessons.unitComplete.title", {
              number: unitNumber,
              defaultValue: `Unit ${unitNumber} complete!`,
            })}
          </Dialog.Title>
          <Dialog.Description className="text-base text-semantic-text-muted mb-1">
            {unitTitle}
          </Dialog.Description>
          <p className="text-sm text-semantic-text-muted mb-6">
            {t("lessons.unitComplete.subtitle", {
              defaultValue:
                "Great work — you finished every section. Keep the momentum going.",
            })}
          </p>

          <div className="flex flex-col gap-2">
            {nextUnit ? (
              <Link
                to={`/lessons/${nextUnit.slug}`}
                onClick={onClose}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary-500 text-white text-base font-semibold hover:bg-primary-600 transition-colors"
              >
                {t("lessons.unitComplete.nextUnitCta", {
                  number: nextUnit.number,
                  title: nextUnit.title,
                  defaultValue: `Start Unit ${nextUnit.number} — ${nextUnit.title}`,
                })}
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </Link>
            ) : (
              <Link
                to="/lessons"
                onClick={onClose}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-primary-500 text-white text-base font-semibold hover:bg-primary-600 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" aria-hidden="true" />
                {t("lessons.unitComplete.backToLessons", {
                  defaultValue: "Back to lessons",
                })}
              </Link>
            )}
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-sm font-medium text-semantic-text-muted hover:text-semantic-text transition-colors"
            >
              {t("lessons.unitComplete.keepReviewing", {
                defaultValue: "Keep reviewing this unit",
              })}
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
