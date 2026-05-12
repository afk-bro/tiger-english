import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useScenario } from '@/features/ai-tutor/hooks/useScenario';
import { PhraseCard } from '@/features/ai-tutor/components/PhraseCard';

export default function PhrasebookPage() {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const { scenario, isLoading, error } = useScenario(slug);

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
        {t('tutor.phrasebook.notFound', { defaultValue: 'Phrasebook not found.' })}
      </p>
    );
  }

  return (
    <div className="space-y-5 py-4">
      <header>
        <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
          {t('tutor.phrasebook.title', { defaultValue: 'Useful phrases for this conversation' })}
        </h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {t('tutor.phrasebook.viSupport', {
            defaultValue: 'Học một vài câu hữu ích trước khi bắt đầu cuộc trò chuyện.',
          })}
        </p>
      </header>

      <ul className="space-y-3">
        {scenario.phrases.map((p) => (
          <li key={p.id}>
            <PhraseCard phrase={p} />
          </li>
        ))}
      </ul>

      <Link
        to={`/ai-tutor/scenarios/${slug}/briefing`}
        className="block w-full text-center px-4 py-3 rounded-md bg-primary-500 text-white text-sm font-semibold hover:bg-primary-600"
      >
        {t('tutor.phrasebook.next', { defaultValue: 'Next' })}
      </Link>
    </div>
  );
}
