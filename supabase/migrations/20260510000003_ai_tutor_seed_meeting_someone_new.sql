-- =========================================================================
-- Seed: AI Tutor scenario "Meeting someone new"
--
-- Inserts the first free_talk scenario (A1, is_free=TRUE), its four ordered
-- tasks (introduce_self → ask_how_are_you → say_where_from →
-- ask_what_doing_today), and an 8-row phrasebook.
--
-- Idempotency: the entire seed is gated on the absence of an
-- ai_tutor_scenarios row with slug='meeting-someone-new'. Re-running the
-- migration after a successful apply is a no-op and never duplicates rows.
-- Chosen over per-table ON CONFLICT because ai_tutor_scenario_phrases has
-- no natural unique key — a single top-level guard is simpler and safer
-- than synthesizing one just for idempotency.
--
-- All audio_path / opening_audio_path / next_ai_line_audio_path values are
-- NULL here; Task 6 (the pre-generation script) backfills them.
-- =========================================================================

BEGIN;

WITH
  -- Insert the scenario row (or nothing, if already present).
  new_scenario AS (
    INSERT INTO ai_tutor_scenarios (
      slug,
      mode,
      level,
      is_free,
      title_en,
      title_vi,
      description_en,
      description_vi,
      goal_en,
      goal_vi,
      ai_persona,
      opening_line_en,
      opening_audio_path,
      sort_order
    )
    SELECT
      'meeting-someone-new',
      'free_talk',
      'A1',
      TRUE,
      'Meeting someone new',
      'Gặp người mới',
      'You are talking to a new friend. Introduce yourself and ask a few simple questions.',
      'Bạn đang nói chuyện với một người bạn mới. Hãy giới thiệu bản thân và hỏi một vài câu đơn giản.',
      'Have a short, friendly conversation with someone new.',
      'Có một cuộc trò chuyện ngắn, thân thiện với người mới.',
      'A friendly stranger you just met',
      'Hi! Nice to meet you. What''s your name?',
      NULL,
      0
    WHERE NOT EXISTS (
      SELECT 1 FROM ai_tutor_scenarios WHERE slug = 'meeting-someone-new'
    )
    RETURNING id
  ),

  -- Insert all four tasks in one statement, referencing the just-inserted id.
  -- The CROSS JOIN against new_scenario short-circuits to zero rows when
  -- the scenario already existed (CTE returned nothing).
  inserted_tasks AS (
    INSERT INTO ai_tutor_scenario_tasks (
      scenario_id,
      task_key,
      title_en,
      title_vi,
      accept_patterns,
      correction_templates,
      next_ai_line_en,
      next_ai_line_audio_path,
      sort_order
    )
    SELECT
      new_scenario.id,
      t.task_key,
      t.title_en,
      t.title_vi,
      t.accept_patterns::jsonb,
      t.correction_templates::jsonb,
      t.next_ai_line_en,
      NULL,
      t.sort_order
    FROM new_scenario
    CROSS JOIN (
      VALUES
        (
          'introduce_self',
          'Introduce yourself',
          'Giới thiệu bản thân',
          '["my name is", "i am ", "i''m ", {"regex": "^call me \\w+"}]',
          '[
            {
              "match_regex": "^my name (\\w+)$",
              "corrected_en_template": "My name is {1}.",
              "explanation_vi": "Bạn cần thêm ''is'' sau ''name''.",
              "explanation_key": "missing_be_verb_intro",
              "severity": "minor"
            },
            {
              "match_regex": "^me (\\w+)$",
              "corrected_en_template": "I''m {1}.",
              "explanation_vi": "Trong tiếng Anh dùng ''I''m'' thay vì ''Me'' khi giới thiệu.",
              "explanation_key": "wrong_pronoun_intro",
              "severity": "minor"
            }
          ]',
          'Nice to meet you! How are you today?',
          1
        ),
        (
          'ask_how_are_you',
          'Ask how the other person is doing',
          'Hỏi người kia khỏe không',
          '["how are you", "how''s it going", "how are you doing", "are you ok", "are you okay"]',
          '[
            {
              "match_regex": "^you how are$|^you are how$",
              "corrected_en_template": "How are you?",
              "explanation_vi": "Trật tự từ trong câu hỏi là: How + are + you.",
              "explanation_key": "wrong_word_order_how_are_you",
              "severity": "minor"
            }
          ]',
          'I''m doing great, thanks for asking! Where are you from?',
          2
        ),
        (
          'say_where_from',
          'Say where you are from',
          'Nói bạn đến từ đâu',
          '["i''m from", "i am from", "i live in", "i come from"]',
          '[
            {
              "match_regex": "^i (\\w+)$",
              "corrected_en_template": "I''m from {1}.",
              "explanation_vi": "Cần thêm ''m from'' sau ''I'' để nói bạn đến từ đâu.",
              "explanation_key": "missing_from_intro",
              "severity": "minor"
            }
          ]',
          'Cool! What are you doing today?',
          3
        ),
        (
          'ask_what_doing_today',
          'Ask what they are doing today',
          'Hỏi hôm nay họ đang làm gì',
          '["what are you doing", "what you doing today", "what''s your plan", "what are your plans"]',
          '[
            {
              "match_regex": "^you doing what$",
              "corrected_en_template": "What are you doing?",
              "explanation_vi": "Trật tự từ trong câu hỏi: What + are + you + doing?",
              "explanation_key": "wrong_word_order_what_doing",
              "severity": "minor"
            }
          ]',
          'Great job! That was a really nice chat. Want to end here?',
          4
        )
    ) AS t (
      task_key,
      title_en,
      title_vi,
      accept_patterns,
      correction_templates,
      next_ai_line_en,
      sort_order
    )
    RETURNING 1
  )

-- Insert the eight phrasebook rows. Same CROSS JOIN guard: if the scenario
-- pre-existed, new_scenario is empty and zero phrases insert.
INSERT INTO ai_tutor_scenario_phrases (
  scenario_id,
  phrase_en,
  translation_vi,
  audio_path,
  sort_order
)
SELECT
  new_scenario.id,
  p.phrase_en,
  p.translation_vi,
  NULL,
  p.sort_order
FROM new_scenario
CROSS JOIN (
  VALUES
    ('Hi, nice to meet you.',        'Rất vui được gặp bạn.',   1),
    ('My name is Tom.',              'Tên tôi là Tom.',          2),
    ('What''s your name?',           'Bạn tên là gì?',           3),
    ('How are you?',                 'Bạn khỏe không?',          4),
    ('Where are you from?',          'Bạn đến từ đâu?',          5),
    ('I''m from Vietnam.',           'Tôi đến từ Việt Nam.',     6),
    ('What are you doing today?',    'Hôm nay bạn làm gì?',      7),
    ('I''m studying English.',       'Tôi đang học tiếng Anh.',  8)
) AS p (phrase_en, translation_vi, sort_order);

COMMIT;
