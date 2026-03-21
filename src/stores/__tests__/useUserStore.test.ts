import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act } from 'react';

// Mock supabase before importing the store
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: vi.fn(),
    },
    from: vi.fn(),
  },
}));

import { supabase } from '@/lib/supabase';
import { useUserStore } from '../useUserStore';

const mockGetSession = supabase.auth.getSession as ReturnType<typeof vi.fn>;
const mockFrom = supabase.from as ReturnType<typeof vi.fn>;

function makeSelectChain(result: { data: unknown; error: unknown }) {
  const chain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue(result),
  };
  return chain;
}

beforeEach(() => {
  useUserStore.setState({ profile: null, profileLoading: false, error: null });
  vi.clearAllMocks();
});

describe('fetchProfile — PGRST116 (no rows)', () => {
  it('sets profile: null and error: null when profile row does not exist yet', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-123' } } },
    });

    const pgrst116Error = { code: 'PGRST116', message: 'JSON object requested, multiple (or no) rows returned' };
    mockFrom.mockReturnValue(makeSelectChain({ data: null, error: pgrst116Error }));

    await act(async () => {
      await useUserStore.getState().fetchProfile();
    });

    const state = useUserStore.getState();
    expect(state.profile).toBeNull();
    expect(state.error).toBeNull();   // key assertion: NOT an error
    expect(state.profileLoading).toBe(false);
  });

  it('sets error when a genuine DB error occurs (non-PGRST116)', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { user: { id: 'user-123' } } },
    });

    const networkError = { code: 'NETWORK_ERROR', message: 'connection refused' };
    mockFrom.mockReturnValue(makeSelectChain({ data: null, error: networkError }));

    await act(async () => {
      await useUserStore.getState().fetchProfile();
    });

    const state = useUserStore.getState();
    expect(state.profile).toBeNull();
    expect(state.error).toBe('connection refused');
  });
});
