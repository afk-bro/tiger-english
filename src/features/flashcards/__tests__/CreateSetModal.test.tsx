import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

import { CreateSetModal } from '../components/CreateSetModal';

// ── ARIA semantics ────────────────────────────────────────────────────────────

describe('CreateSetModal — ARIA semantics', () => {
  it('has role="dialog"', () => {
    render(<CreateSetModal onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('has aria-modal="true"', () => {
    render(<CreateSetModal onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('has aria-labelledby pointing to the heading id', () => {
    render(<CreateSetModal onClose={vi.fn()} onSubmit={vi.fn()} />);
    const dialog = screen.getByRole('dialog');
    const labelId = dialog.getAttribute('aria-labelledby');
    expect(labelId).toBeTruthy();
    const heading = document.getElementById(labelId!);
    expect(heading).toHaveTextContent('flashcards.create_modal.heading');
  });
});

// ── Focus management ─────────────────────────────────────────────────────────

describe('CreateSetModal — focus management', () => {
  it('auto-focuses the first focusable element (title input) on mount', () => {
    render(<CreateSetModal onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(document.activeElement).toBe(
      screen.getByPlaceholderText('flashcards.create_modal.title_placeholder'),
    );
  });

  it('Escape key calls onClose', () => {
    const onClose = vi.fn();
    render(<CreateSetModal onClose={onClose} onSubmit={vi.fn()} />);

    const titleInput = screen.getByPlaceholderText('flashcards.create_modal.title_placeholder');
    fireEvent.keyDown(titleInput, { key: 'Escape', bubbles: true });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Tab from the last focusable element wraps focus back to the title input', () => {
    render(<CreateSetModal onClose={vi.fn()} onSubmit={vi.fn()} />);

    const createButton = screen.getByRole('button', { name: 'flashcards.create_modal.submit' });
    createButton.focus();
    expect(document.activeElement).toBe(createButton);

    fireEvent.keyDown(createButton, { key: 'Tab', bubbles: true });

    expect(document.activeElement).toBe(
      screen.getByPlaceholderText('flashcards.create_modal.title_placeholder'),
    );
  });

  it('Shift+Tab from the title input wraps focus to the last focusable element', () => {
    render(<CreateSetModal onClose={vi.fn()} onSubmit={vi.fn()} />);

    const titleInput = screen.getByPlaceholderText('flashcards.create_modal.title_placeholder');
    // auto-focused on mount; assert it is already active
    expect(document.activeElement).toBe(titleInput);

    fireEvent.keyDown(titleInput, { key: 'Tab', shiftKey: true, bubbles: true });

    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'flashcards.create_modal.submit' }),
    );
  });

  it('Tab from a non-boundary element advances focus to the next element without wrapping', async () => {
    const user = userEvent.setup();
    render(<CreateSetModal onClose={vi.fn()} onSubmit={vi.fn()} />);

    const descriptionTextarea = screen.getByPlaceholderText('flashcards.create_modal.description_placeholder');
    descriptionTextarea.focus();
    expect(document.activeElement).toBe(descriptionTextarea);

    await user.tab();

    // Modal does not intercept Tab on a non-boundary element — focus advances naturally
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'flashcards.create_modal.cancel' }));
  });

  it('restores focus to the previously focused element on unmount', () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    const { unmount } = render(
      <CreateSetModal onClose={vi.fn()} onSubmit={vi.fn()} />,
    );

    // Focus has moved into the modal
    expect(document.activeElement).not.toBe(trigger);

    unmount();

    expect(document.activeElement).toBe(trigger);
    trigger.remove();
  });
});
