-- Enable moddatetime extension for auto-updating updated_at columns
create extension if not exists moddatetime schema extensions;

-- Enum: card study status
create type card_status as enum ('unseen', 'known', 'unknown');

-- profiles: mirrors auth.users, created by FastAPI backend on registration
-- (anon/authenticated clients cannot insert — service role only)
create table profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  email       text not null,
  first_name  text not null,
  last_name   text not null,
  username    text not null unique,
  created_at  timestamptz not null default now()
);

-- user_stats: one row per user, created by FastAPI backend on registration
-- user_id is the same UUID as auth.users.id / profiles.id
create table user_stats (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null unique references profiles(id) on delete cascade,
  xp            int not null default 0,
  level         int not null default 1,
  study_streak  int not null default 0,
  last_login    timestamptz,
  created_at    timestamptz not null default now()
);

-- flashcard_sets: curated global sets (created_by IS NULL)
--                and user-created sets (created_by IS NOT NULL)
-- is_public: owner explicitly makes set browsable by all (future feature)
-- share_token: UUID used for private share-by-link (resolved server-side, not via RLS)
create table flashcard_sets (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  description  text,
  created_by   uuid references profiles(id) on delete set null,
  is_public    bool not null default false,
  share_token  uuid unique,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Auto-update updated_at on every UPDATE to flashcard_sets
create trigger handle_flashcard_sets_updated_at
  before update on flashcard_sets
  for each row execute procedure extensions.moddatetime(updated_at);

-- flashcards: cards belonging to a set
-- level must be one of the three values matching the frontend Flashcard type
create table flashcards (
  id                uuid primary key default gen_random_uuid(),
  set_id            uuid not null references flashcard_sets(id) on delete cascade,
  native_word       text not null,
  english_word      text not null,
  part_of_speech    text,
  level             text check (level in ('basic', 'intermediate', 'advanced')),
  example_sentence  text,
  image_url         text,
  sort_order        int not null default 0,
  created_at        timestamptz not null default now()
);

-- user_card_progress: pass/fail state per user per card
-- one row per (user, card) pair — upserted as the user studies
create table user_card_progress (
  user_id        uuid not null references profiles(id) on delete cascade,
  flashcard_id   uuid not null references flashcards(id) on delete cascade,
  status         card_status not null default 'unseen',
  last_studied_at  timestamptz,
  created_at     timestamptz not null default now(),
  primary key (user_id, flashcard_id)
);

-- Indexes
create index on flashcard_sets(created_by);          -- lookup sets by owner
create index on flashcards(set_id, sort_order);      -- ordered cards in a set
create index on user_card_progress(user_id);         -- progress by user
