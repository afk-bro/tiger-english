import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string) => k, i18n: { language: 'en' } }),
}));

vi.mock('@/features/ai-tutor/api/events', () => ({
  reportTutorEvent: vi.fn(() => Promise.resolve()),
}));
import { reportTutorEvent } from '@/features/ai-tutor/api/events';
const mockedReport = reportTutorEvent as ReturnType<typeof vi.fn>;

import { ScenarioShortcutsRow } from '../ScenarioShortcutsRow';
import type { TutorScenarioSummary } from '@/features/ai-tutor/types';

const renderInRouter = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

const scenarios: TutorScenarioSummary[] = [
  { slug: 'a', title_en: 'A', title_vi: 'A-vi', level: 'a1', mode: 'course', is_free: true },
  { slug: 'b', title_en: 'B', title_vi: 'B-vi', level: 'a1', mode: 'free_talk', is_free: true },
];

describe('ScenarioShortcutsRow', () => {
  beforeEach(() => {
    mockedReport.mockClear();
  });

  it('renders nothing when list is empty', () => {
    const { container } = renderInRouter(<ScenarioShortcutsRow scenarios={[]} isLoading={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when list is null (error or initial)', () => {
    const { container } = renderInRouter(<ScenarioShortcutsRow scenarios={null} isLoading={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders a skeleton while loading', () => {
    renderInRouter(<ScenarioShortcutsRow scenarios={null} isLoading={true} />);
    expect(screen.getByTestId('scenario-shortcuts-skeleton')).toBeInTheDocument();
  });

  it('renders each scenario as a ScenarioCard and a Browse all link', () => {
    renderInRouter(<ScenarioShortcutsRow scenarios={scenarios} isLoading={false} />);
    // ScenarioCard renders title_vi prominently; assert both slugs map to a link to phrasebook.
    const linkA = screen.getByRole('link', { name: /A-vi/ });
    const linkB = screen.getByRole('link', { name: /B-vi/ });
    expect(linkA).toHaveAttribute('href', '/ai-tutor/scenarios/a/phrasebook');
    expect(linkB).toHaveAttribute('href', '/ai-tutor/scenarios/b/phrasebook');
    expect(screen.getByRole('link', { name: /browse_all/ })).toHaveAttribute('href', '/ai-tutor');

    fireEvent.click(linkA);
    expect(mockedReport).toHaveBeenCalledWith('home.scenario_shortcut.click', { scenario_slug: 'a' });
  });
});
