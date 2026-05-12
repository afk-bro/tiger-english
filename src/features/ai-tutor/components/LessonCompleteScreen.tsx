import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { TurnCorrection, TutorTurnDTO } from '../types';
import { CorrectionCard } from './CorrectionCard';
import { DialogueCard } from './DialogueCard';

interface Props {
  xpAwarded: number;
  corrections: TurnCorrection[];
  turns: TutorTurnDTO[];
}

export function LessonCompleteScreen({ xpAwarded, corrections, turns }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const firstCorrectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    firstCorrectionRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
  }, []);

  return (
    <div className="space-y-6 py-4">
      <header className="text-center">
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          {t('tutor.lessonComplete.title', { defaultValue: 'Lesson finished' })}
        </h1>
        <p className="mt-2 inline-block px-4 py-1 rounded-full bg-accent-100 text-accent-700 text-sm font-semibold">
          {t('tutor.lessonComplete.xpEarned', {
            defaultValue: '+{{xp}} XP',
            xp: xpAwarded,
          })}
        </p>
      </header>

      {/* Render turns with corrections listed afterwards. For Spec 1 we don't
          have a turn_id ↔ correction map; show all turns then list corrections
          below. */}
      <section className="space-y-3">
        {turns.map((turn) => (
          <DialogueCard
            key={turn.id}
            turn={turn}
            onRepeat={() => {
              /* playback no-op on completion screen */
            }}
            onFlag={() => {
              /* no-op */
            }}
          />
        ))}
      </section>

      {corrections.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
            {t('tutor.lessonComplete.correctionsHeader', {
              defaultValue: 'Corrections',
            })}
          </h2>
          {corrections.map((c, i) => (
            <div key={i} ref={i === 0 ? firstCorrectionRef : null}>
              <CorrectionCard correction={c} />
            </div>
          ))}
        </section>
      )}

      <div className="space-y-2 pt-2">
        <button
          type="button"
          onClick={() => navigate('/ai-tutor')}
          className="block w-full px-4 py-3 rounded-md bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600"
        >
          {t('tutor.lessonComplete.continue', { defaultValue: 'Continue' })}
        </button>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="block w-full px-4 py-3 rounded-md border border-gray-300 dark:border-gray-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800"
        >
          {t('tutor.lessonComplete.viewDashboard', {
            defaultValue: 'View dashboard',
          })}
        </button>
      </div>
    </div>
  );
}
