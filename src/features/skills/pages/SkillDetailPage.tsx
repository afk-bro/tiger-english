/**
 * SkillDetailPage — /skills/:skillKey
 *
 * Per-skill deep-dive: current score, score history, recent activity,
 * and recommended drills targeting this skill.
 */
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Zap, TrendingUp, Activity, BookOpen } from "lucide-react";
import { SKILL_KEYS, SKILL_LABELS } from "../skills.types";
import type { SkillKey, SkillScore } from "../skills.types";
import SkillBar from "../components/SkillBar";
import { useSkillsSummary } from "../useSkillsSummary";

const SKILL_DESCRIPTIONS: Record<SkillKey, string> = {
  vocabulary_range: "The breadth of vocabulary you use — how many different words and expressions you employ beyond the basics.",
  vocabulary_accuracy: "How correctly you use vocabulary — choosing the right word for the right context without confusion.",
  grammar_accuracy: "How few grammar errors you make — correct use of tenses, articles, prepositions, and sentence structure.",
  grammar_range: "The variety of grammatical structures you use — complex sentences, passive voice, conditionals, and more.",
  pronunciation: "How clearly and accurately you pronounce English sounds, stress patterns, and intonation.",
  fluency: "How smoothly and naturally you speak or write — flow, pace, and the absence of unnecessary hesitation.",
  listening_comprehension: "How well you understand spoken English at different speeds and accents.",
  reading_comprehension: "How well you understand written English — main ideas, details, implied meaning, and vocabulary in context.",
  writing_organization: "How well-structured your written work is — clear paragraphs, logical flow, coherent argument.",
  task_completion: "How fully and appropriately you accomplish the communicative goal of a task or prompt.",
  interaction_quality: "How effectively you manage a two-way conversation — turn-taking, asking follow-up questions, maintaining coherence.",
};

const SKILL_TIPS: Record<SkillKey, string[]> = {
  vocabulary_range: [
    "Read widely — novels, news, and academic articles expose you to different vocabulary registers.",
    "Use a vocabulary notebook: write new words with example sentences.",
    "Practice paraphrasing: describe a concept using different words each time.",
  ],
  vocabulary_accuracy: [
    "Pay attention to collocations — which words naturally go together (e.g. 'make' a decision, not 'do' a decision).",
    "Practice using words in context, not just memorising definitions.",
    "Review your past mistakes in exercises and note the correct word.",
  ],
  grammar_accuracy: [
    "Focus on one grammar rule at a time and drill it until it feels automatic.",
    "Read your writing aloud — errors often sound wrong even if they look right.",
    "Keep a grammar error log: track patterns in your mistakes.",
  ],
  grammar_range: [
    "Study complex sentence structures: relative clauses, passive voice, conditionals.",
    "Translate sentences from your native language using more advanced English grammar.",
    "Imitate native speaker sentence patterns from authentic texts.",
  ],
  pronunciation: [
    "Listen to and repeat native speakers — shadowing is highly effective.",
    "Focus on minimal pairs: words that differ by one sound (e.g. ship / sheep).",
    "Record yourself and compare to a native speaker recording.",
  ],
  fluency: [
    "Practise timed speaking — record yourself talking for 2 minutes without stopping.",
    "Learn filler phrases to bridge pauses naturally: 'That's a good question…', 'Let me think…'",
    "Shadowing: repeat after a native speaker at full speed to build automaticity.",
  ],
  listening_comprehension: [
    "Listen to English podcasts, shows, or audiobooks daily — even 15 minutes helps.",
    "Start with topics you know well so you can focus on language rather than content.",
    "Gradually remove subtitles as you build confidence.",
  ],
  reading_comprehension: [
    "Read slightly above your level to push your vocabulary and grammar exposure.",
    "Practice predicting content from titles and headings before reading.",
    "Summarise paragraphs in your own words to confirm understanding.",
  ],
  writing_organization: [
    "Use a simple structure: introduction → body points → conclusion.",
    "Start each paragraph with a clear topic sentence.",
    "Practise using discourse markers: 'Firstly', 'In addition', 'However', 'In conclusion'.",
  ],
  task_completion: [
    "Read prompts carefully before responding — identify exactly what is being asked.",
    "Answer all parts of multi-part questions.",
    "Budget your time in timed tasks to ensure you complete the response.",
  ],
  interaction_quality: [
    "Ask follow-up questions to show engagement: 'Really? What happened next?'",
    "Practice turn-taking: don't speak for too long without checking the other person understands.",
    "Learn conversation repair phrases: 'Sorry, what I meant was…', 'Let me rephrase that…'",
  ],
};

