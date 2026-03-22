import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/stores/useUserStore';

type CallbackState = 'checking' | 'waiting_profile' | 'auth_error' | 'timeout';

export default function AuthCallback() {
  const navigate = useNavigate();
  const location = useLocation();
  const profile = useUserStore((s) => s.profile);
  const storeError = useUserStore((s) => s.error);

  const [state, setState] = useState<CallbackState>(() => {
    // Immediately detect OAuth error params in URL
    const params = new URLSearchParams(location.search);
    return params.get('error') ? 'auth_error' : 'checking';
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const sessionTimerRef   = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const profileTimerRef   = useRef<ReturnType<typeof setTimeout>  | null>(null);
  const profileIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearTimers = () => {
    if (sessionTimerRef.current)    clearTimeout(sessionTimerRef.current);
    if (profileTimerRef.current)    clearTimeout(profileTimerRef.current);
    if (profileIntervalRef.current) clearInterval(profileIntervalRef.current);
  };

  const startProfilePolling = () => {
    setState('waiting_profile');

    // Fetch immediately, then poll every 1.5 s.
    // AppInitializer only fetches once on SIGNED_IN; a transient PGRST116
    // (trigger not yet committed) would leave profile permanently null without this.
    useUserStore.getState().fetchProfile();
    profileIntervalRef.current = setInterval(() => {
      useUserStore.getState().fetchProfile();
    }, 1500);

    profileTimerRef.current = setTimeout(() => {
      clearTimers();
      setState('timeout');
    }, 10_000);
  };

  // Retry: re-check session then resume polling
  const handleRetry = async () => {
    clearTimers();
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      setState('auth_error');
      setErrorMessage('Your session has expired. Please sign in again.');
      return;
    }
    startProfilePolling();
  };

  useEffect(() => {
    if (state === 'auth_error') return; // already errored from URL params

    let handled = false;

    const handle = (sub: { unsubscribe: () => void }) => {
      if (handled) return;
      handled = true;
      if (sessionTimerRef.current) clearTimeout(sessionTimerRef.current);
      sub.unsubscribe();
      startProfilePolling();
    };

    // SIGNED_IN fires after a fresh OAuth redirect.
    // INITIAL_SESSION fires when a session already exists on mount (e.g. re-login after logout).
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || (event === 'INITIAL_SESSION' && session)) {
        handle(subscription);
      }
    });

    // Belt-and-suspenders: if both events fire before this effect runs, getSession catches it.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) handle(subscription);
    });

    // 3s fallback if neither event fires
    sessionTimerRef.current = setTimeout(() => {
      if (!handled) {
        subscription.unsubscribe();
        setState('auth_error');
        setErrorMessage('Authentication timed out. Please try again.');
      }
    }, 3_000);

    return () => {
      handled = true;
      clearTimers();
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Navigate once profile is ready; surface store errors
  useEffect(() => {
    if (state !== 'waiting_profile') return;

    if (profile?.username) {
      clearTimers();
      navigate('/', { replace: true });
      return;
    }

    if (storeError) {
      clearTimers();
      setState('auth_error');
      setErrorMessage(storeError);
    }
  }, [state, profile, storeError, navigate]);

  // UI
  if (state === 'checking' || state === 'waiting_profile') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-semantic-bg dark:bg-semantic-bg">
        <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-semantic-muted dark:text-semantic-muted">
          {state === 'checking' ? 'Signing you in\u2026' : 'Setting up your account\u2026'}
        </p>
      </div>
    );
  }

  if (state === 'timeout') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 bg-semantic-bg dark:bg-semantic-bg">
        <p className="text-base font-medium text-semantic-text dark:text-semantic-text">
          Taking longer than expected
        </p>
        <p className="text-sm text-semantic-muted dark:text-semantic-muted text-center max-w-sm">
          Your account is being set up. This usually takes just a moment.
        </p>
        <button
          onClick={handleRetry}
          className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-medium transition-colors"
        >
          Try again
        </button>
        <Link to="/login" className="text-sm text-primary-600 dark:text-primary-400 hover:underline">
          Back to login
        </Link>
      </div>
    );
  }

  // auth_error
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 bg-semantic-bg dark:bg-semantic-bg">
      <p className="text-base font-medium text-semantic-text dark:text-semantic-text">
        Authentication failed
      </p>
      <p className="text-sm text-semantic-muted dark:text-semantic-muted text-center max-w-sm">
        {errorMessage ?? 'Something went wrong during sign-in. Please try again.'}
      </p>
      <Link
        to="/login"
        className="px-6 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-xl text-sm font-medium transition-colors"
      >
        Back to login
      </Link>
    </div>
  );
}
