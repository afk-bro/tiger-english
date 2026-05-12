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

import RequireAdmin from '../RequireAdmin';

function renderGuard() {
  return render(
    <MemoryRouter>
      <RequireAdmin><div>admin content</div></RequireAdmin>
    </MemoryRouter>
  );
}

describe('RequireAdmin', () => {
  it('shows spinner while sessionLoading is true', () => {
    mockUseUserStore.mockImplementation((sel: (s: unknown) => unknown) =>
      sel({ profile: null, sessionLoading: true, profileLoading: false })
    );
    renderGuard();
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('admin content')).not.toBeInTheDocument();
  });

  it('shows spinner while profileLoading (session resolved but profile not yet)', () => {
    // Regression guard: AppInitializer flips sessionLoading→false before
    // awaiting fetchProfile(); without the profileLoading gate, real
    // admins would briefly redirect to /home on first load.
    mockUseUserStore.mockImplementation((sel: (s: unknown) => unknown) =>
      sel({ profile: null, sessionLoading: false, profileLoading: true })
    );
    renderGuard();
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('redirect:/home')).not.toBeInTheDocument();
  });

  it('redirects to /home when profile is null and not loading', () => {
    mockUseUserStore.mockImplementation((sel: (s: unknown) => unknown) =>
      sel({ profile: null, sessionLoading: false, profileLoading: false })
    );
    renderGuard();
    expect(screen.getByText('redirect:/home')).toBeInTheDocument();
    expect(screen.queryByText('admin content')).not.toBeInTheDocument();
  });

  it('redirects to /home when role is missing', () => {
    mockUseUserStore.mockImplementation((sel: (s: unknown) => unknown) =>
      sel({ profile: { id: '1', role: null }, sessionLoading: false, profileLoading: false })
    );
    renderGuard();
    expect(screen.getByText('redirect:/home')).toBeInTheDocument();
  });

  it('redirects to /home when role is "teacher" (teachers are not admins)', () => {
    mockUseUserStore.mockImplementation((sel: (s: unknown) => unknown) =>
      sel({ profile: { id: '1', role: 'teacher' }, sessionLoading: false, profileLoading: false })
    );
    renderGuard();
    expect(screen.getByText('redirect:/home')).toBeInTheDocument();
    expect(screen.queryByText('admin content')).not.toBeInTheDocument();
  });

  it('redirects to /home when role is some other string', () => {
    mockUseUserStore.mockImplementation((sel: (s: unknown) => unknown) =>
      sel({ profile: { id: '1', role: 'student' }, sessionLoading: false, profileLoading: false })
    );
    renderGuard();
    expect(screen.getByText('redirect:/home')).toBeInTheDocument();
  });

  it('renders children when role is "admin"', () => {
    mockUseUserStore.mockImplementation((sel: (s: unknown) => unknown) =>
      sel({ profile: { id: '1', role: 'admin' }, sessionLoading: false, profileLoading: false })
    );
    renderGuard();
    expect(screen.getByText('admin content')).toBeInTheDocument();
  });
});