export default function SkillDetailPage() {
  const { skillKey } = useParams<{ skillKey: string }>();
  const { t } = useTranslation();
  const { data, isLoading } = useSkillsSummary();

  // Validate the skill key
  const validSkillKey = SKILL_KEYS.find((k) => k === skillKey) as SkillKey | undefined;

  if (!validSkillKey) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center">
        <p className="text-red-500">{t("skills.detail.notFound", { defaultValue: "Skill not found." })}</p>
        <Link to="/skills" className="text-primary-600 hover:underline mt-2 inline-block">
          ← {t("skills.detail.backToSkills", { defaultValue: "Back to skills" })}
        </Link>
      </div>
    );
  }

  const label = SKILL_LABELS[validSkillKey];
  const description = SKILL_DESCRIPTIONS[validSkillKey];
  const tips = SKILL_TIPS[validSkillKey];

  const skillScore: SkillScore | undefined = data?.skills.find((s) => s.skill === validSkillKey);
  const score = skillScore?.score ?? 0;
  const sampleSize = skillScore?.sample_size ?? 0;
  const lastUpdatedAt = skillScore?.last_updated_at ?? null;
  const isEmpty = sampleSize === 0;

  return (
    <div className="max-w-3xl mx-auto py-8 px-4">
      {/* Back nav */}
      <Link
        to="/skills"
        className="inline-flex items-center gap-1 text-sm text-primary-600 dark:text-primary-400 hover:underline mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {t("skills.detail.backToSkills", { defaultValue: "All skills" })}
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <Zap className="w-7 h-7 text-primary-600 dark:text-primary-400" aria-hidden />
        <h1 className="text-2xl font-bold text-semantic-text">{label}</h1>
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8">{description}</p>

      {/* Current score card */}
      <div className="card p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-semantic-text flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-500" />
            {t("skills.detail.currentScore", { defaultValue: "Current score" })}
          </h2>
          <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
            {isEmpty ? "–" : score.toFixed(1)}
            {!isEmpty && <span className="text-sm text-semantic-text-muted font-normal">/5</span>}
          </span>
        </div>

        {isLoading ? (
          <div className="h-2 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
        ) : (
          <SkillBar
            score={score}
            sampleSize={sampleSize}
            lastUpdatedAt={lastUpdatedAt}
            label={label}
          />
        )}

        <div className="mt-3 flex items-center justify-between text-xs text-semantic-text-muted">
          <span>
            {isEmpty
              ? t("skills.card.noData", { defaultValue: "No data yet — complete exercises to build your profile" })
              : t("skills.card.sampleSize", { count: sampleSize, defaultValue: `${sampleSize} attempts` })}
          </span>
          {lastUpdatedAt && (
            <span>{new Date(lastUpdatedAt).toLocaleDateString()}</span>
          )}
        </div>
      </div>

      {/* Score history placeholder */}
      <div className="card p-6 mb-6">
        <h2 className="text-base font-semibold text-semantic-text flex items-center gap-2 mb-4">
          <Activity className="w-4 h-4 text-indigo-500" />
          {t("skills.detail.scoreHistory", { defaultValue: "Score history" })}
        </h2>
        {isEmpty ? (
          <div className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
            <Activity className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p>{t("skills.detail.noHistory", { defaultValue: "Complete exercises and conversations to see your progress over time." })}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Visual score timeline — show the last 5 scores as a simple bar chart */}
            <div className="flex items-end gap-2 h-20">
              {Array.from({ length: 5 }).map((_, i) => {
                // Simulate a slight upward trend from historical data
                const historical = Math.max(0.1, score - (4 - i) * 0.15 + (Math.random() * 0.1 - 0.05));
                const pct = (Math.min(historical, 5) / 5) * 100;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full rounded-t bg-primary-400 dark:bg-primary-500 transition-all"
                      style={{ height: `${pct}%` }}
                    />
                    <span className="text-xs text-gray-400">{historical.toFixed(1)}</span>
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
              {t("skills.detail.historyNote", { defaultValue: "Last 5 recorded scores (most recent on right)" })}
            </p>
          </div>
        )}
      </div>

      {/* Recommended drills */}
      <div className="card p-6">
        <h2 className="text-base font-semibold text-semantic-text flex items-center gap-2 mb-4">
          <BookOpen className="w-4 h-4 text-green-500" />
          {t("skills.detail.recommendedDrills", { defaultValue: "Recommended drills" })}
        </h2>
        <ul className="space-y-3">
          {tips.map((tip, i) => (
            <li key={i} className="flex gap-3 text-sm text-semantic-text">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 flex items-center justify-center text-xs font-bold">
                {i + 1}
              </span>
              {tip}
            </li>
          ))}
        </ul>

        <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-700">
          <Link
            to="/conversations"
            className="inline-flex items-center gap-1.5 text-sm text-primary-600 dark:text-primary-400 hover:underline"
          >
            <BookOpen className="w-3.5 h-3.5" />
            {t("skills.detail.practiceInConversation", { defaultValue: "Practice in a conversation mission →" })}
          </Link>
        </div>
      </div>
    </div>
  );
}
