-- supabase/migrations/20260319000004_seed_curated_sets.sql
-- Two curated global sets. created_by IS NULL = system/curated.
-- Fixed UUIDs make this idempotent across dev resets.

insert into flashcard_sets (id, title, description, is_public, created_by)
values
  (
    '00000000-0000-0000-0000-000000000001',
    'English Essentials (Thai)',
    'Core English vocabulary with Thai support for beginner learners',
    true,
    null
  ),
  (
    '00000000-0000-0000-0000-000000000002',
    'English Essentials (Chinese)',
    'Core English vocabulary with Chinese support for beginner learners',
    true,
    null
  )
on conflict (id) do nothing;

-- Thai set cards (fixed UUIDs → idempotent ON CONFLICT (id) DO NOTHING)
insert into flashcards (id, set_id, native_word, english_word, part_of_speech, level, example_sentence, sort_order)
values
  ('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', 'สวัสดี',          'Hello',          'interjection', 'basic',        'สวัสดีครับ - Hello (polite form)',                   1),
  ('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000001', 'น้ำ',             'Water',          'noun',         'basic',        'ฉันดื่มน้ำ - I drink water',                        2),
  ('00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0000-000000000001', 'อาหาร',           'Food',           'noun',         'basic',        'อาหารอร่อย - The food is delicious',                3),
  ('00000000-0000-0000-0001-000000000004', '00000000-0000-0000-0000-000000000001', 'การศึกษา',        'Education',      'noun',         'intermediate', 'การศึกษาสำคัญมาก - Education is very important',    4),
  ('00000000-0000-0000-0001-000000000005', '00000000-0000-0000-0000-000000000001', 'ประสบการณ์',      'Experience',     'noun',         'intermediate', 'เขามีประสบการณ์มาก - He has a lot of experience',   5),
  ('00000000-0000-0000-0001-000000000006', '00000000-0000-0000-0000-000000000001', 'โอกาส',           'Opportunity',    'noun',         'intermediate', 'นี่เป็นโอกาสดี - This is a good opportunity',       6),
  ('00000000-0000-0000-0001-000000000007', '00000000-0000-0000-0000-000000000001', 'ความรับผิดชอบ',   'Responsibility', 'noun',         'advanced',     'เขามีความรับผิดชอบสูง - He has high responsibility',7),
  ('00000000-0000-0000-0001-000000000008', '00000000-0000-0000-0000-000000000001', 'การพัฒนา',        'Development',    'noun',         'advanced',     'การพัฒนาเทคโนโลยี - Technology development',        8),
  ('00000000-0000-0000-0001-000000000009', '00000000-0000-0000-0000-000000000001', 'ความเข้าใจ',      'Understanding',  'noun',         'advanced',     'ความเข้าใจที่ลึกซึ้ง - Deep understanding',         9)
on conflict (id) do nothing;

-- Chinese set cards (fixed UUIDs → idempotent ON CONFLICT (id) DO NOTHING)
insert into flashcards (id, set_id, native_word, english_word, part_of_speech, level, example_sentence, sort_order)
values
  ('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0000-000000000002', '你好', 'Hello',          'interjection', 'basic',        '你好！How are you?',                      1),
  ('00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0000-000000000002', '水',   'Water',          'noun',         'basic',        '我喝水 - I drink water',                   2),
  ('00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0000-000000000002', '食物', 'Food',           'noun',         'basic',        '食物很美味 - The food is delicious',        3),
  ('00000000-0000-0000-0002-000000000004', '00000000-0000-0000-0000-000000000002', '教育', 'Education',      'noun',         'intermediate', '教育很重要 - Education is very important',  4),
  ('00000000-0000-0000-0002-000000000005', '00000000-0000-0000-0000-000000000002', '经验', 'Experience',     'noun',         'intermediate', '他有很多经验 - He has a lot of experience', 5),
  ('00000000-0000-0000-0002-000000000006', '00000000-0000-0000-0000-000000000002', '机会', 'Opportunity',    'noun',         'intermediate', '这是个好机会 - This is a good opportunity', 6),
  ('00000000-0000-0000-0002-000000000007', '00000000-0000-0000-0000-000000000002', '责任', 'Responsibility', 'noun',         'advanced',     '他很有责任感 - He is very responsible',     7),
  ('00000000-0000-0000-0002-000000000008', '00000000-0000-0000-0000-000000000002', '发展', 'Development',    'noun',         'advanced',     '技术发展 - Technology development',         8),
  ('00000000-0000-0000-0002-000000000009', '00000000-0000-0000-0000-000000000002', '理解', 'Understanding',  'noun',         'advanced',     '深刻理解 - Deep understanding',             9)
on conflict (id) do nothing;
