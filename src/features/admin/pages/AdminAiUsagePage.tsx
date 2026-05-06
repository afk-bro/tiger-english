// src/features/admin/pages/AdminAiUsagePage.tsx
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BarChart2, TrendingUp, Zap, RefreshCw, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://localhost:8000/api/v1";

type EndpointStat = {
  endpoint: string;
  calls: number;
  avg_tokens: number;
  cost_estimate: number;
};

type RecentCall = {
  id: number;
  user_id: string;
  endpoint: string;
  model: string;
  input_tokens: number;
  output_tokens: number;
  cache_hit_rate: number;
  cost_estimate_usd: number;
  status: string;
  created_at: string;
};

type Summary = {
  total_calls: number;
  total_cost_usd: number;
  cache_hit_rate: number;
  by_endpoint: EndpointStat[];
  recent_calls: RecentCall[];
};

async function fetchSummary(): Promise<Summary | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return null;

  const res = await fetch(`${API_BASE}/admin/ai-usage-summary`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!res.ok) return null;
  return res.json() as Promise<Summary>;
}

export default function AdminAiUsagePage() {
  const { t } = useTranslation();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  async function load() {
    setLoading(true);
    const data = await fetchSummary();
    setSummary(data);
    setLastRefresh(new Date());
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  // Fall back to placeholder content when no data yet
  const totalCost = summary?.total_cost_usd ?? 0;
  const totalCalls = summary?.total_calls ?? 0;
  const cacheHitRate = summary?.cache_hit_rate ?? 0;
  const byEndpoint = summary?.by_endpoint ?? [];
  const recentCalls = summary?.recent_calls ?? [];

  // Build bar-chart data: one bar per endpoint (or empty state)
  const maxCost = Math.max(...byEndpoint.map((e) => e.cost_estimate), 0.01);

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-8">
      <div className="flex items-center gap-3 mb-6">
        <BarChart2 className="w-6 h-6 text-primary-600 dark:text-primary-400" aria-hidden="true" />
        <h1 className="text-2xl font-bold text-semantic-text">
          {t("admin.aiUsage.title", { defaultValue: "AI Usage Dashboard" })}
        </h1>
        <span className="ml-auto text-xs text-gray-400 dark:text-gray-500 mr-2">
          {t("admin.aiUsage.superAdminOnly", { defaultValue: "Super-admin only" })}
        </span>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} aria-hidden="true" />
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="card p-4 flex flex-col gap-1">
          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total cost</span>
          <span className="text-2xl font-bold text-semantic-text">${totalCost.toFixed(4)}</span>
          <span className="text-xs text-gray-400">since server start</span>
        </div>
        <div className="card p-4 flex flex-col gap-1">
          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Total calls</span>
          <span className="text-2xl font-bold text-semantic-text">{totalCalls.toLocaleString()}</span>
          <span className="text-xs text-gray-400">AI tutor requests</span>
        </div>
        <div className="card p-4 flex flex-col gap-1">
          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Cache hit rate</span>
          <span className="text-2xl font-bold text-semantic-text">{cacheHitRate.toFixed(1)}%</span>
          <span className="text-xs text-gray-400">prompt cache reuse</span>
        </div>
        <div className="card p-4 flex flex-col gap-1">
          <span className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Avg cost/call</span>
          <span className="text-2xl font-bold text-semantic-text">
            ${totalCalls > 0 ? (totalCost / totalCalls).toFixed(5) : "0.00000"}
          </span>
          <span className="text-xs text-gray-400">USD per request</span>
        </div>
      </div>

      {/* Per-endpoint bar chart */}
      {byEndpoint.length > 0 && (
        <div className="card p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-4 h-4 text-primary-500" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-semantic-text">
              {t("admin.aiUsage.dailyCost", { defaultValue: "Cost by Endpoint (USD)" })}
            </h2>
          </div>
          <div className="flex items-end gap-2 h-32" role="img" aria-label="Cost by endpoint bar chart">
            {byEndpoint.map(({ endpoint, cost_estimate }) => {
              const shortName = endpoint.replace("/me/ai-tutor/", "").replace("/me/conversations/", "conv/");
              const heightPct = maxCost > 0 ? (cost_estimate / maxCost) * 100 : 0;
              return (
                <div key={endpoint} className="flex-1 flex flex-col items-center gap-1 min-w-0">
                  <span className="text-xs text-gray-400 dark:text-gray-500">${cost_estimate.toFixed(4)}</span>
                  <div className="w-full flex items-end justify-center" style={{ height: "80px" }}>
                    <div
                      className="w-full rounded-t bg-primary-500 dark:bg-primary-600 transition-all duration-500 motion-reduce:transition-none"
                      style={{ height: `${heightPct}%`, minHeight: heightPct > 0 ? "2px" : "0" }}
                      title={`${endpoint}: $${cost_estimate.toFixed(4)}`}
                    />
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500 truncate w-full text-center" title={endpoint}>
                    {shortName}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {totalCalls === 0 && !loading && (
        <div className="card p-8 mb-6 text-center text-gray-400 dark:text-gray-500">
          <Zap className="w-8 h-8 mx-auto mb-2 opacity-40" aria-hidden="true" />
          <p className="text-sm">No AI calls recorded yet.</p>
          <p className="text-xs mt-1">Use the AI Tutor panel in any lesson to generate usage data.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Per-endpoint breakdown */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-amber-500" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-semantic-text">
              {t("admin.aiUsage.endpointBreakdown", { defaultValue: "Per-Endpoint Breakdown" })}
            </h2>
          </div>
          {byEndpoint.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">No data yet</p>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 text-gray-500 dark:text-gray-400 font-medium">Endpoint</th>
                  <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Calls</th>
                  <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Avg tok.</th>
                  <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                {byEndpoint.map((ep) => (
                  <tr key={ep.endpoint} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                    <td
                      className="py-2 text-semantic-text font-mono text-xs truncate max-w-[120px]"
                      title={ep.endpoint}
                    >
                      {ep.endpoint.replace("/me/ai-tutor/", "").replace("/me/conversations/", "conv/")}
                    </td>
                    <td className="py-2 text-right text-gray-500 dark:text-gray-400">{ep.calls}</td>
                    <td className="py-2 text-right text-gray-500 dark:text-gray-400">{ep.avg_tokens}</td>
                    <td className="py-2 text-right font-medium text-semantic-text">
                      ${ep.cost_estimate.toFixed(4)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200 dark:border-gray-700 font-semibold">
                  <td className="py-2 text-semantic-text">Total</td>
                  <td className="py-2 text-right text-semantic-text">{totalCalls}</td>
                  <td />
                  <td className="py-2 text-right text-semantic-text">${totalCost.toFixed(4)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* Recent calls log */}
        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-purple-500" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-semantic-text">
              {t("admin.aiUsage.topUsers", { defaultValue: "Recent API Calls" })}
            </h2>
          </div>
          {recentCalls.length === 0 ? (
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center py-4">No calls yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 text-gray-500 dark:text-gray-400 font-medium">Endpoint</th>
                    <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">In tok.</th>
                    <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Out tok.</th>
                    <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Cost</th>
                    <th className="text-right py-2 text-gray-500 dark:text-gray-400 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {recentCalls.map((call) => (
                    <tr key={call.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/30">
                      <td
                        className="py-1.5 text-semantic-text font-mono text-xs truncate max-w-[100px]"
                        title={call.endpoint}
                      >
                        {call.endpoint.replace("/me/ai-tutor/", "").replace("/me/conversations/", "conv/")}
                      </td>
                      <td className="py-1.5 text-right text-gray-500 dark:text-gray-400">{call.input_tokens}</td>
                      <td className="py-1.5 text-right text-gray-500 dark:text-gray-400">{call.output_tokens}</td>
                      <td className="py-1.5 text-right font-medium text-semantic-text">
                        ${call.cost_estimate_usd.toFixed(5)}
                      </td>
                      <td className="py-1.5 text-right">
                        <span
                          className={`inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium ${
                            call.status === "ok"
                              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                              : call.status === "mock"
                              ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                          }`}
                        >
                          {call.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Cache hit rate */}
      <div className="card p-5 mt-6">
        <h2 className="text-sm font-semibold text-semantic-text mb-3">
          {t("admin.aiUsage.cacheHitTrend", { defaultValue: "Cache Hit Rate" })}
        </h2>
        <div className="flex items-center gap-4">
          <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500 transition-all duration-700 motion-reduce:transition-none"
              style={{ width: `${cacheHitRate}%` }}
            />
          </div>
          <span className="text-sm font-medium text-semantic-text">{cacheHitRate.toFixed(1)}% cache hits</span>
        </div>
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          {t("admin.aiUsage.cacheNote", { defaultValue: "Prompt caching reduces cost. Target: 30%+" })}
        </p>
        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
          Last refreshed: {lastRefresh.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
}
