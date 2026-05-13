export type SessionStatus = 'active' | 'completed' | 'abandoned';
export type Severity = 'none' | 'minor' | 'major';
export type Speaker = 'ai' | 'user';
export type EvaluationKind = 'evaluated' | 'vi_spoken';

export interface TutorScenarioSummary {
  slug: string;
  title_en: string;
  title_vi: string;
  level: string;
  mode: 'course' | 'free_talk';
  is_free: boolean;
}

export interface TutorTask {
  id: string;
  task_key: string;
  title_en: string;
  title_vi: string;
  sort_order: number;
  next_ai_line_en: string | null;
  next_ai_line_audio_url: string | null;
  // accept_patterns/correction_templates intentionally NOT shipped to client
}

export interface TutorPhrase {
  id: string;
  phrase_en: string;
  translation_vi: string;
  audio_url: string | null;
  sort_order: number;
}

export interface TutorScenarioDetail {
  id: string;
  slug: string;
  mode: 'course' | 'free_talk';
  level: string;
  title_en: string;
  title_vi: string;
  description_en: string | null;
  description_vi: string | null;
  goal_en: string | null;
  goal_vi: string | null;
  ai_persona: string | null;
  opening_line_en: string;
  opening_audio_url: string | null;
  is_free: boolean;
  tasks: TutorTask[];
  phrases: TutorPhrase[];
  existing_active_session_id: string | null;
}

export interface TurnCorrection {
  corrected_en: string;
  explanation_vi: string;
  translation_vi: string | null;
  severity: Severity;
  explanation_key: string | null;
}

export interface EvaluationResult {
  kind: EvaluationKind;
  task_completed: boolean;
  severity: Severity;
  correction: TurnCorrection | null;
  should_advance: boolean;
  matched_pattern: string | null;
}

export interface TutorTurnDTO {
  id: string;
  speaker: Speaker;
  text_en: string | null;
  audio_url: string | null;
  correction: TurnCorrection | null;
  task_completed: boolean;
  created_at: string;
}

export interface TutorSessionDTO {
  id: string;
  scenario_slug: string;
  status: SessionStatus;
  current_task_id: string | null;
  completed_task_ids: string[];
  mistake_count: number;
  xp_awarded: number;
  started_at: string;
  last_activity_at: string;
  completed_at: string | null;
}

export interface StartSessionResponse {
  session_id: string;
  status: 'active';
  current_task_id: string;
  opening_turn: TutorTurnDTO;
}

export interface TurnResponse {
  transcript: string;
  evaluation: EvaluationResult;
  session: TutorSessionDTO;
  new_turns: TutorTurnDTO[];
  current_task_id: string | null;
  end_lesson_detected: boolean;
  tasks_done: number | null;
  tasks_total: number | null;
}

export interface FinishResponse {
  session: TutorSessionDTO;
  xp_awarded: number;
  all_corrections: TurnCorrection[];
}

export type FrontendEventType =
  | 'mic.denied' | 'audio.fallback' | 'turn.failed.network' | 'unsupported_browser';

export interface ActiveTutorSessionDTO {
  session_id: string;
  scenario_slug: string;
  scenario_title_en: string;
  scenario_title_vi: string;
  last_activity_at: string;
  tasks_done: number;
  tasks_total: number;
}
