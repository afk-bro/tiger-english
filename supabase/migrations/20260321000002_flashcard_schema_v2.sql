-- Rename native_word → native_text, english_word → english_text
alter table flashcards rename column native_word to native_text;
alter table flashcards rename column english_word to english_text;

-- New columns
alter table flashcards
  add column category          text,
  add column english_audio_url text,
  add column native_audio_url  text,
  add column notes             text,
  add column is_phrase         boolean not null default false;
