import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// Mock react-router navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// Hoist mock functions so they are available when vi.mock factories run
const { mockOnAuthStateChange, mockGetSession, mockFetchProfile } = vi.hoisted(() => ({
  mockOnAuthStateChange: vi.fn(),
  mockGetSession: vi.fn(),
  mockFetchProfile: vi.fn(),
}));

// Mock supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      onAuthStateChange: mockOnAuthStateChange,
      getSession: mockGetSession,
    },
  },
}));

// Mock Zustand store — include getState so startProfilePolling can call fetchProfile
const mockUseUserStore = vi.fn();
vi.mock('@/stores/useUserStore', () => ({
  useUserStore: Object.assign(
    (selector: (s: unknown) => unknown) => mockUseUserStore(selector),
    { getState: () => ({ fetchProfile: mockFetchProfile }) }
  ),
}));

import AuthCallback from '../AuthCallback';

function renderCallback(search = '') {
  return render(
    <MemoryRouter initialEntries={[`/auth/callback${search}`]}>
      <AuthCallback />
    </MemoryRouter>
  );
}

function setupSubscription() {
  let capturedCallback: ((event: string, session: unknown) => void) | null = null;
  mockOnAuthStateChange.mockImplementation((cb) => {
    capturedCallback = cb;
    return { data: { subscription: { unsubscribe: vi.fn() } } };
  });
  return { fire: (event: string, session: unknown) => capturedCallback?.(event, session) };
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.useFakeTimers();
  mockGetSession.mockResolvedValue({ data: { session: { user: { id: '123' } } } });
});

afterEach(() => {
  vi.useRealTimers();
});

describe('AuthCallback', () => {
  it('shows auth_error immediately when URL contains ?error=', () => {
    setupSubscription();
    mockUseUserStore.mockReturnValue(null);
    renderCallback('?error=access_denied&error_description=User+cancelled');
    expect(screen.getByText(/authentication failed/i)).toBeInTheDocument();
  });

  it('shows checking state on mount', () => {
    setupSubscription();
    mockUseUserStore.mockReturnValue(null);
    renderCallback();
    expect(screen.getByText(/signing you in/i)).toBeInTheDocument();
  });

  it('transitions to auth_error when no SIGNED_IN event within 3s', async () => {
    setupSubscription(); // never fires SIGNED_IN
    mockGetSession.mockResolvedValue({ data: { session: null } }); // no existing session
    mockUseUserStore.mockReturnValue(null);
    renderCallback();

    await act(async () => {
      vi.advanceTimersByTime(3001);
    });

    expect(screen.getByText(/authentication failed/i)).toBeInTheDocument();
  });

  it('transitions to waiting_profile after SIGNED_IN event', async () => {
    const sub = setupSubscription();
    mockUseUserStore.mockReturnValue(null); // no profile yet
    renderCallback();

    await act(async () => {
      sub.fire('SIGNED_IN', { user: { id: '123' } });
    });

    expect(screen.getByText(/setting up your account/i)).toBeInTheDocument();
  });

  it('transitions to waiting_profile after INITIAL_SESSION event with a session', async () => {
    const sub = setupSubscription();
    mockGetSession.mockResolvedValue({ data: { session: null } }); // no pre-existing session
    mockUseUserStore.mockReturnValue(null);
    renderCallback();

    await act(async () => {
      sub.fire('INITIAL_SESSION', { user: { id: '123' } });
    });

    expect(screen.getByText(/setting up your account/i)).toBeInTheDocument();
  });

  it('does not transition on INITIAL_SESSION with null session', async () => {
    const sub = setupSubscription();
    mockGetSession.mockResolvedValue({ data: { session: null } });
    mockUseUserStore.mockReturnValue(null);
    renderCallback();

    await act(async () => {
      sub.fire('INITIAL_SESSION', null);
    });

    // Should still be in checking state, not waiting_profile
    expect(screen.getByText(/signing you in/i)).toBeInTheDocument();
  });

  it('redirects to /u/:username when profile.username is set', async () => {
    const sub = setupSubscription();
    mockUseUserStore.mockImplementation((selector) => {
      const state = { profile: { username: 'testuser_abc123' }, error: null };
      return selector(state);
    });
    renderCallback();

    await act(async () => {
      sub.fire('SIGNED_IN', { user: { id: '123' } });
    });

    expect(mockNavigate).toHaveBeenCalledWith('/u/testuser_abc123', { replace: true });
  });

  it('transitions to auth_error when store has a genuine error in waiting_profile', async () => {
    const sub = setupSubscription();
    mockUseUserStore.mockImplementation((selector: (s: unknown) => unknown) =>
      selector({ profile: null, error: 'connection refused' })
    );
    renderCallback();

    await act(async () => {
      sub.fire('SIGNED_IN', { user: { id: '123' } });
    });

    expect(screen.getByText(/authentication failed/i)).toBeInTheDocument();
  });

  it('shows timeout state after 10s in waiting_profile', async () => {
    const sub = setupSubscription();
    mockUseUserStore.mockReturnValue(null); // profile never arrives
    renderCallback();

    await act(async () => {
      sub.fire('SIGNED_IN', { user: { id: '123' } });
      vi.advanceTimersByTime(10001);
    });

    expect(screen.getByText(/taking longer than expected/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('calls fetchProfile on interval while in waiting_profile', async () => {
    const sub = setupSubscription();
    mockUseUserStore.mockReturnValue(null);
    renderCallback();

    await act(async () => {
      sub.fire('SIGNED_IN', { user: { id: '123' } });
      vi.advanceTimersByTime(4500); // covers initial call + ~3 interval ticks
    });

    // initial fetch + at least 2 interval fetches within 4.5s (at 1.5s each)
    expect(mockFetchProfile.mock.calls.length).toBeGreaterThanOrEqual(3);
  });
});
