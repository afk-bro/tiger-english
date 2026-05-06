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
import { useNavigate } from "react-router-dom";
import { RotateCcw } from "lucide-react";
import { authedGet, authedPostJson } from "@/lib/api/authedFetch";
import ReviewDrillCard from "../components/ReviewDrillCard";
import ReviewSessionSummary from "../components/ReviewSessionSummary";
import type { DifficultyRating, ReviewItem, ReviewSessionResult } from "../review.types";
import { enrichReviewPrompt } from "@/features/lessons/data/exercises/exerciseLookup";

async function fetchDueItems(): Promise<ReviewItem[]> {
  let raw: ReviewItem[] | null;
  try {
    raw = await authedGet<ReviewItem[]>("/me/review/due");
  } catch {
    return [];
  }
  if (!raw) return [];

  // Enrich items that originated from exercise_attempts with the real
  // exercise question + correct answer from the client-side exercise registry.
  return raw.map((item) => {
    if (item.exercise_id) {
      const enriched = enrichReviewPrompt(item.exercise_id, item.prompt, item.answer);
      return { ...item, prompt: enriched.prompt, answer: enriched.answer };
    }
    return item;
  });
}

async function rateItem(itemId: string, difficulty: DifficultyRating): Promise<void> {
  // Fire-and-forget; swallow errors so a flaky network doesn't break the
  // local state machine. The caller already wraps this in .catch(console.error).
  await authedPostJson(`/me/review/${itemId}/rate`, { difficulty }).catch(() => null);
}

type PageState =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "reviewing"; items: ReviewItem[]; currentIndex: number; result: ReviewSessionResult }
  | { status: "done"; result: ReviewSessionResult };

export default function ReviewPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
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
          <RotateCcw className="w-12 h-12 text-green-500 mx-auto mb-4" aria-hidden />
          <h1 className="text-xl font-bold text-semantic-text mb-2">
            {t("review.empty.heading", { defaultValue: "All caught up!" })}
          </h1>
          <p className="text-semantic-text-muted mb-1">
            {t("review.empty.message", { defaultValue: "No review items due. Keep up the great work!" })}
          </p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mb-6">
            {t("review.empty.nextReview", { defaultValue: "Next review: tomorrow" })}
          </p>
          <button
            type="button"
            onClick={() => navigate("/lessons")}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            {t("review.empty.practiceAhead", { defaultValue: "Practice ahead" })}
          </button>
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
