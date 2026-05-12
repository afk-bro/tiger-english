import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: { defaultValue?: string }) => opts?.defaultValue ?? key,
  }),
}));

import HeroSection from '../HeroSection';

beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.unstubAllEnvs();
});

function renderWithRouter() {
  return render(
    <MemoryRouter>
      <HeroSection />
    </MemoryRouter>
  );
}

describe('HeroSection secondary CTA', () => {
  it('renders the AI Tutor CTA when VITE_AI_TUTOR_ENABLED === "true"', () => {
    vi.stubEnv('VITE_AI_TUTOR_ENABLED', 'true');

    renderWithRouter();
    const link = screen.getByRole('link', { name: /Start speaking/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/ai-tutor');
    expect(screen.queryByRole('link', { name: /Try Flashcards|hero\.try_flashcards/i })).not.toBeInTheDocument();
  });

  it('renders the Flashcards CTA when VITE_AI_TUTOR_ENABLED is not "true"', () => {
    vi.stubEnv('VITE_AI_TUTOR_ENABLED', 'false');

    renderWithRouter();
    // hero.try_flashcards is the key — our mock returns the key when no defaultValue
    const link = screen.getByRole('link', { name: 'hero.try_flashcards' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/flashcards');
  });
});
