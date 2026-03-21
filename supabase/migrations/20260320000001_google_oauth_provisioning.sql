-- ============================================================
-- CANONICAL PROVISIONING PATH
-- This trigger creates public.profiles and public.user_stats
-- for every new auth.users row. App code (FastAPI, frontend)
-- must never directly insert into these tables during
-- registration. FastAPI passes username/first_name/last_name
-- via user_metadata; the trigger applies explicit precedence.
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
  -- If profile already exists, ensure user_stats exists and exit.
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
    INSERT INTO public.user_stats (user_id, xp, level, study_streak, last_login)
      VALUES (NEW.id, 0, 1, 0, NOW())
      ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
  END IF;

  -- ── Resolve first_name / last_name ────────────────────────
  -- Precedence: raw_user_meta_data.first_name
  --           → split full_name (best-effort)
  --           → email prefix fallback
  v_first_name := trim(NEW.raw_user_meta_data->>'first_name');
  v_last_name  := trim(NEW.raw_user_meta_data->>'last_name');

  IF v_first_name IS NULL OR v_first_name = '' THEN
    v_full_name := trim(coalesce(NEW.raw_user_meta_data->>'full_name', ''));
    IF v_full_name <> '' THEN
      -- Best-effort split: first token → first_name, rest → last_name.
      -- Handles single-word names, middle names, non-Western formats gracefully.
      v_tokens     := regexp_split_to_array(v_full_name, '\s+');
      v_first_name := v_tokens[1];
      v_last_name  := CASE WHEN array_length(v_tokens, 1) > 1
                           THEN array_to_string(v_tokens[2:], ' ')
                           ELSE '' END;
    ELSE
      -- Final fallback: use email prefix
      v_first_name := split_part(NEW.email, '@', 1);
      v_last_name  := '';
    END IF;
  END IF;

  v_first_name := coalesce(v_first_name, '');
  v_last_name  := coalesce(v_last_name, '');

  -- ── Determine username path ───────────────────────────────
  -- Path A (metadata passthrough): raw_user_meta_data.username present and non-empty.
  --   Used for FastAPI-registered users. No suffix appended.
  -- Path B (generation):           no username in metadata (Google OAuth users).
  --   Sanitize email prefix + random 6-char hex suffix.
  v_username_meta := lower(trim(coalesce(NEW.raw_user_meta_data->>'username', '')));
  v_use_path_a    := (v_username_meta <> '');

  IF NOT v_use_path_a THEN
    -- Build sanitized base once; fresh suffix is appended per attempt in the loop.
    v_email_base := lower(split_part(NEW.email, '@', 1));
    v_email_base := regexp_replace(v_email_base, '[^a-z0-9]', '_', 'g');
    v_email_base := regexp_replace(v_email_base, '_+',        '_', 'g');
    v_email_base := left(v_email_base, 15);
    v_email_base := trim(both '_' from v_email_base);
    IF v_email_base = '' THEN
      v_email_base := 'user';
    END IF;
  END IF;

  -- ── Retry loop: INSERT profiles with unique username ──────
  -- The loop wraps the INSERT so a fresh suffix is generated on each
  -- unique_violation. Path A produces a deterministic candidate; a conflict
  -- there signals a genuine duplicate-registration race (exception on exhaustion
  -- is the correct outcome).
  FOR i IN 1..5 LOOP
    v_candidate := CASE
      WHEN v_use_path_a THEN v_username_meta
      ELSE v_email_base || '_' || substr(md5(random()::text), 1, 6)
    END;

    BEGIN
      INSERT INTO public.profiles (id, email, first_name, last_name, username)
        VALUES (NEW.id, NEW.email, v_first_name, v_last_name, v_candidate);
      v_inserted := true;
      EXIT; -- success — leave loop
    EXCEPTION WHEN unique_violation THEN
      IF SQLERRM NOT LIKE '%profiles_username_key%' THEN
        RAISE; -- re-raise PK or other unexpected unique violations
      END IF;
      NULL; -- username conflict: regenerate suffix on next iteration
    END;
  END LOOP;

  IF NOT v_inserted THEN
    RAISE EXCEPTION
      'handle_new_user: could not generate unique username for % after 5 attempts',
      NEW.email;
  END IF;

  -- ── Insert user_stats (once, after profiles succeeds) ─────
  -- Single conflict target — valid Postgres syntax.
  -- Canonical defaults live here and nowhere else.
  INSERT INTO public.user_stats (user_id, xp, level, study_streak, last_login)
    VALUES (NEW.id, 0, 1, 0, NOW())
    ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Wire the trigger
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
