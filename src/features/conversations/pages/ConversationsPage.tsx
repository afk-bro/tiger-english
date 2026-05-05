/**
 * ConversationsPage — /conversations
 *
 * Shows all 24 AI conversation scenarios grouped by CEFR level band.
 * Users can filter by level band and start a mission.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MessageCircle, Search } from "lucide-react";
import { useScenarios } from "../hooks/useScenarios";
import { ScenarioCard } from "../components/ScenarioCard";
import type { ConversationScenario, LevelBand } from "../conversations.types";

const ALL_LEVEL_BANDS: LevelBand[] = [
  "A0–A1",
  "A1–A2",
  "A2–B1",
  "B1–B1+",
  "B1+–B2",
  "B2–C1",
];

export default function ConversationsPage() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<LevelBand | null>(null);
  const [search, setSearch] = useState("");

  // Fetch all scenarios (no server-side filter — we filter client-side so
  // the level filter buttons feel instant without extra fetches)
  const { scenarios, isLoading, error } = useScenarios();

  // Client-side filter + search
  const visible = scenarios.filter((s) => {
    if (activeFilter && s.level_band !== activeFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        s.title.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.level.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Group visible scenarios by level_band for display
  const grouped = ALL_LEVEL_BANDS.reduce<Record<LevelBand, ConversationScenario[]>>(
    (acc, band) => {
      acc[band] = visible.filter((s) => s.level_band === band);
      return acc;
    },
    {} as Record<LevelBand, ConversationScenario[]>
  );

  function handleStart(scenario: ConversationScenario) {
    // Navigate to mission runner (stub for now — phase 5 feature 22)
    navigate(`/conversations/${scenario.slug}`);
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <MessageCircle className="w-6 h-6 text-primary-600 dark:text-primary-400" />
          <h1 className="text-2xl font-bold text-semantic-text">Conversation missions</h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Practice real-world conversations with your AI language partner. Choose a scenario
          that matches your level.
        </p>
      </div>

      {/* Controls: search + level filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="search"
            placeholder="Search scenarios…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-semantic-text placeholder-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          />
        </div>

        {/* Level filter pills */}
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setActiveFilter(null)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              activeFilter === null
                ? "bg-primary-600 text-white"
                : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
            }`}
          >
            All levels
          </button>
          {ALL_LEVEL_BANDS.map((band) => (
            <button
              key={band}
              type="button"
              onClick={() => setActiveFilter(activeFilter === band ? null : band)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                activeFilter === band
                  ? "bg-primary-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {band}
            </button>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="text-center py-12 text-red-500 dark:text-red-400">
          <p className="font-medium">Failed to load scenarios</p>
          <p className="text-sm mt-1 text-gray-400">{error}</p>
        </div>
      )}

      {/* Empty search state */}
      {!isLoading && !error && visible.length === 0 && (
        <div className="text-center py-12 text-gray-400 dark:text-gray-500">
          <MessageCircle className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p className="font-medium">No scenarios found</p>
          <p className="text-sm mt-1">Try adjusting your search or filter.</p>
        </div>
      )}

      {/* Scenario groups */}
      {!isLoading && !error && (
        <div className="space-y-8">
          {ALL_LEVEL_BANDS.map((band) => {
            const group = grouped[band];
            if (group.length === 0) return null;
            return (
              <section key={band} aria-labelledby={`level-${band}`}>
                <div className="flex items-center gap-3 mb-3">
                  <h2
                    id={`level-${band}`}
                    className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
                  >
                    {band}
                  </h2>
                  <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                  <span className="text-xs text-gray-400">{group.length} scenario{group.length !== 1 ? "s" : ""}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {group.map((scenario) => (
                    <ScenarioCard
                      key={scenario.id}
                      scenario={scenario}
                      onStart={handleStart}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
