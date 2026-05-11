import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, unknown>) => {
      if (opts && 'defaultValue' in opts) return opts.defaultValue as string;
      return key;
    },
    i18n: { language: 'en' },
  }),
}));

import { TutorFooterNav } from '../TutorFooterNav';

const renderNav = () =>
  render(
    <MemoryRouter initialEntries={['/ai-tutor']}>
      <TutorFooterNav />
    </MemoryRouter>,
  );

describe('TutorFooterNav', () => {
  it('renders 5 nav items', () => {
    renderNav();
    expect(screen.getByText(/Home/i)).toBeInTheDocument();
    expect(screen.getByText(/Free Talk/i)).toBeInTheDocument();
    expect(screen.getByText(/Review/i)).toBeInTheDocument();
    expect(screen.getByText(/Challenge/i)).toBeInTheDocument();
    expect(screen.getByText(/Profile/i)).toBeInTheDocument();
  });

  it('clicking Review opens the ComingSoon sheet', () => {
    renderNav();
    fireEvent.click(screen.getByText(/Review/i));
    expect(screen.getByText(/Speech review coming soon/i)).toBeInTheDocument();
  });

  it('clicking Challenge opens the ComingSoon sheet', () => {
    renderNav();
    fireEvent.click(screen.getByText(/Challenge/i));
    expect(screen.getByText(/Challenge mode coming soon/i)).toBeInTheDocument();
  });

  it('Got It button closes the sheet', () => {
    renderNav();
    fireEvent.click(screen.getByText(/Review/i));
    expect(screen.getByText(/Speech review coming soon/i)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Got it/i }));
    expect(screen.queryByText(/Speech review coming soon/i)).not.toBeInTheDocument();
  });

  it('Escape key closes the sheet', () => {
    renderNav();
    fireEvent.click(screen.getByText(/Challenge/i));
    expect(screen.getByText(/Challenge mode coming soon/i)).toBeInTheDocument();
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByText(/Challenge mode coming soon/i)).not.toBeInTheDocument();
  });
});
