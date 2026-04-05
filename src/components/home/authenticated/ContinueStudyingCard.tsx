// src/components/home/authenticated/ContinueStudyingCard.tsx
import { useTranslation } from 'react-i18next';
import { useNavigate } from "react-router-dom";
import type { ContinueStudyingData } from "./types";

interface Props {
  data: ContinueStudyingData | null;
  isLoading: boolean;
}

export default function ContinueStudyingCard({ data, isLoading }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div data-testid="skeleton" className="rounded-2xl bg-gray-100 dark:bg-gray-800 animate-pulse h-48" />
    );
  }

  if (!data) {
    return (
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
          {t('authhome.continue_studying.heading')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {t('authhome.continue_studying.empty')}
        </p>
        <button
          onClick={() => navigate("/flashcards")}
          className="self-start px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium"
        >
          {t('authhome.continue_studying.start')}
        </button>
      </div>
    );
  }

  const progress = data.totalCards === 0 ? 0 : Math.round((data.reviewedCount / data.totalCards) * 100);
  const isComplete = data.totalCards > 0 && data.reviewedCount === data.totalCards;

  const timeAgo = (iso: string): string => {
    const diff = Date.now() - new Date(iso).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    if (hours < 1) return t('authhome.continue_studying.time.less_than_hour');
    if (hours === 1) return t('authhome.continue_studying.time.one_hour');
    if (hours < 24) return t('authhome.continue_studying.time.hours', { hours });
    const days = Math.floor(hours / 24);
    return days === 1
      ? t('authhome.continue_studying.time.one_day')
      : t('authhome.continue_studying.time.days', { days });
  };

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6 flex flex-col gap-4 bg-white dark:bg-gray-900">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">{data.title}</h2>
          <span className="text-xs text-primary-600 dark:text-primary-400 font-medium">{data.theme}</span>
        </div>
        <div className="flex gap-2">
          {data.streak !== undefined && (
            <span className="text-xs bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full">
              🔥 {t('authhome.continue_studying.streak_badge', { streak: data.streak })}
            </span>
          )}
          {data.accuracy !== undefined && (
            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-0.5 rounded-full">
              {t('authhome.continue_studying.accuracy_badge', { accuracy: data.accuracy })}
            </span>
          )}
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>
            {t('authhome.continue_studying.reviewed', { reviewed: data.reviewedCount, total: data.totalCards })}
          </span>
          {isComplete && (
            <span className="text-green-600 dark:text-green-400 font-medium">
              {t('authhome.continue_studying.completed')}
            </span>
          )}
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            className="bg-primary-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400 dark:text-gray-500">{timeAgo(data.lastStudiedAt)}</span>
        <button
          onClick={() => navigate("/flashcards", { state: { setId: data.setId } })}
          className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {t('authhome.continue_studying.continue')}
        </button>
      </div>
    </div>
  );
}
