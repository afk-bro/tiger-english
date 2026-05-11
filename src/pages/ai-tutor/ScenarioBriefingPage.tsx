import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useScenario } from '@/features/ai-tutor/hooks/useScenario';
import { useResumeOrStart } from '@/features/ai-tutor/hooks/useResumeOrStart';

export default function ScenarioBriefingPage() {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const { scenario, isLoading, error } = useScenario(slug);
  const { existingActiveSessionId, startFresh, startContinue, isStarting } = useResumeOrStart({
    slug: slug ?? '',
    scenarioDetail: scenario,
  });

  if (isLoading) {
    return (
      <p className="py-8 text-center text-gray-500">
        {t('common.loading', { defaultValue: 'Loading…' })}
      </p>
    );
  }
  if (error) {
    return <p className="py-8 text-center text-red-600">{error.message}</p>;
  }
  if (!scenario) {
    return (
      <p className="py-8 text-center text-gray-500">
        {t('tutor.briefing.notFound', { defaultValue: 'Scenario not found.' })}
      </p>
    );
  }

  return (
    <div className="space-y-6 py-4">
      <header>
        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          {scenario.title_vi}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{scenario.title_en}</p>
      </header>

      {scenario.description_vi && (
        <section>
          <p className="text-base text-gray-900 dark:text-gray-100">{scenario.description_vi}</p>
          {scenario.description_en && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {scenario.description_en}
            </p>
          )}
        </section>
      )}

      {scenario.goal_vi && (
        <section className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-4">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {t('tutor.briefing.goalLabel', { defaultValue: 'Mục tiêu:' })} {scenario.goal_vi}
          </p>
          {scenario.goal_en && (
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {t('tutor.briefing.goalEnLabel', { defaultValue: 'Goal:' })} {scenario.goal_en}
            </p>
          )}
        </section>
      )}

      <section>
        <h2 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
          {t('tutor.briefing.tasksLabel', { defaultValue: 'Tasks' })}
        </h2>
        <ol className="mt-3 space-y-2">
          {scenario.tasks.map((task, i) => (
            <li
              key={task.id}
              className="flex gap-3 rounded-lg border border-gray-200 dark:border-gray-800 p-3"
            >
              <span className="font-semibold text-primary-600 dark:text-primary-400">{i + 1}.</span>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {task.title_vi}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{task.title_en}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="pt-2">
        {existingActiveSessionId ? (
          <div className="space-y-2">
            <button
              type="button"
              onClick={startContinue}
              disabled={isStarting}
              className="block w-full px-4 py-3 rounded-md bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 disabled:opacity-50"
            >
              {t('tutor.briefing.continueWhereLeftOff', {
                defaultValue: 'Continue where you left off',
              })}
            </button>
            <button
              type="button"
              onClick={startFresh}
              disabled={isStarting}
              className="block w-full px-4 py-3 rounded-md border border-gray-300 dark:border-gray-700 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
            >
              {t('tutor.briefing.startFresh', { defaultValue: 'Start fresh' })}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={startFresh}
            disabled={isStarting}
            className="block w-full px-4 py-3 rounded-md bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600 disabled:opacity-50"
          >
            {t('tutor.briefing.startLesson', { defaultValue: 'Start lesson' })}
          </button>
        )}
      </div>
    </div>
  );
}
