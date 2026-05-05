import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Users, BookOpen, Activity, CreditCard, BarChart2, Settings } from "lucide-react";

type Tab = "overview" | "teachers" | "classes" | "billing" | "usage";

const STAT_CARDS = [
  { label: "Total students", value: 15, icon: Users, color: "text-blue-500" },
  { label: "Active classes", value: 3, icon: BookOpen, color: "text-green-500" },
  { label: "This month activity", value: 120, icon: Activity, color: "text-purple-500" },
];

const SEAT_USED = 15;
const SEAT_TOTAL = 50;

export default function OrgOverviewPage() {
  const { slug } = useParams<{ slug: string }>();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const orgName = slug
    ? slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
    : "Organisation";

  const seatPct = Math.round((SEAT_USED / SEAT_TOTAL) * 100);

  const TABS: { key: Tab; label: string; icon: typeof Settings }[] = [
    { key: "overview", label: t("orgAdmin.overview"), icon: Settings },
    { key: "teachers", label: "Teachers", icon: Users },
    { key: "classes", label: "Classes", icon: BookOpen },
    { key: "billing", label: t("orgAdmin.billing"), icon: CreditCard },
    { key: "usage", label: t("orgAdmin.usage"), icon: BarChart2 },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-bold text-semantic-text">{orgName}</h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              Starter
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
              <Users className="w-3.5 h-3.5" />
              <span>
                {SEAT_USED} / {SEAT_TOTAL} seats
              </span>
            </div>
            <div className="flex-1 w-32 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary-500"
                style={{ width: `${seatPct}%` }}
              />
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500">{seatPct}%</span>
          </div>
        </div>
        <Link
          to={`/admin/orgs/${slug}/billing`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium transition-colors"
        >
          <CreditCard className="w-4 h-4" />
          {t("orgAdmin.upgrade")}
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700 mb-6 overflow-x-auto">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            type="button"
            onClick={() => setActiveTab(key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              activeTab === key
                ? "border-primary-500 text-primary-600 dark:text-primary-400"
                : "border-transparent text-gray-500 dark:text-gray-400 hover:text-semantic-text"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Overview tab */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {STAT_CARDS.map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="card p-5 flex items-center gap-4">
                <div className={`p-3 rounded-xl bg-gray-100 dark:bg-gray-800 ${color}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-semantic-text">{value}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-semantic-text mb-3">Seat Usage</h2>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary-500 transition-all duration-500"
                  style={{ width: `${seatPct}%` }}
                />
              </div>
              <span className="text-sm font-medium text-semantic-text">
                {SEAT_USED}/{SEAT_TOTAL}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Other tabs — stub */}
      {activeTab !== "overview" && (
        <div className="card p-12 text-center text-gray-500 dark:text-gray-400 text-sm">
          {label(activeTab)} — coming soon
        </div>
      )}
    </div>
  );
}

function label(tab: Tab): string {
  const map: Record<Tab, string> = {
    overview: "Overview",
    teachers: "Teachers",
    classes: "Classes",
    billing: "Billing",
    usage: "Usage",
  };
  return map[tab];
}
