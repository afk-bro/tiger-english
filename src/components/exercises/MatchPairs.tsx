/**
 * MatchPairs — tap-to-pair word ↔ image matching exercise.
 *
 * Mobile-first by design:
 * - Two columns (words left, images right) so the spatial mapping
 *   "left-side text describes right-side picture" is obvious without
 *   instructions. Stacking would lose this and weaken the gesture.
 * - All tiles have ≥44×44px tap targets per WCAG 2.5.5.
 * - Tap-to-pair (NOT drag-and-drop): drag is finicky on touch, breaks
 *   under scroll, and is uncommon in well-known language apps. Two
 *   single-tap interactions is faster on a phone than dragging.
 *
 * Interaction:
 *   tap a word → highlights with primary ring
 *   tap an image → if it pairs with the highlighted word, both lock
 *     green with a check; if not, both flash red briefly and clear
 *   when every pair is matched, fire onCorrect + onAttempt(true)
 *
 * Accessibility:
 *   - Each tile is a real <button> so it's keyboard-focusable; Enter /
 *     Space activates.
 *   - aria-pressed reflects selected state.
 *   - aria-live="polite" region announces match / mismatch outcomes.
 *   - Each pair has imageAlt so screen readers describe the image
 *     content (without that, the matching task is unsolvable for SR
 *     users — see the imageAlt fallback in the image tile aria-label
 *     for the dev-error case where it's missing).
 */
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { CheckCircle, RotateCcw, XCircle } from "lucide-react";
import { clsx } from "clsx";
import { useTranslation } from "react-i18next";
import { useLocalizedContent } from "@/features/lessons/utils/useLocalizedContent";
import { srcSetFor } from "@/lib/storageImage";
import type { MatchExercise, MatchPair } from "./exercises.types";

type Props = {
  exercise: MatchExercise;
  onCorrect?: () => void;
  onAttempt?: (isCorrect: boolean) => void;
};

type ErrorFlash = { wordId: string; imageId: string } | null;

const ERROR_FLASH_MS = 350;

