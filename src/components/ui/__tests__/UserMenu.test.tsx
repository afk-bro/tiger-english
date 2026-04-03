import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import UserMenu from '../UserMenu';
import { useUserStore } from '@/stores/useUserStore';

vi.mock('@/stores/useUserStore', () => ({
  useUserStore: vi.fn(),
}));
vi.mock('@/features/auth/logoutUser', () => ({
  logoutUser: vi.fn(),
}));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});
vi.mock('sonner', () => ({ toast: { success: vi.fn() } }));
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));
vi.mock('@/utils/dom', () => ({ blurActiveElement: vi.fn() }));

const mockUseUserStore = vi.mocked(useUserStore);

beforeEach(() => vi.clearAllMocks());

describe('UserMenu — loading state', () => {
  it('shows a spinner and hides Login/Register when profileLoading is true and profile is null', () => {
    mockUseUserStore.mockReturnValue({
      profile: null,
      profileLoading: true,
      clearProfile: vi.fn(),
    } as any);

    render(<MemoryRouter><UserMenu /></MemoryRouter>);

    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('header.nav.login')).not.toBeInTheDocument();
    expect(screen.queryByText('header.nav.register')).not.toBeInTheDocument();
  });
});

describe('UserMenu — unauthenticated state', () => {
  it('shows Login and Register buttons when profile is null and not loading', () => {
    mockUseUserStore.mockReturnValue({
      profile: null,
      profileLoading: false,
      clearProfile: vi.fn(),
    } as any);

    render(<MemoryRouter><UserMenu /></MemoryRouter>);

    expect(screen.getByText('header.nav.login')).toBeInTheDocument();
    expect(screen.getByText('header.nav.register')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});
