import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Users, BookOpen, Activity, CreditCard, BarChart2, Settings, Mail, Trash2 } from "lucide-react";

type Tab = "overview" | "teachers" | "classes" | "billing" | "usage";

// Stub teacher list for Feature 55
const STUB_TEACHERS = [
  { id: "t1", name: "Sarah Connor", email: "sarah@school.edu", classes: 2, status: "active" as const },
  { id: "t2", name: "John Smith", email: "john@school.edu", classes: 1, status: "active" as const },
  { id: "t3", name: "Pending Invite", email: "new@school.edu", classes: 0, status: "pending" as const },
];

// Stub class usage data for Feature 71
const STUB_CLASS_USAGE = [
  { id: "c1", name: "Morning A1 Group", students: 8, completionRate: 72, avgScore: 3.8, lastActive: "2026-05-04" },
  { id: "c2", name: "Evening A2 Group", students: 5, completionRate: 55, avgScore: 3.2, lastActive: "2026-05-03" },
  { id: "c3", name: "Weekend Beginners", students: 4, completionRate: 88, avgScore: 4.1, lastActive: "2026-05-05" },
];

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

      {/* Teachers tab (Feature 55) */}
      {activeTab === "teachers" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-semantic-text">Teachers ({STUB_TEACHERS.length})</h2>
            <button
              type="button"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
              onClick={() => alert("Invite teacher — backend endpoint POST /api/v1/orgs/:slug/teachers")}
            >
              <Mail className="w-4 h-4" />
              Invite teacher
            </button>
          </div>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Name</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Email</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Classes</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {STUB_TEACHERS.map((teacher) => (
                  <tr key={teacher.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-semantic-text">{teacher.name}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{teacher.email}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{teacher.classes}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        teacher.status === "active"
                          ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                          : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
                      }`}>
                        {teacher.status === "active" ? "Active" : "Pending"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        aria-label="Remove teacher"
                        className="p-1 rounded text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                        onClick={() => alert("Remove teacher")}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Usage tab (Feature 71) */}
      {activeTab === "usage" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-semantic-text">Class Progress &amp; Usage</h2>
            <span className="text-xs text-gray-400 dark:text-gray-500">Updated daily</span>
          </div>
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Class</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Students</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Completion</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Avg Score</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {STUB_CLASS_USAGE.map((cls) => (
                  <tr key={cls.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-semantic-text">{cls.name}</td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{cls.students}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${cls.completionRate >= 80 ? "bg-green-500" : cls.completionRate >= 50 ? "bg-amber-500" : "bg-red-500"}`}
                            style={{ width: `${cls.completionRate}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">{cls.completionRate}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`font-medium ${cls.avgScore >= 4 ? "text-green-600 dark:text-green-400" : cls.avgScore >= 3 ? "text-amber-600 dark:text-amber-400" : "text-red-600 dark:text-red-400"}`}>
                        {cls.avgScore.toFixed(1)} / 5
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">
                      {new Date(cls.lastActive).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-semantic-text mb-3">Seat Usage</h3>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-3 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <div className="h-full rounded-full bg-primary-500" style={{ width: `${seatPct}%` }} />
              </div>
              <span className="text-sm font-medium text-semantic-text">{SEAT_USED}/{SEAT_TOTAL} seats</span>
            </div>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Total activity events this month: 120
            </p>
          </div>
        </div>
      )}

      {/* Classes and Billing tabs — link to dedicated pages */}
      {(activeTab === "classes" || activeTab === "billing") && (
        <div className="card p-12 text-center text-gray-500 dark:text-gray-400 text-sm">
          {activeTab === "billing" ? (
            <Link
              to={`/admin/orgs/${slug}/billing`}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
            >
              <CreditCard className="w-4 h-4" />
              {t("orgAdmin.billing")}
            </Link>
          ) : (
            <span>{label(activeTab)} — coming soon</span>
          )}
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