/** Fisher-Yates shuffle. Returns a new array. */
function shuffle<T>(arr: readonly T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export default function MatchPairs({ exercise, onCorrect, onAttempt }: Props) {
  const { t } = useTranslation();
  const localizedPrompt = useLocalizedContent(
    exercise.prompt,
    exercise.promptTranslations,
  );

  // Stable shuffles for word + image columns. Keyed on the pairs array
  // reference (not just exercise.id) so a parent that swaps pair data
  // while keeping the same id doesn't render stale tiles. Same-array
  // re-renders during play do not reshuffle.
  const wordOrder = useMemo(() => shuffle(exercise.pairs.map((p) => p.id)), [exercise.pairs]);
  const imageOrder = useMemo(() => shuffle(exercise.pairs.map((p) => p.id)), [exercise.pairs]);
  const pairById = useMemo(() => {
    const m = new Map<string, MatchPair>();
    for (const p of exercise.pairs) m.set(p.id, p);
    return m;
  }, [exercise.pairs]);

  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [error, setError] = useState<ErrorFlash>(null);
  const [feedback, setFeedback] = useState<"correct" | "incorrect" | null>(null);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reportedCompletionRef = useRef(false);

  const allMatched = matched.size === exercise.pairs.length;

  function clearErrorTimer() {
    if (errorTimerRef.current) {
      clearTimeout(errorTimerRef.current);
      errorTimerRef.current = null;
    }
  }

  // Make sure a pending mismatch flash timer can't fire on an unmounted
  // component (React warns + the timer leaks if the user navigates
  // away within the 350ms window).
  useEffect(() => {
    return () => clearErrorTimer();
  }, []);

  function attemptPair(wordId: string, imageId: string) {
    if (wordId === imageId) {
      // Match!
      const next = new Set(matched);
      next.add(wordId);
      setMatched(next);
      setSelectedWord(null);
      setSelectedImage(null);
      setError(null);
      if (next.size === exercise.pairs.length && !reportedCompletionRef.current) {
        reportedCompletionRef.current = true;
        setFeedback("correct");
        onAttempt?.(true);
        onCorrect?.();
      }
    } else {
      // Mismatch — flash red briefly, log a wrong attempt the first
      // time per session so progress tracking sees it.
      clearErrorTimer();
      setError({ wordId, imageId });
      if (feedback !== "incorrect" && !reportedCompletionRef.current) {
        setFeedback("incorrect");
        onAttempt?.(false);
      }
      errorTimerRef.current = setTimeout(() => {
        setError(null);
        setSelectedWord(null);
        setSelectedImage(null);
      }, ERROR_FLASH_MS);
    }
  }

  function handleWordTap(id: string) {
    if (matched.has(id)) return;
    if (selectedImage !== null) {
      attemptPair(id, selectedImage);
      return;
    }
    setSelectedWord(selectedWord === id ? null : id);
  }

  function handleImageTap(id: string) {
    if (matched.has(id)) return;
    if (selectedWord !== null) {
      attemptPair(selectedWord, id);
      return;
    }
    setSelectedImage(selectedImage === id ? null : id);
  }

  function handleReset() {
    setMatched(new Set());
    setSelectedWord(null);
    setSelectedImage(null);
    setError(null);
    setFeedback(null);
    reportedCompletionRef.current = false;
    clearErrorTimer();
  }

  return (
    <div className="space-y-4">
      <p className="text-base font-medium text-semantic-text">{localizedPrompt}</p>

      {/* Live region for screen reader feedback */}
      <div className="sr-only" role="status" aria-live="polite">
        {feedback === "correct"
          ? t("lessons.exercises.match.allMatched", { defaultValue: "All pairs matched!" })
          : error
            ? t("lessons.exercises.match.tryAgain", { defaultValue: "Not a match — try again." })
            : ""}
      </div>

      {/* Row-aligned grid: each row is one (word, image) cell pair, both
          drawn from independent shuffles. Aligning rows makes the two
          columns share heights — words inherit the row height set by
          the capped image size, so the word column no longer ends
          before the image column. The pairing is still by pair.id (NOT
          by row position): wordOrder[i] and imageOrder[i] are
          independent, so a row's word and image rarely match. */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3 max-w-md mx-auto">
        {Array.from({ length: exercise.pairs.length }).map((_, i) => {
          const wordPair = pairById.get(wordOrder[i])!;
          const imagePair = pairById.get(imageOrder[i])!;
          const wordSelected = selectedWord === wordPair.id;
          const wordMatched = matched.has(wordPair.id);
          const wordError = error?.wordId === wordPair.id;
          const imageSelected = selectedImage === imagePair.id;
          const imageMatched = matched.has(imagePair.id);
          const imageError = error?.imageId === imagePair.id;
          return (
            <Fragment key={i}>
              <button
                type="button"
                onClick={() => handleWordTap(wordPair.id)}
                disabled={wordMatched || allMatched}
                aria-pressed={wordSelected}
                aria-label={
                  wordMatched
                    ? t("lessons.exercises.match.matchedAria", {
                        word: wordPair.word,
                        defaultValue: `${wordPair.word} (matched)`,
                      })
                    : wordPair.word
                }
                className={clsx(
                  "w-full min-h-[56px] px-4 py-3 rounded-lg border-2 text-base font-medium transition-all touch-manipulation",
                  "flex items-center justify-center text-center",
                  wordMatched &&
                    "border-semantic-success bg-semantic-success/10 text-semantic-success cursor-default",
                  !wordMatched && wordError &&
                    "border-red-400 bg-red-50 text-red-700 dark:border-red-500 dark:bg-red-900/20 dark:text-red-400 animate-pulse",
                  !wordMatched && !wordError && wordSelected &&
                    "border-primary-500 bg-primary-50 text-primary-700 dark:bg-primary-900/30 dark:text-primary-200 ring-2 ring-primary-300 dark:ring-primary-700",
                  !wordMatched && !wordError && !wordSelected &&
                    "border-semantic-border bg-semantic-surface text-semantic-text hover:bg-semantic-surface-2 active:scale-[0.98]",
                )}
              >
                {wordPair.word}
              </button>
              <button
                type="button"
                onClick={() => handleImageTap(imagePair.id)}
                disabled={imageMatched || allMatched}
                aria-pressed={imageSelected}
                aria-label={
                  imagePair.imageAlt ??
                  t("lessons.exercises.match.imageOf", {
                    word: imagePair.word,
                    // Fallback used only when an author forgets to set
                    // imageAlt. We interpolate the word so the buttons
                    // stay distinguishable for screen readers (the
                    // alternative — every tile labeled "Picture for
                    // matching" — is unsolvable). Note that this label
                    // gives away the answer; correctly authored data
                    // should always set a descriptive imageAlt.
                    defaultValue: `Picture for ${imagePair.word}`,
                  })
                }
                className={clsx(
                  // aspect-square + max-w caps each tile at ~120-140px.
                  // The 1024×1024 source PNG was filling the column on
                  // desktop (~340px tall tiles, totaling 1360px column
                  // height) — way out of proportion with the four-word
                  // list. justify-self-center centers the tile within
                  // the wider grid cell so the word/image pairing
                  // still reads visually as left-text right-image.
                  "w-full aspect-square max-w-[120px] sm:max-w-[140px] justify-self-center rounded-lg border-2 transition-all touch-manipulation overflow-hidden",
                  "flex items-center justify-center",
                  imageMatched &&
                    "border-semantic-success bg-semantic-success/10 cursor-default",
                  !imageMatched && imageError &&
                    "border-red-400 bg-red-50 dark:border-red-500 dark:bg-red-900/20 animate-pulse",
                  !imageMatched && !imageError && imageSelected &&
                    "border-primary-500 bg-primary-50 dark:bg-primary-900/30 ring-2 ring-primary-300 dark:ring-primary-700",
                  !imageMatched && !imageError && !imageSelected &&
                    "border-semantic-border bg-semantic-surface hover:bg-semantic-surface-2 active:scale-[0.98]",
                )}
              >
                <PairVisual pair={imagePair} matched={imageMatched} />
              </button>
            </Fragment>
          );
        })}
      </div>

      {/* Status row: completion (sticky) or transient mismatch.
          Tying the mismatch message to `error` (not `feedback`) means
          it disappears when the flash clears (~350ms) — matching the
          tile flash. `feedback` is kept as a separate flag so
          onAttempt(false) only fires once per session. */}
      {allMatched ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-medium text-semantic-success">
            <CheckCircle className="w-4 h-4" aria-hidden="true" />
            {t("lessons.exercises.correct")}
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:underline"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            {t("lessons.exercises.match.playAgain", { defaultValue: "Play again" })}
          </button>
        </div>
      ) : error ? (
        <div className="flex items-center gap-2 text-sm font-medium text-red-600 dark:text-red-400">
          <XCircle className="w-4 h-4" aria-hidden="true" />
          {t("lessons.exercises.match.keepGoing", {
            defaultValue: "Not a match — keep going.",
          })}
        </div>
      ) : null}
    </div>
  );
}

/** Inner content of an image tile: real image when imageUrl is set,
 * styled glyph fallback otherwise. Kept as a sub-component so the
 * tile-state logic above stays focused on interaction state. */
function PairVisual({ pair, matched }: { pair: MatchPair; matched: boolean }) {
  if (pair.imageUrl) {
    const { src, srcSet } = srcSetFor(pair.imageUrl, 200);
    return (
      <img
        src={src}
        srcSet={srcSet}
        alt={pair.imageAlt ?? ""}
        loading="lazy"
        decoding="async"
        className={clsx(
          "w-full h-full object-cover transition-opacity",
          matched && "opacity-90",
        )}
      />
    );
  }
  return (
    <span
      aria-hidden="true"
      className="text-3xl sm:text-4xl select-none"
    >
      {pair.fallback ?? "🖼️"}
    </span>
  );
}
