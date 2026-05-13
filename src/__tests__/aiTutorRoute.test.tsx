import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppRoutes } from '../App';
import { useUserStore } from '@/stores/useUserStore';
import type { UserStore } from '@/stores/useUserStore';

vi.mock('@/stores/useUserStore');

// Mock the TutorAPI module so the home page's useEffect resolves to an
// empty-scenario list without hitting Supabase. Keeps this test focused
// on route wiring rather than the home page's data flow.
vi.mock('@/features/ai-tutor/api/tutor', () => ({
  tutorAPI: {
    listScenarios: vi.fn().mockResolvedValue([]),
    getScenario: vi.fn(),
    startSession: vi.fn(),
    getSession: vi.fn(),
    submitTurn: vi.fn(),
    finishSession: vi.fn(),
    abandonSession: vi.fn(),
  },
}));

// Mock TutorLayout so the test asserts the route block mounts the layout
// + child page without rendering the full chrome (top tabs, audio gesture
// unlock, etc.). The mock renders <Outlet /> so child route elements
// actually appear.
vi.mock('@/features/ai-tutor/components/TutorLayout', async () => {
  const { Outlet } = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return {
    TutorLayout: () => (
      <div data-testid="mock-tutor-layout">
        tutor-layout
        <Outlet />
      </div>
    ),
    default: () => (
      <div data-testid="mock-tutor-layout">
        tutor-layout
        <Outlet />
      </div>
    ),
  };
});

const truthyProfile = {
  id: 'u-1',
  email: 'test@example.com',
  username: 'tester',
  first_name: 'Test',
  last_name: 'User',
  native_language: 'vi' as string | null,
  timezone: null,
  role: 'user' as const,
};

const setProfile = (profile: UserStore['profile']) => {
  const mockStore: UserStore = {
    session: profile ? ({ access_token: 'fake-token', user: { id: profile.id } } as unknown as UserStore['session']) : null,
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

describe('AI Tutor routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv('VITE_AI_TUTOR_ENABLED', 'true');
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('mounts TutorLayout + home page behind auth when flag is enabled', async () => {
    setProfile(truthyProfile);
    const { findByTestId, findByText } = renderAt('/ai-tutor');
    expect(await findByTestId('mock-tutor-layout')).toBeInTheDocument();
    // listScenarios resolves to [], so the empty-state copy appears.
    expect(await findByText(/no scenarios available yet/i)).toBeInTheDocument();
  });
});
