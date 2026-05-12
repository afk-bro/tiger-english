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

import RequireTeacher from '../RequireTeacher';

function renderGuard() {
  return render(
    <MemoryRouter>
      <RequireTeacher><div>teacher content</div></RequireTeacher>
    </MemoryRouter>
  );
}

describe('RequireTeacher', () => {
  it('shows spinner while sessionLoading', () => {
    mockUseUserStore.mockImplementation((sel: (s: unknown) => unknown) =>
      sel({ profile: null, sessionLoading: true, profileLoading: false }),
    );
    renderGuard();
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('teacher content')).not.toBeInTheDocument();
  });

  it('shows spinner while profileLoading (session resolved but profile not yet)', () => {
    // Regression guard: AppInitializer flips sessionLoading→false before
    // awaiting fetchProfile(); without the profileLoading gate, real
    // teachers would briefly redirect to /home on first load.
    mockUseUserStore.mockImplementation((sel: (s: unknown) => unknown) =>
      sel({ profile: null, sessionLoading: false, profileLoading: true }),
    );
    renderGuard();
    expect(screen.getByRole('status')).toBeInTheDocument();
    expect(screen.queryByText('redirect:/home')).not.toBeInTheDocument();
  });

  it('redirects to /home when profile is null and not loading', () => {
    mockUseUserStore.mockImplementation((sel: (s: unknown) => unknown) =>
      sel({ profile: null, sessionLoading: false, profileLoading: false }),
    );
    renderGuard();
    expect(screen.getByText('redirect:/home')).toBeInTheDocument();
  });

  it('redirects when role is "user"', () => {
    mockUseUserStore.mockImplementation((sel: (s: unknown) => unknown) =>
      sel({ profile: { id: '1', role: 'user' }, sessionLoading: false, profileLoading: false }),
    );
    renderGuard();
    expect(screen.getByText('redirect:/home')).toBeInTheDocument();
  });

  it('renders children when role is "teacher"', () => {
    mockUseUserStore.mockImplementation((sel: (s: unknown) => unknown) =>
      sel({ profile: { id: '1', role: 'teacher' }, sessionLoading: false, profileLoading: false }),
    );
    renderGuard();
    expect(screen.getByText('teacher content')).toBeInTheDocument();
  });

  it('renders children when role is "admin" (admins are also teachers here)', () => {
    mockUseUserStore.mockImplementation((sel: (s: unknown) => unknown) =>
      sel({ profile: { id: '1', role: 'admin' }, sessionLoading: false, profileLoading: false }),
    );
    renderGuard();
    expect(screen.getByText('teacher content')).toBeInTheDocument();
  });
});
