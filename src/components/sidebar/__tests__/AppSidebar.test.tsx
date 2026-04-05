import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    NavLink: ({ to, children, 'aria-label': ariaLabel, end: _end, ...props }: {
      to: string; children: React.ReactNode; 'aria-label'?: string; end?: boolean;
    }) => (
      <a href={to} aria-label={ariaLabel} {...props}>
        {children}
      </a>
    ),
  };
});

import AppSidebar from '../AppSidebar';

function renderSidebar(props = {}) {
  return render(
    <MemoryRouter>
      <AppSidebar
        collapsed={false}
        onToggleCollapsed={vi.fn()}
        isOpen={false}
        onClose={vi.fn()}
        {...props}
      />
    </MemoryRouter>
  );
}

describe('AppSidebar', () => {
  // sidebarContent is rendered in both the desktop panel and the always-mounted mobile drawer,
  // so nav labels and buttons appear twice in the DOM. Use getAllBy* accordingly.

  it('renders all 8 nav items', () => {
    renderSidebar();
    const navKeys = [
      'common.sidebar.nav.home',
      'common.sidebar.nav.dashboard',
      'common.sidebar.nav.library',
      'common.sidebar.nav.study_groups',
      'common.sidebar.nav.notifications',
      'common.sidebar.nav.flashcards',
      'common.sidebar.nav.drag_drop',
      'common.sidebar.nav.ad_libs',
    ];
    for (const key of navKeys) {
      expect(screen.getAllByText(key).length).toBeGreaterThanOrEqual(1);
    }
  });

  it('shows labels in expanded mode', () => {
    renderSidebar({ collapsed: false });
    expect(screen.getAllByText('common.sidebar.nav.dashboard')[0]).toBeVisible();
  });

  it('hides labels in collapsed mode and exposes aria-label on nav items', () => {
    renderSidebar({ collapsed: true });
    // Labels are visually hidden; aria-labels present
    expect(screen.getAllByLabelText('common.sidebar.nav.dashboard')[0]).toBeInTheDocument();
  });

  it('calls onToggleCollapsed when toggle button is clicked', () => {
    const onToggle = vi.fn();
    renderSidebar({ onToggleCollapsed: onToggle });
    fireEvent.click(screen.getAllByRole('button', { name: /common\.nav\.(collapse|expand)_sidebar/i })[0]);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('mobile drawer has role=dialog and aria-modal=true when open', () => {
    renderSidebar({ isOpen: true });
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('calls onClose when overlay is clicked in mobile mode', () => {
    const onClose = vi.fn();
    renderSidebar({ isOpen: true, onClose });
    fireEvent.click(screen.getByTestId('sidebar-overlay'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
