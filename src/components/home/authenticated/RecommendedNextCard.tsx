// src/components/home/authenticated/RecommendedNextCard.tsx
import { useNavigate } from "react-router-dom";
import type { RecommendedItem, ReasonType } from "./types";

const REASON_DEFAULTS: Record<ReasonType, string> = {
  review: "Needs review",
  sequence: "Next in sequence",
  related: "Related to recent study",
};

interface Props {
  data: RecommendedItem[] | null;
  isLoading: boolean;
}

export default function RecommendedNextCard({ data, isLoading }: Props) {
  const navigate = useNavigate();

  if (isLoading) {
    return <div data-testid="skeleton" className="rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse h-48" />;
  }

  if (!data || data.length === 0) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-3">
        <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">Recommended Next</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Complete a set to unlock recommendations.</p>
      </div>
    );
  }

  const items = data.slice(0, 3);

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-4 bg-white dark:bg-gray-900">
      <h2 className="text-base font-semibold text-gray-800 dark:text-gray-100">Recommended Next</h2>
      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <div key={item.setId} className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{item.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {item.reasonLabel ?? REASON_DEFAULTS[item.reasonType]}
              </p>
            </div>
            <button
              onClick={() => navigate("/flashcards", { state: { setId: item.setId } })}
              className="flex-shrink-0 px-3 py-1 text-xs bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
            >
              Study
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
