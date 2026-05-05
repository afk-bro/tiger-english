// src/features/admin/pages/AdminAiUsagePage.tsx
import { useTranslation } from "react-i18next";
import { BarChart2, TrendingUp, Zap, Users } from "lucide-react";

// Stub daily cost data for the graph (last 7 days)
const DAILY_COSTS = [
  { date: "Apr 29", cost: 0.42 },
  { date: "Apr 30", cost: 0.61 },
  { date: "May 1", cost: 0.38 },
  { date: "May 2", cost: 0.75 },
  { date: "May 3", cost: 0.52 },
  { date: "May 4", cost: 0.89 },
  { date: "May 5", cost: 0.44 },
];

const ENDPOINT_BREAKDOWN = [
  { endpoint: "/me/ai-tutor/explain", calls: 142, avgTokens: 320, costEstimate: 1.82 },
  { endpoint: "/me/ai-tutor/explain/stream", calls: 98, avgTokens: 340, costEstimate: 1.33 },
  { endpoint: "/me/ai-tutor/correct", calls: 76, avgTokens: 280, costEstimate: 0.85 },
  { endpoint: "/me/ai-tutor/writing-coach", calls: 34, avgTokens: 680, costEstimate: 0.92 },
  { endpoint: "/me/ai-tutor/practice", calls: 58, avgTokens: 450, costEstimate: 1.04 },
  { endpoint: "/me/conversations/turn", calls: 210, avgTokens: 180, costEstimate: 1.51 },
];

const TOP_USERS = [
  { username: "alice_t", calls: 87, cost: 1.24 },
  { username: "bob_learn", calls: 64, cost: 0.91 },
  { username: "charlie_k", calls: 52, cost: 0.73 },
  { username: "diana_s", calls: 43, cost: 0.61 },
  { username: "evan_w", calls: 38, cost: 0.54 },
];

const maxCost = Math.max(...DAILY_COSTS.map((d) => d.cost));
const totalCost = ENDPOINT_BREAKDOWN.reduce((sum, e) => sum + e.costEstimate, 0);
const totalCalls = ENDPOINT_BREAKDOWN.reduce((sum, e) => sum + e.calls, 0);
const cacheHitRate = 18; // stub percentage

export default function AdminAiUsagePage() {
  const { t } = useTranslation();

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <BarChart2 className="w-6 h-6 text-primary-600 dark:text-primary-400" aria-hidden="true" />
        <h1 className="text-2xl font-bold text-semantic-text">
          {t("admin.aiUsage.title", { defaultValue: "AI Usage Dashboard" })}
        </h1>
        <span className="ml-auto text-xs text-gray-400 dark:text-gray-500">
          {t("admin.aiUsage.superAdminOnly", { defaultValue: "Super-admin only" })}
        </span>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="card p-4 flex flex-col gap-1">
          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total cost (7d)</span>
          <span className="text-2xl font-bold text-semantic-text">${totalCost.toFixed(2)}</span>
        </div>
        <div className="card p-4 flex flex-col gap-1">
          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total calls (7d)</span>
          <span className="text-2xl font-bold text-semantic-text">{totalCalls.toLocaleString()}</span>
        </div>
        <div className="card p-4 flex flex-col gap-1">
          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Cache hit rate</span>
          <span className="text-2xl font-bold text-semantic-text">{cacheHitRate}%</span>
        </div>
        <div className="card p-4 flex flex-col gap-1">
          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Avg cost/call</span>
          <span className="text-2xl font-bold text-semantic-text">
            ${(totalCost / totalCalls).toFixed(4)}
          </span>
        </div>
      </div>

      {/* Daily cost bar chart */}
      <div className="card p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="w-4 h-4 text-primary-500" aria-hidden="true" />
          <h2 className="text-sm font-semibold text-semantic-text">
            {t("admin.aiUsage.dailyCost", { defaultValue: "Daily AI Cost (USD)" })}
          </h2>
        </div>
        <div className="flex items-end gap-2 h-32" role="img" aria-label="Daily cost bar chart">
          {DAILY_COSTS.map(({ date, cost }) => {
            const heightPct = maxCost > 0 ? (cost / maxCost) * 100 : 0;
            return (
              <div key={date} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-xs text-gray-400 dark:text-gray-500">${cost.toFixed(2)}</span>
                <div className="w-full flex items-end justify-center" style={{ height: "80px" }}>
                  <div
                    className="w-full rounded-t bg-primary-500 dark:bg-primary-600 transition-all duration-500 motion-reduce:transition-none"
                    style={{ height: `${heightPct}%` }}
                    title={`${date}: $${cost.toFixed(2)}`}
                  />
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500 truncate w-full text-center">{date}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Per-endpoint breakdown */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-amber-500" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-semantic-text">
              {t("admin.aiUsage.endpointBreakdown", { defaultValue: "Per-Endpoint Breakdown" })}
            </h2>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 text-gray-500 dark:text-gray-400 font-medium">Endpoint</th>
                <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Calls</th>
                <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Avg tokens</th>
                <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {ENDPOINT_BREAKDOWN.map((ep) => (
                <tr key={ep.endpoint} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="py-2 text-semantic-text font-mono text-xs truncate max-w-[120px]" title={ep.endpoint}>
                    {ep.endpoint.replace("/me/ai-tutor/", "").replace("/me/conversations/", "conv/")}
                  </td>
                  <td className="py-2 text-right text-gray-500 dark:text-gray-400">{ep.calls}</td>
                  <td className="py-2 text-right text-gray-500 dark:text-gray-400">{ep.avgTokens}</td>
                  <td className="py-2 text-right font-medium text-semantic-text">${ep.costEstimate.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-200 dark:border-gray-700 font-semibold">
                <td className="py-2 text-semantic-text">Total</td>
                <td className="py-2 text-right text-semantic-text">{totalCalls}</td>
                <td />
                <td className="py-2 text-right text-semantic-text">${totalCost.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Top expensive users */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-purple-500" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-semantic-text">
              {t("admin.aiUsage.topUsers", { defaultValue: "Top Users by Cost" })}
            </h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-2 text-xs text-gray-500 dark:text-gray-400 font-medium">User</th>
                <th className="text-right py-2 text-xs text-gray-500 dark:text-gray-400 font-medium">Calls</th>
                <th className="text-right py-2 text-xs text-gray-500 dark:text-gray-400 font-medium">Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {TOP_USERS.map((user, idx) => (
                <tr key={user.username} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                  <td className="py-2 flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-600 dark:text-gray-300">
                      {idx + 1}
                    </span>
                    <span className="font-medium text-semantic-text">{user.username}</span>
                  </td>
                  <td className="py-2 text-right text-gray-500 dark:text-gray-400">{user.calls}</td>
                  <td className="py-2 text-right font-medium text-semantic-text">${user.cost.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cache hit rate trend */}
      <div className="card p-5 mt-6">
        <h2 className="text-sm font-semibold text-semantic-text mb-3">
          {t("admin.aiUsage.cacheHitTrend", { defaultValue: "Cache Hit Rate Trend" })}
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-700 motion-reduce:transition-none"
              style={{ width: `${cacheHitRate}%` }}
            />
          </div>
          <span className="text-sm font-medium text-semantic-text">{cacheHitRate}% cache hits</span>
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {t("admin.aiUsage.cacheNote", { defaultValue: "Prompt caching reduces cost. Target: 30%+" })}
        </p>
      </div>
    </div>
  );
}
