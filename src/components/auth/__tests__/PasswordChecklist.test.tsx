/// <reference types="vitest/globals" />
import { render, screen } from '@testing-library/react';
import { PasswordChecklist } from '../PasswordChecklist';

describe('PasswordChecklist', () => {
  it('renders nothing when value is empty string', () => {
    render(<PasswordChecklist value="" />);
    expect(screen.queryByTestId('password-checklist')).not.toBeInTheDocument();
  });

  it('is visible once any character is typed', () => {
    render(<PasswordChecklist value="a" />);
    expect(screen.getByTestId('password-checklist')).toBeInTheDocument();
  });

  it('shows all three rule rows when visible', () => {
    render(<PasswordChecklist value="a" />);
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
  });

  it('shows no green styling when no rules are met', () => {
    render(<PasswordChecklist value="a" />);
    const spans = screen.getByTestId('password-checklist').querySelectorAll('span');
    spans.forEach((span) => {
      expect(span).not.toHaveClass('text-green-600');
    });
  });

  it('shows only the minLength row green when value is 8+ chars with no uppercase or special', () => {
    render(<PasswordChecklist value="abcdefgh" />);
    const spans = screen.getByTestId('password-checklist').querySelectorAll('span');
    expect(spans[0]).toHaveClass('text-green-600'); // minLength
    expect(spans[1]).not.toHaveClass('text-green-600'); // uppercase
    expect(spans[2]).not.toHaveClass('text-green-600'); // special
  });

  it('shows all rows green when all rules are met', () => {
    render(<PasswordChecklist value="Secure1!" />);
    const spans = screen.getByTestId('password-checklist').querySelectorAll('span');
    spans.forEach((span) => {
      expect(span).toHaveClass('text-green-600');
    });
  });
});
