import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TodayReviewCard } from '../TodayReviewCard';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (k: string, opts?: any) => (opts && 'count' in opts ? `${k} ${opts.count}` : k), i18n: { language: 'en' } }),
}));

const navigateMock = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom');
  return { ...actual, useNavigate: () => navigateMock };
});

vi.mock('@/features/review/useReviewCount', () => ({
  useReviewCount: vi.fn(),
}));
import { useReviewCount } from '@/features/review/useReviewCount';
const mockedUseReviewCount = useReviewCount as ReturnType<typeof vi.fn>;

const renderInRouter = (ui: React.ReactElement) =>
  render(<MemoryRouter>{ui}</MemoryRouter>);

describe('TodayReviewCard', () => {
  beforeEach(() => {
    navigateMock.mockReset();
    mockedUseReviewCount.mockReset();
  });

  it('renders a skeleton while loading', () => {
    mockedUseReviewCount.mockReturnValue({ count: 0, isLoading: true });
    renderInRouter(<TodayReviewCard />);
    expect(screen.getByTestId('today-review-skeleton')).toBeInTheDocument();
  });

  it('renders the empty state when count is 0', () => {
    mockedUseReviewCount.mockReturnValue({ count: 0, isLoading: false });
    renderInRouter(<TodayReviewCard />);
    expect(screen.getByText('authhome.today_review.empty')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders the count and routes to /review on CTA', () => {
    mockedUseReviewCount.mockReturnValue({ count: 7, isLoading: false });
    renderInRouter(<TodayReviewCard />);
    // The mocked t() returns "authhome.today_review.due_count 7" when count opt is passed
    expect(screen.getByText(/due_count 7/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button'));
    expect(navigateMock).toHaveBeenCalledWith('/review');
  });
});
