import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AuthHome from '../AuthHome';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k: string, opts?: any) => (opts && 'count' in opts ? `${k} ${opts.count}` : k),
    i18n: { language: 'en' },
  }),
}));

vi.mock('@/features/ai-tutor/hooks/useActiveTutorSession', () => ({
  useActiveTutorSession: vi.fn(),
}));
vi.mock('@/features/ai-tutor/hooks/useScenariosList', () => ({
  useScenariosList: vi.fn(),
}));
vi.mock('@/features/review/useReviewCount', () => ({
  useReviewCount: vi.fn(() => ({ count: 0, isLoading: false })),
}));
vi.mock('@/features/ai-tutor/api/events', () => ({
  reportTutorEvent: vi.fn(() => Promise.resolve()),
}));

import { useActiveTutorSession } from '@/features/ai-tutor/hooks/useActiveTutorSession';
import { useScenariosList } from '@/features/ai-tutor/hooks/useScenariosList';
import { reportTutorEvent } from '@/features/ai-tutor/api/events';

const mockedReport = reportTutorEvent as ReturnType<typeof vi.fn>;

const mockedActive = useActiveTutorSession as ReturnType<typeof vi.fn>;
const mockedList = useScenariosList as ReturnType<typeof vi.fn>;

const renderHome = () =>
  render(
    <MemoryRouter>
      <AuthHome />
    </MemoryRouter>,
  );

describe('AuthHome (new, tutor-first)', () => {
  beforeEach(() => {
    mockedActive.mockReset();
    mockedList.mockReset();
    mockedReport.mockClear();
    vi.stubEnv('VITE_AI_TUTOR_ENABLED', 'true');
  });

  it('renders the active-session hero when there is an active session', async () => {
    mockedActive.mockReturnValue({
      data: {
        session_id: 'sess-1',
        scenario_slug: 'meeting-someone-new',
        scenario_title_en: 'Meeting someone new',
        scenario_title_vi: 'Gặp người mới',
        last_activity_at: '2026-05-12T12:00:00Z',
        tasks_done: 2,
        tasks_total: 4,
      },
      isLoading: false,
      error: null,
    });
    mockedList.mockReturnValue({ data: [], isLoading: false, error: null });

    renderHome();

    await waitFor(() =>
      expect(screen.getByTestId('tutor-hero-active')).toBeInTheDocument(),
    );
  });

  it('renders the featured-scenario hero when no active session but scenarios exist', async () => {
    mockedActive.mockReturnValue({ data: null, isLoading: false, error: null });
    mockedList.mockReturnValue({
      data: [
        { slug: 'a', title_en: 'A', title_vi: 'A-vi', level: 'a1', mode: 'course', is_free: true },
      ],
      isLoading: false,
      error: null,
    });

    renderHome();

    await waitFor(() =>
      expect(screen.getByTestId('tutor-hero-featured')).toBeInTheDocument(),
    );
  });

  it('renders the cold hero state when no session and no scenarios', async () => {
    mockedActive.mockReturnValue({ data: null, isLoading: false, error: null });
    mockedList.mockReturnValue({ data: [], isLoading: false, error: null });

    renderHome();

    await waitFor(() =>
      expect(screen.getByTestId('tutor-hero-cold')).toBeInTheDocument(),
    );
  });

  it('renders the legacy page when VITE_AI_TUTOR_ENABLED is not "true"', () => {
    vi.stubEnv('VITE_AI_TUTOR_ENABLED', 'false');
    mockedActive.mockReturnValue({ data: null, isLoading: false, error: null });
    mockedList.mockReturnValue({ data: [], isLoading: false, error: null });

    renderHome();

    // Legacy page renders the InviteFriendsCard heading via i18n key.
    expect(screen.getByText('authhome.invite.heading')).toBeInTheDocument();
    // And the tutor-first hero is NOT rendered.
    expect(screen.queryByTestId('tutor-hero-active')).toBeNull();
    expect(screen.queryByTestId('tutor-hero-featured')).toBeNull();
    expect(screen.queryByTestId('tutor-hero-cold')).toBeNull();
  });

  it('fires telemetry when useActiveTutorSession errors', async () => {
    mockedActive.mockReturnValue({
      data: null,
      isLoading: false,
      error: new Error('network'),
    });
    mockedList.mockReturnValue({ data: [], isLoading: false, error: null });

    renderHome();

    await waitFor(() =>
      expect(mockedReport).toHaveBeenCalledWith(
        'home.tutor_hero.active_session_fetch_failed',
      ),
    );
  });
});
