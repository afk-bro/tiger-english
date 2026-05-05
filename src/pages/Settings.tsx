// src/pages/Settings.tsx
import { useState, useEffect } from 'react';
import { useUserStore } from '@/stores/useUserStore';
import { authAPI } from '@/lib/api/auth';
import { supabase } from '@/lib/supabase';
import { SUPPORTED_LANGUAGES } from '@/schemas/authSchema';
import { useTranslation } from 'react-i18next';
import Button from '@/components/ui/Button';
import type { CefrLevel } from '@/features/lessons/lesson.types';

const CEFR_LEVELS: CefrLevel[] = ['A1', 'A2', 'B1', 'B1+', 'B2', 'C1'];

const CEFR_DESCRIPTIONS: Record<string, string> = {
  A1: 'Beginner',
  A2: 'Elementary',
  B1: 'Intermediate',
  'B1+': 'Upper-intermediate (lower)',
  B2: 'Upper-intermediate',
  C1: 'Advanced',
};

export default function Settings() {
  const { t } = useTranslation();

  const LANGUAGE_NAMES: Record<typeof SUPPORTED_LANGUAGES[number], string> = {
    th: t('flashcards.language.th'),
    zh: t('flashcards.language.zh'),
    vi: t('flashcards.language.vi'),
  };

  const { profile, setNativeLanguage } = useUserStore();
  const [selectedLang, setSelectedLang] = useState<string | null>(profile?.native_language ?? null);
  const [selectedTarget, setSelectedTarget] = useState<CefrLevel | null>(
    (profile?.target_cefr_level as CefrLevel) ?? null
  );
  const [saving, setSaving] = useState(false);
  const [savingTarget, setSavingTarget] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [targetError, setTargetError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [targetSaved, setTargetSaved] = useState(false);

  useEffect(() => {
    if (profile?.native_language != null) {
      setSelectedLang(profile.native_language);
    }
    if (profile?.target_cefr_level != null) {
      setSelectedTarget(profile.target_cefr_level as CefrLevel);
    }
  }, [profile?.native_language, profile?.target_cefr_level]);

  const handleSaveLang = async () => {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const result = await authAPI.updateProfile(
        { native_language: selectedLang },
        session.access_token,
      );

      if (!('id' in result)) {
        setError((result as { message: string }).message);
        return;
      }

      setNativeLanguage(selectedLang);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('common.error.message'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveTarget = async () => {
    setSavingTarget(true);
    setTargetError(null);
    setTargetSaved(false);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('Not authenticated');

      const result = await authAPI.updateProfile(
        { target_cefr_level: selectedTarget } as Record<string, unknown>,
        session.access_token,
      );

      if (!('id' in result)) {
        setTargetError((result as { message: string }).message);
        return;
      }

      setTargetSaved(true);
    } catch (err) {
      setTargetError(err instanceof Error ? err.message : t('common.error.message'));
    } finally {
      setSavingTarget(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
        {t('settings.title')}
      </h1>

      {/* Native language section */}
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
              onClick={() => { setSelectedLang(code); setSaved(false); }}
              className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                selectedLang === code
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
          onClick={handleSaveLang}
          disabled={saving || selectedLang === profile?.native_language}
        >
          {saving ? t('settings.saving') : t('settings.save')}
        </Button>
      </div>

      {/* Target CEFR level section */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-4">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-1">
          {t('settings.targetCefrLevel', { defaultValue: 'Target level' })}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          {t('settings.targetCefrLevelDesc', { defaultValue: 'Set your English goal. We\'ll track your progress towards this level.' })}
        </p>

        <div className="flex gap-2 flex-wrap mb-4">
          {CEFR_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => { setSelectedTarget(level); setTargetSaved(false); }}
              title={CEFR_DESCRIPTIONS[level]}
              className={`px-3 py-2 rounded-lg border text-sm font-semibold transition-colors ${
                selectedTarget === level
                  ? 'bg-amber-500 text-white border-amber-500'
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800'
              }`}
            >
              {level}
              <span className="block text-xs font-normal opacity-70">{CEFR_DESCRIPTIONS[level]}</span>
            </button>
          ))}
        </div>

        {selectedTarget && (
          <p className="text-sm text-amber-600 dark:text-amber-400 mb-3">
            🎯 {t('settings.targetSelected', { level: selectedTarget, defaultValue: `Target: ${selectedTarget} (${CEFR_DESCRIPTIONS[selectedTarget]})` })}
          </p>
        )}
        {targetError && <p className="text-sm text-red-500 mb-3">{targetError}</p>}
        {targetSaved && <p className="text-sm text-green-600 dark:text-green-400 mb-3">{t('settings.saved')}</p>}

        <Button
          variant="primary"
          onClick={handleSaveTarget}
          disabled={savingTarget || selectedTarget === profile?.target_cefr_level}
        >
          {savingTarget ? t('settings.saving') : t('settings.save')}
        </Button>
      </div>
    </div>
  );
}
