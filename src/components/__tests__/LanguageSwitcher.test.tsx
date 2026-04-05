// src/components/__tests__/LanguageSwitcher.test.tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LanguageSwitcher from '../LanguageSwitcher';

const mockChangeLanguage = vi.fn();
let mockLanguage = 'en';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      get language() { return mockLanguage; },
      changeLanguage: mockChangeLanguage,
    },
  }),
}));

beforeEach(() => {
  mockLanguage = 'en';
  mockChangeLanguage.mockClear();
  document.documentElement.lang = '';
});

// ── Rendering ─────────────────────────────────────────────────────────────────

describe('LanguageSwitcher — rendering', () => {
  it('renders trigger with accessible label', () => {
    render(<LanguageSwitcher />);
    expect(
      screen.getByRole('button', { name: 'common.language_switcher.change_language' })
    ).toBeInTheDocument();
  });

  it('does not show menu on initial render', () => {
    render(<LanguageSwitcher />);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('sets aria-expanded="false" on trigger when closed', () => {
    render(<LanguageSwitcher />);
    expect(
      screen.getByRole('button', { name: 'common.language_switcher.change_language' })
    ).toHaveAttribute('aria-expanded', 'false');
  });
});

// ── Open / close ──────────────────────────────────────────────────────────────

describe('LanguageSwitcher — open/close', () => {
  it('opens menu on trigger click', () => {
    render(<LanguageSwitcher />);
    fireEvent.click(screen.getByRole('button', { name: 'common.language_switcher.change_language' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('sets aria-expanded="true" when open', () => {
    render(<LanguageSwitcher />);
    fireEvent.click(screen.getByRole('button', { name: 'common.language_switcher.change_language' }));
    expect(
      screen.getByRole('button', { name: 'common.language_switcher.change_language' })
    ).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes menu on second trigger click', () => {
    render(<LanguageSwitcher />);
    const trigger = screen.getByRole('button', { name: 'common.language_switcher.change_language' });
    fireEvent.click(trigger);
    fireEvent.click(trigger);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('closes menu and returns focus to trigger on Escape', () => {
    render(<LanguageSwitcher />);
    const trigger = screen.getByRole('button', { name: 'common.language_switcher.change_language' });
    fireEvent.click(trigger);
    const options = screen.getAllByRole('menuitemradio');
    fireEvent.keyDown(options[0], { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger);
  });

  it('closes menu on outside click', () => {
    render(
      <div>
        <LanguageSwitcher />
        <button>Outside</button>
      </div>
    );
    fireEvent.click(screen.getByRole('button', { name: 'common.language_switcher.change_language' }));
    expect(screen.getByRole('menu')).toBeInTheDocument();
    fireEvent.mouseDown(screen.getByText('Outside'));
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});

// ── Language options ───────────────────────────────────────────────────────────

describe('LanguageSwitcher — language options', () => {
  it('lists all three UI languages in native script', () => {
    render(<LanguageSwitcher />);
    fireEvent.click(screen.getByRole('button', { name: 'common.language_switcher.change_language' }));
    expect(screen.getByRole('menuitemradio', { name: 'English' })).toBeInTheDocument();
    expect(screen.getByRole('menuitemradio', { name: 'ไทย' })).toBeInTheDocument();
    expect(screen.getByRole('menuitemradio', { name: 'Tiếng Việt' })).toBeInTheDocument();
  });

  it('marks current language as checked', () => {
    render(<LanguageSwitcher />);
    fireEvent.click(screen.getByRole('button', { name: 'common.language_switcher.change_language' }));
    expect(screen.getByRole('menuitemradio', { name: 'English' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('menuitemradio', { name: 'ไทย' })).toHaveAttribute('aria-checked', 'false');
  });

  it('calls changeLanguage and closes menu when option selected', () => {
    render(<LanguageSwitcher />);
    fireEvent.click(screen.getByRole('button', { name: 'common.language_switcher.change_language' }));
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'ไทย' }));
    expect(mockChangeLanguage).toHaveBeenCalledWith('th');
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('returns focus to trigger after selecting an option', () => {
    render(<LanguageSwitcher />);
    const trigger = screen.getByRole('button', { name: 'common.language_switcher.change_language' });
    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('menuitemradio', { name: 'Tiếng Việt' }));
    expect(document.activeElement).toBe(trigger);
  });
});

// ── Keyboard navigation ────────────────────────────────────────────────────────

describe('LanguageSwitcher — keyboard navigation', () => {
  it('ArrowDown on trigger opens menu', () => {
    render(<LanguageSwitcher />);
    fireEvent.keyDown(
      screen.getByRole('button', { name: 'common.language_switcher.change_language' }),
      { key: 'ArrowDown' }
    );
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('ArrowDown moves focus to next option', () => {
    render(<LanguageSwitcher />);
    fireEvent.click(screen.getByRole('button', { name: 'common.language_switcher.change_language' }));
    const options = screen.getAllByRole('menuitemradio');
    options[0].focus();
    fireEvent.keyDown(options[0], { key: 'ArrowDown' });
    expect(document.activeElement).toBe(options[1]);
  });

  it('ArrowUp moves focus to previous option', () => {
    render(<LanguageSwitcher />);
    fireEvent.click(screen.getByRole('button', { name: 'common.language_switcher.change_language' }));
    const options = screen.getAllByRole('menuitemradio');
    options[1].focus();
    fireEvent.keyDown(options[1], { key: 'ArrowUp' });
    expect(document.activeElement).toBe(options[0]);
  });

  it('ArrowDown wraps from last to first option', () => {
    render(<LanguageSwitcher />);
    fireEvent.click(screen.getByRole('button', { name: 'common.language_switcher.change_language' }));
    const options = screen.getAllByRole('menuitemradio');
    const last = options[options.length - 1];
    last.focus();
    fireEvent.keyDown(last, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(options[0]);
  });

  it('Home moves focus to first option', () => {
    render(<LanguageSwitcher />);
    fireEvent.click(screen.getByRole('button', { name: 'common.language_switcher.change_language' }));
    const options = screen.getAllByRole('menuitemradio');
    options[2].focus();
    fireEvent.keyDown(options[2], { key: 'Home' });
    expect(document.activeElement).toBe(options[0]);
  });

  it('End moves focus to last option', () => {
    render(<LanguageSwitcher />);
    fireEvent.click(screen.getByRole('button', { name: 'common.language_switcher.change_language' }));
    const options = screen.getAllByRole('menuitemradio');
    options[0].focus();
    fireEvent.keyDown(options[0], { key: 'End' });
    expect(document.activeElement).toBe(options[options.length - 1]);
  });
});

// ── WCAG lang attribute ───────────────────────────────────────────────────────

describe('LanguageSwitcher — <html lang> sync', () => {
  it('sets document.documentElement.lang to current language on mount', () => {
    render(<LanguageSwitcher />);
    expect(document.documentElement.lang).toBe('en');
  });

  it('updates document.documentElement.lang when language changes', () => {
    const { rerender } = render(<LanguageSwitcher />);
    mockLanguage = 'th';
    rerender(<LanguageSwitcher />);
    expect(document.documentElement.lang).toBe('th');
  });
});
