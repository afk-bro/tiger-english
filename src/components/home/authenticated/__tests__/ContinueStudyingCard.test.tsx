import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

import ContinueStudyingCard from '../ContinueStudyingCard';
import type { ContinueStudyingData } from '../types';

const mockData: ContinueStudyingData = {
  setId: 'set-1',
  title: 'Travel Basics',
  theme: 'Travel',
  reviewedCount: 18,
  totalCards: 30,
  lastStudiedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
  streak: 5,
  accuracy: 82,
};

function renderCard(props: Partial<React.ComponentProps<typeof ContinueStudyingCard>> = {}) {
  return render(
    <MemoryRouter>
      <ContinueStudyingCard data={mockData} isLoading={false} {...props} />
    </MemoryRouter>
  );
}

describe('ContinueStudyingCard', () => {
  it('renders skeleton when isLoading is true', () => {
    renderCard({ isLoading: true });
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    expect(screen.queryByText('Travel Basics')).not.toBeInTheDocument();
  });

  it('renders empty state when data is null', () => {
    renderCard({ data: null });
    expect(screen.getByText('authhome.continue_studying.start')).toBeInTheDocument();
  });

  it('renders set title in populated state', () => {
    renderCard();
    expect(screen.getByText('Travel Basics')).toBeInTheDocument();
  });

  it('renders reviewed card count key in populated state', () => {
    renderCard();
    expect(screen.getByText('authhome.continue_studying.reviewed')).toBeInTheDocument();
  });

  it('renders progress bar at 0% when totalCards is 0', () => {
    renderCard({ data: { ...mockData, totalCards: 0, reviewedCount: 0 } });
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '0');
  });

  it('shows completed indicator when reviewedCount equals totalCards', () => {
    renderCard({ data: { ...mockData, reviewedCount: 30, totalCards: 30 } });
    expect(screen.getByText('authhome.continue_studying.completed')).toBeInTheDocument();
  });

  it('navigates to /flashcards with setId state on Continue Studying click', () => {
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: 'authhome.continue_studying.continue' }));
    expect(mockNavigate).toHaveBeenCalledWith('/flashcards', { state: { setId: 'set-1' } });
  });
});
