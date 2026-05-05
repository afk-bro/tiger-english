/**
 * ReviewPage — /review
 *
 * Fetches due review items from GET /api/v1/me/review/due, then
 * presents each one as a ReviewDrillCard. After rating, calls
 * POST /api/v1/me/review/:id/rate to record the SM-2 update.
 * When all items are done, shows ReviewSessionSummary.
 */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { RotateCcw } from "lucide-react";
import { supabase } from "@/lib/supabase";
import ReviewDrillCard from "../components/ReviewDrillCard";
import ReviewSessionSummary from "../components/ReviewSessionSummary";
import type { DifficultyRating, ReviewItem, ReviewSessionResult } from "../review.types";

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ??
  "http://localhost:8000/api/v1";

async function fetchDueItems(): Promise<ReviewItem[]> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return [];

  const res = await fetch(`${API_BASE}/me/review/due`, {
    headers: { Authorization: `Bearer ${session.access_token}` },
  });
  if (!res.ok) return [];
  return res.json();
}

async function rateItem(itemId: string, difficulty: DifficultyRating): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) return;

  await fetch(`${API_BASE}/me/review/${itemId}/rate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ difficulty }),
  });
}

type PageState =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "reviewing"; items: ReviewItem[]; currentIndex: number; result: ReviewSessionResult }
  | { status: "done"; result: ReviewSessionResult };

export default function ReviewPage() {
  const { t } = useTranslation();
  const [state, setState] = useState<PageState>({ status: "loading" });

  useEffect(() => {
    fetchDueItems().then((items) => {
      if (items.length === 0) {
        setState({ status: "empty" });
      } else {
        setState({
          status: "reviewing",
          items,
          currentIndex: 0,
          result: { total: items.length, correct: 0, incorrect: 0, skipped: 0 },
        });
      }
    });
  }, []);

  function handleRate(difficulty: DifficultyRating) {
    if (state.status !== "reviewing") return;
    const item = state.items[state.currentIndex];

    // Fire-and-forget the API call — don't block UI progression
    rateItem(item.id, difficulty).catch(console.error);

    const isCorrect = difficulty === "got_it" || difficulty === "easy";
    const updatedResult: ReviewSessionResult = {
      ...state.result,
      correct: state.result.correct + (isCorrect ? 1 : 0),
      incorrect: state.result.incorrect + (isCorrect ? 0 : 1),
    };

    const nextIndex = state.currentIndex + 1;
    if (nextIndex >= state.items.length) {
      setState({ status: "done", result: updatedResult });
    } else {
      setState({ ...state, currentIndex: nextIndex, result: updatedResult });
    }
  }

  return (
    <div className="max-w-lg mx-auto py-8 px-4">
      {state.status === "loading" && (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {state.status === "empty" && (
        <div className="text-center py-16">
          <RotateCcw className="w-12 h-12 text-semantic-text-muted mx-auto mb-4" aria-hidden />
          <h1 className="text-xl font-bold text-semantic-text mb-2">
            {t("review.empty.heading", { defaultValue: "All caught up!" })}
          </h1>
          <p className="text-semantic-text-muted">
            {t("review.empty.message", { defaultValue: "No review items due. Keep up the great work!" })}
          </p>
        </div>
      )}

      {state.status === "reviewing" && (
        <ReviewDrillCard
          item={state.items[state.currentIndex]}
          index={state.currentIndex}
          total={state.items.length}
          onRate={handleRate}
        />
      )}

      {state.status === "done" && (
        <ReviewSessionSummary result={state.result} />
      )}
    </div>
  );
}
