import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, CreditCard, X, Users, Mail } from "lucide-react";

const SEAT_USED = 15;
const SEAT_TOTAL = 50;

export default function OrgBillingPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const seatPct = Math.round((SEAT_USED / SEAT_TOTAL) * 100);

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 py-8">
      <Link
        to={`/admin/orgs/${slug}`}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-semantic-text mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to overview
      </Link>

      <h1 className="text-2xl font-bold text-semantic-text mb-6">{t("orgAdmin.billing")}</h1>

      {/* Current plan */}
      <div className="card p-6 mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-xs uppercase tracking-wide font-medium text-gray-400 dark:text-gray-500 mb-1">
              Current plan
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-semantic-text">Starter</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                Starter
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowUpgradeModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-colors"
          >
            <CreditCard className="w-4 h-4" />
            {t("orgAdmin.upgrade")}
          </button>
        </div>

        <div className="space-y-3 text-sm">
          <div className="flex items-center justify-between text-semantic-text">
            <span>Included seats</span>
            <span className="font-medium">{SEAT_TOTAL}</span>
          </div>
          <div className="flex items-center justify-between text-semantic-text">
            <span>Used seats</span>
            <span className="font-medium">{SEAT_USED}</span>
          </div>
          <div>
            <div className="flex items-center justify-between mb-1 text-gray-500 dark:text-gray-400">
              <span>Seat usage</span>
              <span>{seatPct}%</span>
            </div>
            <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary-500 transition-all"
                style={{ width: `${seatPct}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Plan features */}
      <div className="card p-6 mb-6">
        <h2 className="text-sm font-semibold text-semantic-text mb-4">Starter plan includes</h2>
        <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
          {[
            "Up to 50 students",
            "Unlimited lessons and flashcards",
            "Basic analytics",
            "Teacher portal",
            "Email support",
          ].map((feature) => (
            <li key={feature} className="flex items-center gap-2">
              <span className="text-green-500" aria-hidden="true">✓</span>
              {feature}
            </li>
          ))}
        </ul>
      </div>

      {/* Upgrade prompt */}
      <div className="card p-6 border-dashed border-2 border-gray-200 dark:border-gray-700 text-center">
        <p className="text-base font-medium text-semantic-text mb-2">
          Need more seats or features?
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {t("orgAdmin.contactUs")} — we have plans for schools, universities, and enterprises.
        </p>
        <button
          type="button"
          onClick={() => setShowUpgradeModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
        >
          {t("orgAdmin.upgrade")}
        </button>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowUpgradeModal(false)}
            aria-hidden="true"
          />
          <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-semantic-text">
                {t("orgAdmin.upgrade")}
              </h2>
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-400"
                aria-label={t("common.close", { defaultValue: "Close" })}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                To upgrade your plan, please contact our team. We offer custom pricing for schools,
                universities, and enterprise customers.
              </p>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <Mail className="w-5 h-5 text-primary-500 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Email us at</p>
                  <a
                    href="mailto:contact@gainenglish.com"
                    className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
                  >
                    contact@gainenglish.com
                  </a>
                </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <Users className="w-5 h-5 text-primary-500 flex-shrink-0" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Current plan</p>
                  <p className="text-sm font-medium text-semantic-text">
                    Starter · {SEAT_USED}/{SEAT_TOTAL} seats
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowUpgradeModal(false)}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-semantic-text text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Close
              </button>
              <a
                href="mailto:contact@gainenglish.com"
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
              >
                <Mail className="w-4 h-4" />
                Send email
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
