import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate, Navigate: ({ to }: { to: string }) => <div>redirect:{to}</div> };
});

const mockUseUserStore = vi.fn();
vi.mock('@/stores/useUserStore', () => ({
  useUserStore: (selector: (s: unknown) => unknown) => mockUseUserStore(selector),
}));

import RequireAuth from '../RequireAuth';

function renderGuard() {
  return render(
    <MemoryRouter>
      <RequireAuth><div>protected content</div></RequireAuth>
    </MemoryRouter>
  );
}

describe('RequireAuth', () => {
  it('shows spinner while sessionLoading is true', () => {
    mockUseUserStore.mockImplementation((sel: (s: unknown) => unknown) =>
      sel({ session: null, sessionLoading: true })
    );
    renderGuard();
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('protected content')).not.toBeInTheDocument();
  });

  it('redirects to /login when session is null and not loading', () => {
    mockUseUserStore.mockImplementation((sel: (s: unknown) => unknown) =>
      sel({ session: null, sessionLoading: false })
    );
    renderGuard();
    expect(screen.getByText('redirect:/login')).toBeInTheDocument();
  });

  it('renders children when session exists', () => {
    mockUseUserStore.mockImplementation((sel: (s: unknown) => unknown) =>
      sel({ session: { user: { id: '1' } }, sessionLoading: false })
    );
    renderGuard();
    expect(screen.getByText('protected content')).toBeInTheDocument();
  });
});
