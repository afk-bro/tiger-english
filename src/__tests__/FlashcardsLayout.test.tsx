import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { FlashcardsLayout } from '../App';
import { useUserStore } from '@/stores/useUserStore';
import type { UserStore } from '@/stores/useUserStore';

vi.mock('@/stores/useUserStore');

vi.mock('@/components/layout/AuthLayout', () => ({
  default: () => <div data-testid="mock-auth-layout">auth</div>,
}));

vi.mock('@/components/layout/PublicLayout', () => ({
  default: () => <div data-testid="mock-public-layout">public</div>,
}));

const truthyProfile = {
  id: 'u-1',
  email: 'test@example.com',
  username: 'tester',
  first_name: 'Test',
  last_name: 'User',
  native_language: null,
  timezone: null,
  role: 'user' as const,
};

const setProfile = (profile: UserStore['profile']) => {
  const mockStore: UserStore = {
    session: null,
    sessionLoading: false,
    setSession: vi.fn(),
    setSessionLoading: vi.fn(),
    profile,
    profileLoading: false,
    error: null,
    fetchProfile: vi.fn(),
    clearProfile: vi.fn(),
    setNativeLanguage: vi.fn(),
    setTargetCefrLevel: vi.fn(),
  };

  vi.mocked(useUserStore).mockImplementation((selector?: (s: typeof mockStore) => unknown) =>
    selector ? selector(mockStore) : mockStore,
  );
};

describe('FlashcardsLayout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders PublicLayout when profile is null', () => {
    setProfile(null);
    const { getByTestId, queryByTestId } = render(<FlashcardsLayout />);
    expect(getByTestId('mock-public-layout')).toBeInTheDocument();
    expect(queryByTestId('mock-auth-layout')).not.toBeInTheDocument();
  });

  it('renders AuthLayout when profile is loaded', () => {
    setProfile(truthyProfile);
    const { getByTestId, queryByTestId } = render(<FlashcardsLayout />);
    expect(getByTestId('mock-auth-layout')).toBeInTheDocument();
    expect(queryByTestId('mock-public-layout')).not.toBeInTheDocument();
  });
});
