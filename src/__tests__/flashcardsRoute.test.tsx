import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../App';
import { useUserStore } from '@/stores/useUserStore';
import type { UserStore } from '@/stores/useUserStore';

vi.mock('@/stores/useUserStore');

// Mock the layouts so the test asserts which one mounts via the route
// tree, without rendering full chrome (sidebar contents, header, etc.).
// Both mocks render <Outlet /> so the index child (<FlashcardsPage />)
// actually mounts — catching any "missing <Route index>" regressions.
vi.mock('@/components/layout/AuthLayout', async () => {
  const { Outlet } = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    default: () => (
      <div data-testid="mock-auth-layout">
        auth-layout
        <Outlet />
      </div>
    ),
  };
});

vi.mock('@/components/layout/PublicLayout', async () => {
  const { Outlet } = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    default: () => (
      <div data-testid="mock-public-layout">
        public-layout
        <Outlet />
      </div>
    ),
  };
});

vi.mock('@/pages/FlashcardsPage', () => ({
  default: () => <div data-testid="mock-flashcards-page">flashcards page</div>,
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

  it('renders the authenticated chrome (AuthLayout) when profile is loaded', async () => {
    setProfile(truthyProfile);
    const { findByTestId, queryByTestId, getByTestId } = renderAt('/flashcards');
    expect(await findByTestId('mock-auth-layout')).toBeInTheDocument();
    expect(queryByTestId('mock-public-layout')).not.toBeInTheDocument();
    expect(getByTestId('mock-flashcards-page')).toBeInTheDocument();
  });

  it('renders the public chrome (PublicLayout) when profile is null', async () => {
    setProfile(null);
    const { findByTestId, queryByTestId, getByTestId } = renderAt('/flashcards');
    expect(await findByTestId('mock-public-layout')).toBeInTheDocument();
    expect(queryByTestId('mock-auth-layout')).not.toBeInTheDocument();
    expect(getByTestId('mock-flashcards-page')).toBeInTheDocument();
  });

  it('still renders PublicLayout for other public routes regardless of profile (regression check on /about)', async () => {
    setProfile(truthyProfile);
    const { findByTestId, queryByTestId } = renderAt('/about');
    // /about is inside the PublicLayout block; it should NOT pick up
    // the FlashcardsLayout's auth-aware behavior.
    expect(await findByTestId('mock-public-layout')).toBeInTheDocument();
    expect(queryByTestId('mock-auth-layout')).not.toBeInTheDocument();
  });
});
