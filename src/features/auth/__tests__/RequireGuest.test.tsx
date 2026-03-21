import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, Navigate: ({ to }: { to: string }) => <div>redirect:{to}</div> };
});

const mockUseUserStore = vi.fn();
vi.mock('@/stores/useUserStore', () => ({
  useUserStore: (selector: (s: unknown) => unknown) => mockUseUserStore(selector),
}));

import RequireGuest from '../RequireGuest';

function renderGuard() {
  return render(
    <MemoryRouter>
      <RequireGuest><div>guest content</div></RequireGuest>
    </MemoryRouter>
  );
}

describe('RequireGuest', () => {
  it('shows spinner while sessionLoading is true', () => {
    mockUseUserStore.mockImplementation((sel: (s: unknown) => unknown) =>
      sel({ session: null, sessionLoading: true })
    );
    renderGuard();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('redirects to / when session exists', () => {
    mockUseUserStore.mockImplementation((sel: (s: unknown) => unknown) =>
      sel({ session: { user: { id: '1' } }, sessionLoading: false })
    );
    renderGuard();
    expect(screen.getByText('redirect:/')).toBeInTheDocument();
  });

  it('renders children when no session', () => {
    mockUseUserStore.mockImplementation((sel: (s: unknown) => unknown) =>
      sel({ session: null, sessionLoading: false })
    );
    renderGuard();
    expect(screen.getByText('guest content')).toBeInTheDocument();
  });
});
