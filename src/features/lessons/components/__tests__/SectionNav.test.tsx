import { describe, it, expect, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import SectionNav from '../SectionNav';

const i18n = createInstance();

beforeAll(async () => {
  await i18n.use(initReactI18next).init({
    lng: 'en',
    fallbackLng: 'en',
    resources: {
      en: {
        translation: {
          lessons: {
            section: {
              previous: 'Previous',
              next: 'Next',
              backToUnit: 'Back to Unit',
              markComplete: 'Mark complete',
              completed: 'Completed',
              nextUnit: 'Next: {{unitLabel}}',
              allUnitsCompletedMessage: "You've completed all available units",
              backToLessons: 'Back to Lessons',
            },
          },
        },
      },
    },
    interpolation: { escapeValue: false },
  });
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>
    <MemoryRouter>{children}</MemoryRouter>
  </I18nextProvider>
);

describe('SectionNav', () => {
  it('renders within-unit Next link on a non-last section', () => {
    render(
      <SectionNav
        unitSlug="unit-1"
        currentSection="grammar"
        completed={false}
        onToggleComplete={() => {}}
        isLastSection={false}
      />,
      { wrapper },
    );
    const nextLink = screen.getByRole('link', { name: /^next$/i });
    expect(nextLink).toHaveAttribute('href', '/lessons/unit-1/vocabulary');
    expect(screen.queryByText("You've completed all available units")).not.toBeInTheDocument();
  });

  it('renders Next: Unit X link on the last section when nextUnit is provided', () => {
    render(
      <SectionNav
        unitSlug="unit-1"
        currentSection="activities"
        completed={false}
        onToggleComplete={() => {}}
        isLastSection={true}
        nextUnit={{ slug: 'unit-2', ctaText: 'Next: Unit 2 — To Be: Location' }}
      />,
      { wrapper },
    );
    const nextLink = screen.getByRole('link', { name: /next: unit 2/i });
    expect(nextLink).toHaveAttribute('href', '/lessons/unit-2/overview');
    expect(screen.queryByText("You've completed all available units")).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /back to lessons/i })).not.toBeInTheDocument();
  });

  it('renders Back to Unit + terminal-state message + Back to Lessons on the last section when nextUnit is undefined', () => {
    render(
      <SectionNav
        unitSlug="unit-2"
        currentSection="activities"
        completed={false}
        onToggleComplete={() => {}}
        isLastSection={true}
      />,
      { wrapper },
    );
    const backToUnit = screen.getByRole('link', { name: /back to unit/i });
    expect(backToUnit).toHaveAttribute('href', '/lessons/unit-2');
    expect(screen.getByText("You've completed all available units")).toBeInTheDocument();
    const backToLessons = screen.getByRole('link', { name: /back to lessons/i });
    expect(backToLessons).toHaveAttribute('href', '/lessons');
  });
});
