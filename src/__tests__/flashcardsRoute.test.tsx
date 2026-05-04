import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../App';
import { useUserStore } from '@/stores/useUserStore';
import type { UserStore } from '@/stores/useUserStore';

vi.mock('@/stores/useUserStore');

// Mock the layouts so the test asserts which one mounts via the route
// tree, without rendering full chrome (sidebar contents, header, etc.).
vi.mock('@/components/layout/AuthLayout', () => ({
  default: () => <div data-testid="mock-auth-layout">auth-layout</div>,
}));

vi.mock('@/components/layout/PublicLayout', () => ({
  default: () => <div data-testid="mock-public-layout">public-layout</div>,
}));

const setSession = (session: unknown) => {
  const mockStore: UserStore = {
    session: session as any,
    sessionLoading: false,
    setSession: vi.fn(),
    setSessionLoading: vi.fn(),
    profile: null,
    profileLoading: false,
    error: null,
    fetchProfile: vi.fn(),
    clearProfile: vi.fn(),
    setNativeLanguage: vi.fn(),
  };
  vi.mocked(useUserStore).mockImplementation((selector?: (s: typeof mockStore) => unknown) =>
    selector ? selector(mockStore) : mockStore,
  );
};

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <AppRoutes />
    </MemoryRouter>,
  );

describe('/flashcards route layout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the authenticated chrome (AuthLayout) when session is truthy', async () => {
    setSession({ user: { id: 'u-1' }, access_token: 'token' });
    const { findByTestId, queryByTestId } = renderAt('/flashcards');
    expect(await findByTestId('mock-auth-layout')).toBeInTheDocument();
    expect(queryByTestId('mock-public-layout')).not.toBeInTheDocument();
  });

  it('renders the public chrome (PublicLayout) when session is null', async () => {
    setSession(null);
    const { findByTestId, queryByTestId } = renderAt('/flashcards');
    expect(await findByTestId('mock-public-layout')).toBeInTheDocument();
    expect(queryByTestId('mock-auth-layout')).not.toBeInTheDocument();
  });

  it('still renders PublicLayout for other public routes regardless of session (regression check on /about)', async () => {
    setSession({ user: { id: 'u-1' }, access_token: 'token' });
    const { findByTestId, queryByTestId } = renderAt('/about');
    // /about is inside the PublicLayout block; it should NOT pick up
    // the FlashcardsLayout's auth-aware behavior.
    expect(await findByTestId('mock-public-layout')).toBeInTheDocument();
    expect(queryByTestId('mock-auth-layout')).not.toBeInTheDocument();
  });
});
