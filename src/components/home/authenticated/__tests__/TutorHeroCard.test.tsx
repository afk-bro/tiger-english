import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock('@/features/ai-tutor/api/events', () => ({
  reportTutorEvent: vi.fn(() => Promise.resolve()),
}));
import { reportTutorEvent } from '@/features/ai-tutor/api/events';
const mockedReport = reportTutorEvent as ReturnType<typeof vi.fn>;

import { TutorHeroCard } from '../TutorHeroCard';

const renderInRouter = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

describe('TutorHeroCard', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    mockedReport.mockClear();
  });

  it('renders the cold state when no active session and no featured scenario', () => {
    renderInRouter(<TutorHeroCard activeSession={null} featuredScenario={null} isLoading={false} />);
    expect(screen.getByTestId('tutor-hero-cold')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('tutor-hero-cta'));
    expect(navigateMock).toHaveBeenCalledWith('/ai-tutor');
    expect(mockedReport).toHaveBeenCalledWith('home.hero.click', { state: 'cold' });
  });

  it('renders the featured state when no active session but featured scenario exists', () => {
    const featured = {
      slug: 's1',
      title_en: 'Meeting someone new',
      title_vi: 'Gặp người mới',
      level: 'a1',
      mode: 'course' as const,
      is_free: true,
    };
    renderInRouter(<TutorHeroCard activeSession={null} featuredScenario={featured} isLoading={false} />);
    expect(screen.getByTestId('tutor-hero-featured')).toBeInTheDocument();
    expect(screen.getByText(/Meeting someone new/)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('tutor-hero-cta'));
    expect(navigateMock).toHaveBeenCalledWith('/ai-tutor/scenarios/s1/briefing');
    expect(mockedReport).toHaveBeenCalledWith('home.hero.click', { state: 'featured', scenario_slug: 's1' });
  });

  it('renders the active state and routes to the in-progress session', () => {
    const active = {
      session_id: 'sess-1',
      scenario_slug: 's1',
      scenario_title_en: 'Meeting someone new',
      scenario_title_vi: 'Gặp người mới',
      last_activity_at: '2026-05-12T12:00:00Z',
      tasks_done: 2,
      tasks_total: 4,
    };
    renderInRouter(<TutorHeroCard activeSession={active} featuredScenario={null} isLoading={false} />);
    expect(screen.getByTestId('tutor-hero-active')).toBeInTheDocument();
    expect(screen.getByText(/Meeting someone new/)).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('tutor-hero-cta'));
    expect(navigateMock).toHaveBeenCalledWith('/ai-tutor/scenarios/s1/session/sess-1');
    expect(mockedReport).toHaveBeenCalledWith('home.hero.click', {
      state: 'active',
      scenario_slug: 's1',
      session_id: 'sess-1',
    });
  });

  it('renders a skeleton while loading', () => {
    renderInRouter(<TutorHeroCard activeSession={null} featuredScenario={null} isLoading={true} />);
    expect(screen.getByTestId('tutor-hero-skeleton')).toBeInTheDocument();
  });
});
