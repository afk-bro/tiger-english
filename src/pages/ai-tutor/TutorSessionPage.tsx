import { useEffect, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { useScenario } from '@/features/ai-tutor/hooks/useScenario';
import { useTutorSession } from '@/features/ai-tutor/hooks/useTutorSession';
import { isBrowserSupported } from '@/features/ai-tutor/audio/audioUtils';
import { reportTutorEvent } from '@/features/ai-tutor/api/events';
import { TaskProgressBanner } from '@/features/ai-tutor/components/TaskProgressBanner';
import { DialogueCard } from '@/features/ai-tutor/components/DialogueCard';
import { RecordingPanel } from '@/features/ai-tutor/components/RecordingPanel';
import { EndLessonModal } from '@/features/ai-tutor/components/EndLessonModal';
import { LessonCompleteScreen } from '@/features/ai-tutor/components/LessonCompleteScreen';
import type { TutorTurnDTO } from '@/features/ai-tutor/types';

interface RouterState {
  openingTurn?: TutorTurnDTO;
  currentTaskId?: string;
}

export default function TutorSessionPage() {
  const { t } = useTranslation();
  const { slug, sessionId } = useParams<{ slug: string; sessionId: string }>();
  const { state: routerState } = useLocation() as { state: RouterState | null };

  // 1. Browser support check (computed once on mount)
  const [support] = useState(() => isBrowserSupported());
  useEffect(() => {
    if (!support.ok) {
      void reportTutorEvent('unsupported_browser', {
        user_agent:
          typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        missing: support.missing,
      });
    }
  }, [support]);

  // 2. Data + session
  const { scenario } = useScenario(slug);
  const session = useTutorSession({ sessionId });

  // 3. Local turn list accumulated as turns arrive
  const [turns, setTurns] = useState<TutorTurnDTO[]>([]);

  // 4. Hydrate the state machine with the real opening turn carried via
  //    router state from `useResumeOrStart`. The hook dispatches a placeholder
  //    HYDRATED so the reducer leaves `loading`; we overwrite it once the
  //    real turn is available, but only while still in the placeholder state.
  useEffect(() => {
    if (!routerState?.openingTurn) return;
    if (session.state.kind !== 'loading' && session.state.kind !== 'ai_speaking')
      return;
    // Append the opening turn to our UI list once.
    setTurns((prev) => {
      if (prev.some((tt) => tt.id === routerState.openingTurn!.id)) return prev;
      return [...prev, routerState.openingTurn!];
    });
    if (session.state.kind === 'loading') {
      session.dispatch({
        type: 'HYDRATED',
        openingTurn: routerState.openingTurn,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routerState?.openingTurn, session.state.kind]);

  // 5. Append new AI turns as they arrive from the state machine.
  useEffect(() => {
    if (session.state.kind !== 'ai_speaking') return;
    const turn = session.state.turn;
    setTurns((prev) => {
      if (prev.some((tt) => tt.id === turn.id)) return prev;
      return [...prev, turn];
    });
  }, [session.state]);

  // 6. Error toasts
  useEffect(() => {
    if (session.state.kind !== 'error') return;
    const cause = session.state.cause;
    if (cause === 'stt_failed') {
      toast.error(
        t('tutor.session.sttFailedToast', {
          defaultValue: "Couldn't hear that — try again.",
        }),
      );
    } else if (cause === 'mic_denied') {
      toast.error(
        t('tutor.session.micDeniedHelp', {
          defaultValue: 'Microphone access is required.',
        }),
      );
    } else if (cause === 'network') {
      toast.error(
        t('tutor.session.networkErrorToast', {
          defaultValue: 'Network error. Try again.',
        }),
      );
    }
    // unsupported_browser handled by the dedicated screen below.
  }, [session.state, t]);

  // 7. Recording-panel mode is driven by the state machine.
  const recordingMode: 'idle' | 'recording' | 'processing' =
    session.state.kind === 'recording'
      ? 'recording'
      : session.state.kind === 'processing'
        ? 'processing'
        : 'idle';

  const handleStartRecording = async () => {
    await session.mic.start();
    if (session.mic.error) {
      // useMicRecorder already fires telemetry; surface a toast.
      toast.error(
        t('tutor.session.micDeniedHelp', {
          defaultValue: 'Microphone access is required.',
        }),
      );
      return;
    }
    session.dispatch({ type: 'RECORD_START', startedAt: Date.now() });
  };

  const handleSubmitRecording = async () => {
    session.mic.stop();
    // Let the mic blob settle (MediaRecorder.onstop is async).
    await new Promise((r) => setTimeout(r, 50));
    const currentTaskId =
      scenario?.tasks.find((tk) => tk.id === routerState?.currentTaskId)?.id ??
      scenario?.tasks[0]?.id;
    if (!currentTaskId) return;
    await session.submitTurn(currentTaskId);
  };

  const handleCancelRecording = () => {
    session.mic.cancel();
    session.dispatch({ type: 'RECORD_CANCEL' });
  };

  // 8. Render branches

  // Unsupported browser short-circuit (covers MediaRecorder-less environments).
  if (!support.ok) {
    return (
      <div className="py-12 text-center">
        <p className="text-base text-gray-700 dark:text-gray-300">
          {t('tutor.session.unsupported', {
            defaultValue:
              'This browser doesn’t support recording. Please try Chrome, Edge, Firefox (desktop) or iOS Safari 16+ / Chrome Android.',
          })}
        </p>
      </div>
    );
  }

  // Terminal: lesson complete.
  if (session.state.kind === 'lesson_complete') {
    return (
      <LessonCompleteScreen
        xpAwarded={session.state.xpAwarded}
        corrections={session.state.corrections}
        turns={turns}
      />
    );
  }

  if (!scenario) {
    return (
      <p className="py-8 text-center text-gray-500">
        {t('common.loading', { defaultValue: 'Loading…' })}
      </p>
    );
  }

  const currentTask =
    scenario.tasks.find((tk) => tk.id === routerState?.currentTaskId) ??
    scenario.tasks[0];
  const tasksTotal = scenario.tasks.length;
  // v1: derive tasks-done from local turn flags. The state machine doesn't
  // expose completed_task_ids directly; turn.task_completed is set on user
  // turns whose evaluation advances the task pointer.
  const tasksDone = turns.filter((tt) => tt.task_completed).length;
  const lastTurn = turns[turns.length - 1];

  return (
    <div className="pb-32">
      {currentTask && (
        <TaskProgressBanner
          tasksDone={tasksDone}
          tasksTotal={tasksTotal}
          currentTaskVi={currentTask.title_vi}
          currentTaskEn={currentTask.title_en}
          taskCompleted={lastTurn?.task_completed ?? false}
        />
      )}

      <section className="space-y-3 mt-4">
        {turns.map((turn) => (
          <DialogueCard
            key={turn.id}
            turn={turn}
            onRepeat={() => {
              void session.tts.play({
                text: turn.text_en ?? '',
                audioUrl: turn.audio_url,
              });
            }}
            onFlag={() => {
              /* no-op for Spec 1 */
            }}
          />
        ))}
      </section>

      <RecordingPanel
        mode={recordingMode}
        stream={session.mic.stream}
        onStart={handleStartRecording}
        onStop={handleSubmitRecording}
        onCancel={handleCancelRecording}
        disabled={session.state.kind !== 'awaiting_user_speech'}
      />

      {session.state.kind === 'end_lesson_confirm' && (
        <EndLessonModal
          isOpen
          tasksDone={session.state.tasksDone}
          tasksTotal={session.state.tasksTotal}
          onConfirm={() => {
            session.dispatch({ type: 'END_LESSON_CONFIRM' });
            void session.finishSession();
          }}
          onDismiss={() => session.dispatch({ type: 'END_LESSON_DISMISS' })}
        />
      )}
    </div>
  );
}
