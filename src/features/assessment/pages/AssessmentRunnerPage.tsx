import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Pause } from "lucide-react";
import ProgressDots from "../components/ProgressDots";

type SectionKey = "listening" | "reading" | "vocabulary" | "grammar" | "speaking" | "writing";

const SECTIONS: SectionKey[] = [
  "listening",
  "reading",
  "vocabulary",
  "grammar",
  "speaking",
  "writing",
];

// ─── Listening Section ───────────────────────────────────────────────────────

function ListeningSection() {
  const [selected, setSelected] = useState<number | null>(null);
  const options = [
    "She went to the market to buy vegetables.",
    "She called a friend on her mobile phone.",
    "She decided to cook dinner at home.",
    "She took a taxi to the restaurant.",
  ];
  return (
    <div className="space-y-6">
      <div className="bg-gray-100 dark:bg-gray-800 rounded-xl p-6 flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center">
          <svg className="w-8 h-8 text-primary-600 dark:text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072M12 6v12m0 0a6 6 0 01-6-6m6 6a6 6 0 006-6" />
          </svg>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Audio player placeholder</p>
        <button
          type="button"
          className="px-4 py-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors"
          disabled
        >
          ▶ Play audio
        </button>
      </div>
      <p className="text-sm font-medium text-semantic-text">What did the woman decide to do?</p>
      <div className="space-y-2">
        {options.map((opt, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setSelected(i)}
            className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
              selected === i
                ? "border-primary-500 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-semantic-text hover:border-primary-300 dark:hover:border-primary-600"
            }`}
          >
            <span className="font-medium mr-2">{String.fromCharCode(65 + i)}.</span>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Reading Section ─────────────────────────────────────────────────────────

function ReadingSection() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const passage = `Sarah works at a local bookshop near the city centre. Every morning, she opens the shop at 9 o'clock and arranges the new books on the shelves. She especially enjoys recommending books to customers who are not sure what to read. On Saturdays, the shop hosts a reading club where children can listen to stories. Sarah thinks this is the best part of her week. She believes that reading is one of the most important skills a person can develop.`;
  const questions = [
    { q: "Where does Sarah work?", opts: ["A library", "A bookshop", "A school", "A café"] },
    { q: "What time does the shop open?", opts: ["8 o'clock", "10 o'clock", "9 o'clock", "11 o'clock"] },
    { q: "What does Sarah enjoy doing?", opts: ["Arranging shelves", "Recommending books", "Counting money", "Closing the shop"] },
    { q: "What happens on Saturdays?", opts: ["The shop is closed", "A reading club for children", "A staff meeting", "A book sale"] },
    { q: "What does Sarah believe about reading?", opts: [
      "It is only for children",
      "It is boring",
      "It is an important skill",
      "It is too difficult",
    ]},
  ];
  return (
    <div className="space-y-6">
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-5 text-sm text-semantic-text leading-relaxed border border-gray-200 dark:border-gray-700">
        {passage}
      </div>
      <div className="space-y-5">
        {questions.map((item, qi) => (
          <div key={qi} className="space-y-2">
            <p className="text-sm font-medium text-semantic-text">{qi + 1}. {item.q}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {item.opts.map((opt, oi) => (
                <label
                  key={oi}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm cursor-pointer transition-colors ${
                    answers[qi] === oi
                      ? "border-primary-500 bg-primary-50 dark:bg-primary-900/30"
                      : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-primary-300"
                  }`}
                >
                  <input
                    type="radio"
                    name={`q${qi}`}
                    value={oi}
                    checked={answers[qi] === oi}
                    onChange={() => setAnswers((prev) => ({ ...prev, [qi]: oi }))}
                    className="accent-primary-500"
                  />
                  {opt}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Vocabulary Section ──────────────────────────────────────────────────────

const VOCAB_WORDS = [
  { word: "Eloquent", def: "fluent or persuasive in speaking or writing" },
  { word: "Ambiguous", def: "open to more than one interpretation" },
  { word: "Persevere", def: "continue in a course of action despite difficulty" },
  { word: "Collaborate", def: "work jointly on an activity or project" },
  { word: "Anticipate", def: "regard as probable; expect or predict" },
  { word: "Consequence", def: "a result or effect of an action or condition" },
  { word: "Distinguish", def: "recognize or treat as different" },
  { word: "Facilitate", def: "make an action or process easy or easier" },
  { word: "Inevitable", def: "certain to happen; unavoidable" },
  { word: "Negotiate", def: "try to reach an agreement through discussion" },
  { word: "Objective", def: "not influenced by personal feelings; unbiased" },
  { word: "Perceive", def: "become aware of something through the senses" },
  { word: "Relevant", def: "closely connected or appropriate to the matter at hand" },
  { word: "Subsequent", def: "coming after or following" },
  { word: "Transparent", def: "easy to perceive or detect; open" },
  { word: "Undermine", def: "erode the base or foundation of" },
  { word: "Validate", def: "check or prove the validity of" },
  { word: "Withstand", def: "remain undamaged by; resist" },
  { word: "Acknowledge", def: "accept or admit the existence or truth of" },
  { word: "Beneficial", def: "resulting in good; favorable" },
  { word: "Coherent", def: "logical and consistent; clearly articulated" },
  { word: "Deduce", def: "arrive at a conclusion by reasoning" },
  { word: "Enhance", def: "intensify, increase, or further improve" },
  { word: "Formulate", def: "create or devise methodically" },
  { word: "Generate", def: "cause something to arise or come about" },
  { word: "Hypothesis", def: "a proposed explanation for a phenomenon" },
  { word: "Illustrate", def: "explain or make clear by using examples" },
  { word: "Justify", def: "show or prove to be right or reasonable" },
  { word: "Maintain", def: "cause or enable a condition or state to continue" },
  { word: "Narrative", def: "a spoken or written account of events; a story" },
];

function VocabularySection() {
  const [currentWord, setCurrentWord] = useState(0);
  const [responses, setResponses] = useState<Record<number, "know" | "unsure">>({});

  function handleResponse(response: "know" | "unsure") {
    setResponses((prev) => ({ ...prev, [currentWord]: response }));
    if (currentWord < VOCAB_WORDS.length - 1) {
      setCurrentWord((prev) => prev + 1);
    }
  }

  const item = VOCAB_WORDS[currentWord];
  const knownCount = Object.values(responses).filter((r) => r === "know").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <span>Word {currentWord + 1} of {VOCAB_WORDS.length}</span>
        <span className="text-green-600 dark:text-green-400 font-medium">
          {knownCount} known
        </span>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center shadow-sm">
        <p className="text-3xl font-bold text-semantic-text mb-3">{item.word}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 italic">{item.def}</p>
        {responses[currentWord] && (
          <span className={`mt-4 inline-block px-3 py-1 rounded-full text-xs font-medium ${
            responses[currentWord] === "know"
              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
              : "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300"
          }`}>
            {responses[currentWord] === "know" ? "I know this" : "Not sure"}
          </span>
        )}
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => handleResponse("unsure")}
          className="flex-1 px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-semantic-text text-sm font-medium hover:border-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 transition-colors"
        >
          Not sure
        </button>
        <button
          type="button"
          onClick={() => handleResponse("know")}
          className="flex-1 px-4 py-3 rounded-lg border-2 border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-sm font-medium hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors"
        >
          I know this ✓
        </button>
      </div>

      <div className="flex justify-between text-sm">
        <button
          type="button"
          onClick={() => setCurrentWord((prev) => Math.max(0, prev - 1))}
          disabled={currentWord === 0}
          className="text-primary-600 dark:text-primary-400 hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>
        <button
          type="button"
          onClick={() => setCurrentWord((prev) => Math.min(VOCAB_WORDS.length - 1, prev + 1))}
          disabled={currentWord === VOCAB_WORDS.length - 1}
          className="text-primary-600 dark:text-primary-400 hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

// ─── Grammar Section ─────────────────────────────────────────────────────────

const CLOZE_ITEMS = [
  { prompt: "The cat ___ on the mat.", answer: "sat" },
  { prompt: "She ___ to school every day.", answer: "goes" },
  { prompt: "They have ___ the report.", answer: "finished" },
  { prompt: "We ___ arrived before the meeting started.", answer: "had" },
  { prompt: "He ___ reading for two hours.", answer: "has been" },
  { prompt: "The children ___ playing outside.", answer: "were" },
  { prompt: "I wish I ___ more time to practice.", answer: "had" },
  { prompt: "If it rains, we ___ stay inside.", answer: "will" },
  { prompt: "She asked me where I ___.", answer: "lived" },
  { prompt: "The book ___ by the student yesterday.", answer: "was read" },
  { prompt: "You ___ to bring your passport to the exam.", answer: "need" },
  { prompt: "Neither he nor she ___ the answer.", answer: "knows" },
  { prompt: "By the time we arrived, the film ___.", answer: "had started" },
  { prompt: "He is looking forward to ___ you.", answer: "meeting" },
  { prompt: "The results ___ announced tomorrow.", answer: "will be" },
];

function GrammarSection() {
  const [currentItem, setCurrentItem] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});

  const item = CLOZE_ITEMS[currentItem];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
        <span>Item {currentItem + 1} of {CLOZE_ITEMS.length}</span>
        <span className="text-primary-600 dark:text-primary-400 font-medium">
          {Object.keys(answers).length} answered
        </span>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
        <p className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2 font-medium">
          Fill in the blank
        </p>
        <p className="text-lg text-semantic-text font-medium mb-4">{item.prompt}</p>
        <input
          type="text"
          value={answers[currentItem] ?? ""}
          onChange={(e) => setAnswers((prev) => ({ ...prev, [currentItem]: e.target.value }))}
          placeholder="Type your answer here..."
          className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-semantic-text text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          aria-label="Fill in the blank answer"
        />
      </div>

      <div className="flex justify-between text-sm">
        <button
          type="button"
          onClick={() => setCurrentItem((prev) => Math.max(0, prev - 1))}
          disabled={currentItem === 0}
          className="text-primary-600 dark:text-primary-400 hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
        >
          ← Previous
        </button>
        <button
          type="button"
          onClick={() => setCurrentItem((prev) => Math.min(CLOZE_ITEMS.length - 1, prev + 1))}
          disabled={currentItem === CLOZE_ITEMS.length - 1}
          className="text-primary-600 dark:text-primary-400 hover:underline disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

// ─── Speaking Section ─────────────────────────────────────────────────────────

function SpeakingSection() {
  return (
    <div className="space-y-6">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-5">
        <p className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
          AI Conversation Prompt
        </p>
        <p className="text-sm text-blue-600 dark:text-blue-400">
          Speak with AI tutor about the following topic:
        </p>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 text-center space-y-4">
        <p className="text-base font-medium text-semantic-text">
          Describe your ideal holiday destination. Where would you go and what would you do there?
        </p>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Speak clearly for at least 1 minute. Your response will be evaluated by the AI tutor.
        </p>
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
            disabled
          >
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            Record response
          </button>
        </div>
        <p className="text-xs text-gray-400 dark:text-gray-500">
          Microphone access required. Speaking assessment is in preview mode.
        </p>
      </div>
    </div>
  );
}

// ─── Writing Section ─────────────────────────────────────────────────────────

const TARGET_WORDS = 150;

function WritingSection() {
  const [text, setText] = useState("");
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const progress = Math.min((wordCount / TARGET_WORDS) * 100, 100);

  return (
    <div className="space-y-4">
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
        <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Writing Task</p>
        <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
          Write about a time when you had to solve a difficult problem. Describe what happened,
          how you dealt with it, and what you learned. (Target: {TARGET_WORDS} words)
        </p>
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={10}
        placeholder="Start writing here..."
        className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-semantic-text text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
        aria-label="Writing response"
      />
      <div className="flex items-center justify-between text-sm">
        <span className={`font-medium ${
          wordCount >= TARGET_WORDS
            ? "text-green-600 dark:text-green-400"
            : "text-gray-500 dark:text-gray-400"
        }`}>
          {wordCount} / {TARGET_WORDS} words
        </span>
        {wordCount >= TARGET_WORDS && (
          <span className="text-green-600 dark:text-green-400 text-xs font-medium">
            Target reached ✓
          </span>
        )}
      </div>
      <div className="w-full h-1.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
        <div
          className="h-full rounded-full bg-primary-500 transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

// ─── Section Renderer ─────────────────────────────────────────────────────────

function SectionContent({ section }: { section: SectionKey }) {
  switch (section) {
    case "listening": return <ListeningSection />;
    case "reading": return <ReadingSection />;
    case "vocabulary": return <VocabularySection />;
    case "grammar": return <GrammarSection />;
    case "speaking": return <SpeakingSection />;
    case "writing": return <WritingSection />;
  }
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AssessmentRunnerPage() {
  const { username, level } = useParams<{ username: string; level: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [currentSection, setCurrentSection] = useState(0);
  const [completedSections, setCompletedSections] = useState<number[]>([]);

  const displayLevel = level?.toUpperCase() ?? "A1";

  function handleNext() {
    const newCompleted = [...completedSections, currentSection];
    setCompletedSections(newCompleted);

    if (currentSection < SECTIONS.length - 1) {
      setCurrentSection((prev) => prev + 1);
    } else {
      navigate(`/u/${username}/assessment/${level}/results`);
    }
  }

  const sectionName = t(`assessment.runner.sections.${SECTIONS[currentSection]}`);

  return (
    <div className="min-h-screen bg-semantic-bg">
      {/* Top bar */}
      <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                {t("assessment.runner.section", {
                  current: currentSection + 1,
                  total: SECTIONS.length,
                })}
              </span>
              <span className="text-xs font-semibold text-semantic-text">{displayLevel} {t("assessment.runner.title")}</span>
            </div>
            <div className="flex items-center gap-3">
              <ProgressDots
                total={SECTIONS.length}
                current={currentSection}
                completed={completedSections}
              />
            </div>
          </div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <Pause className="w-3 h-3" />
            {t("assessment.runner.pause")}
          </Link>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-semantic-text">{sectionName}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Section {currentSection + 1} of {SECTIONS.length}
          </p>
        </div>

        <div className="card p-6 mb-8">
          <SectionContent section={SECTIONS[currentSection]} />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleNext}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            {currentSection < SECTIONS.length - 1
              ? t("assessment.runner.next")
              : "Finish assessment"}
            <span aria-hidden="true">→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
