// src/pages/Settings.tsx
import { useState, useEffect } from 'react';
import { useUserStore } from '@/stores/useUserStore';
import { authAPI } from '@/lib/api/auth';
import { supabase } from '@/lib/supabase';
import { SUPPORTED_LANGUAGES } from '@/schemas/authSchema';
import { useTranslation } from 'react-i18next';
import Button from '@/components/ui/Button';

const LANGUAGE_NAMES: Record<typeof SUPPORTED_LANGUAGES[number], string> = {
  th: 'Thai',
  zh: 'Chinese',
  vi: 'Vietnamese',
};

export default function Settings() {
  const { t } = useTranslation();
  const { profile, setNativeLanguage } = useUserStore();
  const [selected, setSelected] = useState<string | null>(profile?.native_language ?? null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile?.native_language != null) {
      setSelected(profile.native_language);
    }
  }, [profile?.native_language]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const result = await authAPI.updateProfile(
        { native_language: selected },
        session.access_token,
      );

      if (!('id' in result)) {
        setError((result as { message: string }).message);
        return;
      }

      setNativeLanguage(selected);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
        {t('settings.title')}
      </h1>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-4">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">
          {t('settings.native_language')}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {t('settings.native_language_desc')}
        </p>

        <div className="flex gap-2 flex-wrap mb-4">
          {SUPPORTED_LANGUAGES.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => { setSelected(code); setSaved(false); }}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                selected === code
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              {LANGUAGE_NAMES[code]}
            </button>
          ))}
        </div>

        {error && <p className="text-sm text-red-500 mb-3">{error}</p>}
        {saved && <p className="text-sm text-green-600 dark:text-green-400 mb-3">{t('settings.saved')}</p>}

        <Button
          variant="primary"
          onClick={handleSave}
          disabled={saving || selected === profile?.native_language}
        >
          {saving ? t('settings.saving') : t('settings.save')}
        </Button>
      </div>
    </div>
  );
}
