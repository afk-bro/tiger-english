import { useTranslation } from 'react-i18next';

interface Props {
  tasksDone: number;
  tasksTotal: number;
  currentTaskVi: string;
  currentTaskEn: string;
  taskCompleted?: boolean; // glow green when latest task completed
}

export function TaskProgressBanner({
  tasksDone,
  tasksTotal,
  currentTaskVi,
  currentTaskEn,
  taskCompleted = false,
}: Props) {
  const { t } = useTranslation();
  return (
    <div className="sticky top-12 z-10 -mx-4 px-4 py-3 bg-white/95 dark:bg-gray-950/95 backdrop-blur border-b border-gray-200 dark:border-gray-800">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
        {t('tutor.session.tasksProgress', {
          defaultValue: 'Tasks: {{done}} / {{total}} completed',
          done: tasksDone,
          total: tasksTotal,
        })}
      </p>
      <div
        className={`mt-2 flex items-center gap-3 rounded-lg border p-3 transition ${
          taskCompleted
            ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
            : 'border-gray-200 dark:border-gray-800'
        }`}
      >
        <span
          aria-hidden
          className={`text-xl ${taskCompleted ? 'text-green-600' : 'text-gray-300'}`}
        >
          {taskCompleted ? '✅' : '⭕'}
        </span>
        <div>
          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {currentTaskVi}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{currentTaskEn}</p>
        </div>
      </div>
    </div>
  );
}
