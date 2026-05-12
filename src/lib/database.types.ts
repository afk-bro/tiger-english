export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      ai_tutor_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          payload: Json
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_tutor_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_tutor_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_tutor_scenario_phrases: {
        Row: {
          audio_path: string | null
          id: string
          phrase_en: string
          scenario_id: string
          sort_order: number
          translation_vi: string
        }
        Insert: {
          audio_path?: string | null
          id?: string
          phrase_en: string
          scenario_id: string
          sort_order: number
          translation_vi: string
        }
        Update: {
          audio_path?: string | null
          id?: string
          phrase_en?: string
          scenario_id?: string
          sort_order?: number
          translation_vi?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_tutor_scenario_phrases_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "ai_tutor_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_tutor_scenario_tasks: {
        Row: {
          accept_patterns: Json
          correction_templates: Json
          id: string
          next_ai_line_audio_path: string | null
          next_ai_line_en: string | null
          scenario_id: string
          sort_order: number
          task_key: string
          title_en: string
          title_vi: string
        }
        Insert: {
          accept_patterns: Json
          correction_templates?: Json
          id?: string
          next_ai_line_audio_path?: string | null
          next_ai_line_en?: string | null
          scenario_id: string
          sort_order: number
          task_key: string
          title_en: string
          title_vi: string
        }
        Update: {
          accept_patterns?: Json
          correction_templates?: Json
          id?: string
          next_ai_line_audio_path?: string | null
          next_ai_line_en?: string | null
          scenario_id?: string
          sort_order?: number
          task_key?: string
          title_en?: string
          title_vi?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_tutor_scenario_tasks_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "ai_tutor_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_tutor_scenarios: {
        Row: {
          ai_persona: string | null
          created_at: string
          description_en: string | null
          description_vi: string | null
          goal_en: string | null
          goal_vi: string | null
          id: string
          is_free: boolean
          level: string
          mode: string
          opening_audio_path: string | null
          opening_line_en: string
          slug: string
          sort_order: number
          title_en: string
          title_vi: string
          updated_at: string
        }
        Insert: {
          ai_persona?: string | null
          created_at?: string
          description_en?: string | null
          description_vi?: string | null
          goal_en?: string | null
          goal_vi?: string | null
          id?: string
          is_free?: boolean
          level: string
          mode: string
          opening_audio_path?: string | null
          opening_line_en: string
          slug: string
          sort_order?: number
          title_en: string
          title_vi: string
          updated_at?: string
        }
        Update: {
          ai_persona?: string | null
          created_at?: string
          description_en?: string | null
          description_vi?: string | null
          goal_en?: string | null
          goal_vi?: string | null
          id?: string
          is_free?: boolean
          level?: string
          mode?: string
          opening_audio_path?: string | null
          opening_line_en?: string
          slug?: string
          sort_order?: number
          title_en?: string
          title_vi?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_tutor_sessions: {
        Row: {
          completed_at: string | null
          completed_task_ids: string[]
          current_task_id: string | null
          id: string
          last_activity_at: string
          mistake_count: number
          scenario_id: string
          started_at: string
          status: string
          user_id: string
          xp_awarded: number
        }
        Insert: {
          completed_at?: string | null
          completed_task_ids?: string[]
          current_task_id?: string | null
          id?: string
          last_activity_at?: string
          mistake_count?: number
          scenario_id: string
          started_at?: string
          status: string
          user_id: string
          xp_awarded?: number
        }
        Update: {
          completed_at?: string | null
          completed_task_ids?: string[]
          current_task_id?: string | null
          id?: string
          last_activity_at?: string
          mistake_count?: number
          scenario_id?: string
          started_at?: string
          status?: string
          user_id?: string
          xp_awarded?: number
        }
        Relationships: [
          {
            foreignKeyName: "ai_tutor_sessions_current_task_id_fkey"
            columns: ["current_task_id"]
            isOneToOne: false
            referencedRelation: "ai_tutor_scenario_tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_tutor_sessions_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "ai_tutor_scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_tutor_turns: {
        Row: {
          audio_path: string | null
          correction: Json | null
          created_at: string
          evaluator_result: Json | null
          id: string
          session_id: string
          speaker: string
          task_completed: boolean
          task_id: string | null
          text_en: string | null
          user_id: string
        }
        Insert: {
          audio_path?: string | null
          correction?: Json | null
          created_at?: string
          evaluator_result?: Json | null
          id?: string
          session_id: string
          speaker: string
          task_completed?: boolean
          task_id?: string | null
          text_en?: string | null
          user_id: string
        }
        Update: {
          audio_path?: string | null
          correction?: Json | null
          created_at?: string
          evaluator_result?: Json | null
          id?: string
          session_id?: string
          speaker?: string
          task_completed?: boolean
          task_id?: string | null
          text_en?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_tutor_turns_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "ai_tutor_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_tutor_turns_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "ai_tutor_scenario_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      exercise_attempts: {
        Row: {
          attempted_at: string
          exercise_id: string
          id: number
          is_correct: boolean
          section_key: string
          unit_slug: string
          user_id: string
        }
        Insert: {
          attempted_at?: string
          exercise_id: string
          id?: number
          is_correct: boolean
          section_key: string
          unit_slug: string
          user_id: string
        }
        Update: {
          attempted_at?: string
          exercise_id?: string
          id?: number
          is_correct?: boolean
          section_key?: string
          unit_slug?: string
          user_id?: string
        }
        Relationships: []
      }
      flashcard_reviews: {
        Row: {
          flashcard_id: string
          id: number
          reviewed_at: string
          status: string
          user_id: string
        }
        Insert: {
          flashcard_id: string
          id?: number
          reviewed_at?: string
          status: string
          user_id: string
        }
        Update: {
          flashcard_id?: string
          id?: number
          reviewed_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcard_reviews_flashcard_id_fkey"
            columns: ["flashcard_id"]
            isOneToOne: false
            referencedRelation: "flashcards"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcard_sets: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_public: boolean
          share_token: string | null
          slug: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean
          share_token?: string | null
          slug?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_public?: boolean
          share_token?: string | null
          slug?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flashcard_sets_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcard_translations: {
        Row: {
          created_at: string
          flashcard_id: string
          is_reviewed: boolean
          language_code: string
          native_audio_url: string | null
          native_text: string
          source: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          flashcard_id: string
          is_reviewed?: boolean
          language_code: string
          native_audio_url?: string | null
          native_text: string
          source?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          flashcard_id?: string
          is_reviewed?: boolean
          language_code?: string
          native_audio_url?: string | null
          native_text?: string
          source?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flashcard_translations_flashcard_id_fkey"
            columns: ["flashcard_id"]
            isOneToOne: false
            referencedRelation: "flashcards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flashcard_translations_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "flashcard_translations_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      flashcards: {
        Row: {
          category: string | null
          created_at: string
          english_audio_url: string | null
          english_text: string
          example_sentence: string | null
          id: string
          image_url: string | null
          is_phrase: boolean
          level: string | null
          native_text: string
          notes: string | null
          part_of_speech: string | null
          set_id: string
          sort_order: number
        }
        Insert: {
          category?: string | null
          created_at?: string
          english_audio_url?: string | null
          english_text: string
          example_sentence?: string | null
          id?: string
          image_url?: string | null
          is_phrase?: boolean
          level?: string | null
          native_text: string
          notes?: string | null
          part_of_speech?: string | null
          set_id: string
          sort_order?: number
        }
        Update: {
          category?: string | null
          created_at?: string
          english_audio_url?: string | null
          english_text?: string
          example_sentence?: string | null
          id?: string
          image_url?: string | null
          is_phrase?: boolean
          level?: string | null
          native_text?: string
          notes?: string | null
          part_of_speech?: string | null
          set_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "flashcards_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "flashcard_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      languages: {
        Row: {
          code: string
          name: string
        }
        Insert: {
          code: string
          name: string
        }
        Update: {
          code?: string
          name?: string
        }
        Relationships: []
      }
      lesson_section_progress: {
        Row: {
          completed_at: string
          section_key: string
          unit_slug: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          section_key: string
          unit_slug: string
          user_id: string
        }
        Update: {
          completed_at?: string
          section_key?: string
          unit_slug?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          cefr_estimate: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          native_language: string | null
          target_cefr_level: string | null
          timezone: string | null
          username: string
        }
        Insert: {
          cefr_estimate?: string | null
          created_at?: string
          email: string
          first_name: string
          id: string
          last_name: string
          native_language?: string | null
          target_cefr_level?: string | null
          timezone?: string | null
          username: string
        }
        Update: {
          cefr_estimate?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          native_language?: string | null
          target_cefr_level?: string | null
          timezone?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_native_language_fkey"
            columns: ["native_language"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      review_items: {
        Row: {
          answer: string
          created_at: string
          ease_factor: number
          id: string
          interval_days: number
          item_type: string
          last_reviewed_at: string | null
          next_review_at: string
          note: string | null
          prompt: string
          source_id: string | null
          source_type: string | null
          streak_correct: number
          translation: string | null
          user_id: string
        }
        Insert: {
          answer: string
          created_at?: string
          ease_factor?: number
          id?: string
          interval_days?: number
          item_type: string
          last_reviewed_at?: string | null
          next_review_at?: string
          note?: string | null
          prompt: string
          source_id?: string | null
          source_type?: string | null
          streak_correct?: number
          translation?: string | null
          user_id: string
        }
        Update: {
          answer?: string
          created_at?: string
          ease_factor?: number
          id?: string
          interval_days?: number
          item_type?: string
          last_reviewed_at?: string | null
          next_review_at?: string
          note?: string | null
          prompt?: string
          source_id?: string | null
          source_type?: string | null
          streak_correct?: number
          translation?: string | null
          user_id?: string
        }
        Relationships: []
      }
      skill_scores: {
        Row: {
          last_updated_at: string
          sample_size: number
          score: number
          skill: string
          user_id: string
        }
        Insert: {
          last_updated_at?: string
          sample_size?: number
          score?: number
          skill: string
          user_id: string
        }
        Update: {
          last_updated_at?: string
          sample_size?: number
          score?: number
          skill?: string
          user_id?: string
        }
        Relationships: []
      }
      user_activity_log: {
        Row: {
          created_at: string
          id: number
          idempotency_key: string | null
          payload: Json
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: number
          idempotency_key?: string | null
          payload?: Json
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: number
          idempotency_key?: string | null
          payload?: Json
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_card_progress: {
        Row: {
          created_at: string
          flashcard_id: string
          last_studied_at: string | null
          status: Database["public"]["Enums"]["card_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          flashcard_id: string
          last_studied_at?: string | null
          status?: Database["public"]["Enums"]["card_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          flashcard_id?: string
          last_studied_at?: string | null
          status?: Database["public"]["Enums"]["card_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_card_progress_flashcard_id_fkey"
            columns: ["flashcard_id"]
            isOneToOne: false
            referencedRelation: "flashcards"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_card_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_stats: {
        Row: {
          created_at: string
          id: string
          last_login: string | null
          level: number
          study_streak: number
          user_id: string
          xp: number
        }
        Insert: {
          created_at?: string
          id?: string
          last_login?: string | null
          level?: number
          study_streak?: number
          user_id: string
          xp?: number
        }
        Update: {
          created_at?: string
          id?: string
          last_login?: string | null
          level?: number
          study_streak?: number
          user_id?: string
          xp?: number
        }
        Relationships: [
          {
            foreignKeyName: "user_stats_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      abandon_tutor_session_tx: {
        Args: { _reason: string; _session_id: string }
        Returns: undefined
      }
      complete_lesson_section_tx: {
        Args: {
          p_idempotency_key: string
          p_section_key: string
          p_unit_slug: string
          p_user_id: string
        }
        Returns: {
          completed_at: string
          section_key: string
          unit_slug: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "lesson_section_progress"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      complete_tutor_session_tx: {
        Args: { _session_id: string; _xp_awarded: number }
        Returns: undefined
      }
      record_tutor_exchange_tx: {
        Args: {
          _ai_audio_path: string
          _ai_task_id: string
          _ai_text: string
          _completed_task_id: string
          _next_task_id: string
          _session_id: string
          _user_correction: Json
          _user_evaluator_result: Json
          _user_id: string
          _user_text: string
        }
        Returns: undefined
      }
      review_flashcard_tx: {
        Args: { p_flashcard_id: string; p_status: string; p_user_id: string }
        Returns: {
          flashcard_id: string
          id: number
          reviewed_at: string
          status: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "flashcard_reviews"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      start_tutor_session_tx: {
        Args: { _mode: string; _scenario_id: string; _user_id: string }
        Returns: string
      }
      submit_exercise_attempt_tx: {
        Args: {
          p_exercise_id: string
          p_is_correct: boolean
          p_section_key: string
          p_unit_slug: string
          p_user_id: string
        }
        Returns: {
          attempted_at: string
          exercise_id: string
          id: number
          is_correct: boolean
          section_key: string
          unit_slug: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "exercise_attempts"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      user_study_days: {
        Args: { p_tz: string; p_user_id: string }
        Returns: {
          day: string
        }[]
      }
    }
    Enums: {
      card_status: "unseen" | "known" | "unknown"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      card_status: ["unseen", "known", "unknown"],
    },
  },
} as const
