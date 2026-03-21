import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';

const { mockGetSession, mockOnAuthStateChange, mockSetSession, mockSetSessionLoading, mockFetchProfile, mockClearProfile } = vi.hoisted(() => ({
  mockGetSession: vi.fn(),
  mockOnAuthStateChange: vi.fn(),
  mockSetSession: vi.fn(),
  mockSetSessionLoading: vi.fn(),
  mockFetchProfile: vi.fn(),
  mockClearProfile: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
    },
  },
}));

const mockUseUserStore = vi.fn();
vi.mock('@/stores/useUserStore', () => ({
  useUserStore: (selector: (s: unknown) => unknown) => mockUseUserStore(selector),
}));

import AppInitializer from '../AppInitializer';

function setup() {
  mockUseUserStore.mockImplementation((selector: (s: unknown) => unknown) =>
    selector({
      setSession: mockSetSession,
      setSessionLoading: mockSetSessionLoading,
      fetchProfile: mockFetchProfile,
      clearProfile: mockClearProfile,
    })
  );
  mockOnAuthStateChange.mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } });
}

beforeEach(() => {
  vi.clearAllMocks();
  setup();
});

describe('AppInitializer', () => {
  it('calls setSessionLoading(false) after getSession resolves', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: '1' } } } });

    await act(async () => {
      render(<AppInitializer />);
    });

    expect(mockSetSessionLoading).toHaveBeenCalledWith(false);
  });

  it('calls setSession with the resolved session on mount', async () => {
    const session = { user: { id: '1' } };
    mockGetSession.mockResolvedValue({ data: { session } });

    await act(async () => {
      render(<AppInitializer />);
    });

    expect(mockSetSession).toHaveBeenCalledWith(session);
  });

  it('calls fetchProfile when session exists on mount', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: '1' } } } });

    await act(async () => {
      render(<AppInitializer />);
    });

    expect(mockFetchProfile).toHaveBeenCalledTimes(1);
  });

  it('does not call fetchProfile when no session on mount', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    await act(async () => {
      render(<AppInitializer />);
    });

    expect(mockFetchProfile).not.toHaveBeenCalled();
  });

  it('calls clearProfile when no session on mount', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });

    await act(async () => {
      render(<AppInitializer />);
    });

    expect(mockClearProfile).toHaveBeenCalledTimes(1);
  });

  it('skips INITIAL_SESSION from onAuthStateChange to avoid double-firing', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    let capturedCallback: ((event: string, session: unknown) => void) | null = null;
    mockOnAuthStateChange.mockImplementation((cb) => {
      capturedCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    await act(async () => {
      render(<AppInitializer />);
      capturedCallback?.('INITIAL_SESSION', { user: { id: '1' } });
    });

    // fetchProfile must NOT have been called from INITIAL_SESSION event
    expect(mockFetchProfile).not.toHaveBeenCalled();
  });

  it('calls fetchProfile on SIGNED_IN event from onAuthStateChange', async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    let capturedCallback: ((event: string, session: unknown) => void) | null = null;
    mockOnAuthStateChange.mockImplementation((cb) => {
      capturedCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    await act(async () => {
      render(<AppInitializer />);
    });

    await act(async () => {
      capturedCallback?.('SIGNED_IN', { user: { id: '1' } });
    });

    expect(mockFetchProfile).toHaveBeenCalledTimes(1);
  });

  it('calls clearProfile on SIGNED_OUT event', async () => {
    mockGetSession.mockResolvedValue({ data: { session: { user: { id: '1' } } } });
    let capturedCallback: ((event: string, session: unknown) => void) | null = null;
    mockOnAuthStateChange.mockImplementation((cb) => {
      capturedCallback = cb;
      return { data: { subscription: { unsubscribe: vi.fn() } } };
    });

    await act(async () => {
      render(<AppInitializer />);
    });

    await act(async () => {
      capturedCallback?.('SIGNED_OUT', null);
    });

    expect(mockClearProfile).toHaveBeenCalledTimes(1);
  });
});
