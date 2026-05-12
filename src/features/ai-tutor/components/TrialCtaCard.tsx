import { useTranslation } from "react-i18next";
import { toast } from "sonner";

/**
 * Trial CTA banner at the top of the AI Tutor home page.
 *
 * Tapping the card surfaces a toast explaining that the full free-trial
 * flow isn't wired up yet — the tutor is currently free for everyone
 * while we're still in the beta window.
 */
export function TrialCtaCard() {
  const { t } = useTranslation();

  const onClick = () => {
    toast(
      t("tutor.home.trialToast", {
        defaultValue:
          "Free trial coming soon — your AI Tutor is currently free!",
      }),
    );
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left rounded-2xl p-6 bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow"
    >
      <h2 className="text-lg font-semibold">
        {t("tutor.home.trialTitle", {
          defaultValue: "Get unlimited AI Tutor access free",
        })}
      </h2>
      <p className="mt-2 text-sm text-primary-50">
        {t("tutor.home.trialBody", { defaultValue: "Start your free trial" })}
      </p>
    </button>
  );
}
