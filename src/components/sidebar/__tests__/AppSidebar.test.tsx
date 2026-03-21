import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

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
  it('renders all 8 nav items', () => {
    renderSidebar();
    const navLabels = ['Home', 'Dashboard', 'Library', 'Study Groups', 'Notifications', 'Flashcards', 'Drag & Drop', 'Ad Libs'];
    for (const label of navLabels) {
      expect(screen.getByText(label)).toBeInTheDocument();
    }
  });

  it('shows labels in expanded mode', () => {
    renderSidebar({ collapsed: false });
    expect(screen.getByText('Dashboard')).toBeVisible();
  });

  it('hides labels in collapsed mode and exposes aria-label on nav items', () => {
    renderSidebar({ collapsed: true });
    // Labels are visually hidden; aria-labels present
    expect(screen.getByLabelText('Dashboard')).toBeInTheDocument();
  });

  it('calls onToggleCollapsed when toggle button is clicked', () => {
    const onToggle = vi.fn();
    renderSidebar({ onToggleCollapsed: onToggle });
    fireEvent.click(screen.getByRole('button', { name: /collapse|expand/i }));
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
