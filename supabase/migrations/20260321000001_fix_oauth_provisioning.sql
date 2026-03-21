-- ============================================================
-- Fix handle_new_user:
--   1. Resolve first_name and last_name independently so
--      present-but-missing sibling fields are filled from
--      full_name without overwriting existing metadata values.
--   2. Replace brittle SQLERRM string matching with
--      INSERT ... ON CONFLICT (username) DO NOTHING + FOUND,
--      which is safe across Postgres versions and locales.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public, auth
as $$
DECLARE
  v_username_meta text;
  v_use_path_a    bool;
  v_email_base    text;
  v_first_name    text;
  v_last_name     text;
  v_full_name     text;
  v_tokens        text[];
  v_candidate     text;
  v_inserted      bool := false;
  i               int;
BEGIN
  -- ── Idempotency guard ─────────────────────────────────────
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    INSERT INTO public.user_stats (user_id, xp, level, study_streak, last_login)
      VALUES (NEW.id, 0, 1, 0, NOW())
      ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
  END IF;

  -- ── Resolve first_name / last_name independently ──────────
  -- Each field has its own precedence:
  --   first_name: raw_user_meta_data.first_name
  --             → first token of full_name
  --             → email prefix (last-resort fallback)
  --   last_name:  raw_user_meta_data.last_name
  --             → remaining tokens of full_name (only if available)
  --             → '' (no email fallback for last name)
  --
  -- Fields are resolved independently so a present first_name
  -- does not block a missing last_name from being filled by
  -- full_name, and vice-versa.
  v_first_name := trim(coalesce(NEW.raw_user_meta_data->>'first_name', ''));
  v_last_name  := trim(coalesce(NEW.raw_user_meta_data->>'last_name',  ''));

  IF v_first_name = '' OR v_last_name = '' THEN
    v_full_name := trim(coalesce(NEW.raw_user_meta_data->>'full_name', ''));
    IF v_full_name <> '' THEN
      v_tokens := regexp_split_to_array(v_full_name, '\s+');
      IF v_first_name = '' THEN
        v_first_name := v_tokens[1];
      END IF;
      IF v_last_name = '' AND array_length(v_tokens, 1) > 1 THEN
        v_last_name := array_to_string(v_tokens[2:], ' ');
      END IF;
    END IF;
  END IF;

  -- Email prefix fallback only for a still-missing first_name
  IF v_first_name = '' THEN
    v_first_name := split_part(NEW.email, '@', 1);
  END IF;

  -- ── Determine username path ───────────────────────────────
  v_username_meta := lower(trim(coalesce(NEW.raw_user_meta_data->>'username', '')));
  v_use_path_a    := (v_username_meta <> '');

  IF NOT v_use_path_a THEN
    v_email_base := lower(split_part(NEW.email, '@', 1));
    v_email_base := regexp_replace(v_email_base, '[^a-z0-9]', '_', 'g');
    v_email_base := regexp_replace(v_email_base, '_+',        '_', 'g');
    v_email_base := left(v_email_base, 15);
    v_email_base := trim(both '_' from v_email_base);
    IF v_email_base = '' THEN v_email_base := 'user'; END IF;
  END IF;

  -- ── Retry loop: INSERT profiles with unique username ──────
  -- Uses ON CONFLICT (username) DO NOTHING + FOUND instead of
  -- exception handling to avoid brittle SQLERRM string matching
  -- that can vary by Postgres version, locale, or client.
  FOR i IN 1..5 LOOP
    v_candidate := CASE
      WHEN v_use_path_a THEN v_username_meta
      ELSE v_email_base || '_' || substr(md5(random()::text), 1, 6)
    END;

    INSERT INTO public.profiles (id, email, first_name, last_name, username)
      VALUES (NEW.id, NEW.email, v_first_name, v_last_name, v_candidate)
      ON CONFLICT (username) DO NOTHING;

    IF FOUND THEN
      v_inserted := true;
      EXIT;
    END IF;

    -- Path A uses a deterministic candidate — a conflict means a genuine
    -- duplicate registration; no point retrying with the same value.
    IF v_use_path_a THEN EXIT; END IF;
  END LOOP;

  IF NOT v_inserted THEN
    RAISE EXCEPTION
      'handle_new_user: could not generate unique username for % after 5 attempts',
      NEW.email;
  END IF;

  -- ── Insert user_stats ─────────────────────────────────────
  INSERT INTO public.user_stats (user_id, xp, level, study_streak, last_login)
    VALUES (NEW.id, 0, 1, 0, NOW())
    ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Re-wire trigger (idempotent)
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
