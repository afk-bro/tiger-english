import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CreateSetModal } from '../components/CreateSetModal';

afterEach(() => {
  // RTL cleanup runs automatically; only remove manually-appended nodes here
});

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
    expect(heading).toHaveTextContent('Create flashcard set');
  });
});

// ── Focus management ─────────────────────────────────────────────────────────

describe('CreateSetModal — focus management', () => {
  it('auto-focuses the first focusable element (title input) on mount', () => {
    render(<CreateSetModal onClose={vi.fn()} onSubmit={vi.fn()} />);
    expect(document.activeElement).toBe(
      screen.getByPlaceholderText('e.g. Business English'),
    );
  });

  it('Escape key calls onClose', () => {
    const onClose = vi.fn();
    render(<CreateSetModal onClose={onClose} onSubmit={vi.fn()} />);

    const titleInput = screen.getByPlaceholderText('e.g. Business English');
    fireEvent.keyDown(titleInput, { key: 'Escape', bubbles: true });

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('Tab from the last focusable element wraps focus back to the title input', () => {
    render(<CreateSetModal onClose={vi.fn()} onSubmit={vi.fn()} />);

    const createButton = screen.getByRole('button', { name: 'Create set' });
    createButton.focus();
    expect(document.activeElement).toBe(createButton);

    fireEvent.keyDown(createButton, { key: 'Tab', bubbles: true });

    expect(document.activeElement).toBe(
      screen.getByPlaceholderText('e.g. Business English'),
    );
  });

  it('Shift+Tab from the title input wraps focus to the last focusable element', () => {
    render(<CreateSetModal onClose={vi.fn()} onSubmit={vi.fn()} />);

    const titleInput = screen.getByPlaceholderText('e.g. Business English');
    // auto-focused on mount; assert it is already active
    expect(document.activeElement).toBe(titleInput);

    fireEvent.keyDown(titleInput, { key: 'Tab', shiftKey: true, bubbles: true });

    expect(document.activeElement).toBe(
      screen.getByRole('button', { name: 'Create set' }),
    );
  });

  it('does not move focus when Tab is pressed on a non-boundary element', () => {
    render(<CreateSetModal onClose={vi.fn()} onSubmit={vi.fn()} />);

    const descriptionTextarea = screen.getByPlaceholderText('Optional description');
    descriptionTextarea.focus();

    // Tab on a middle element should not be intercepted
    fireEvent.keyDown(descriptionTextarea, { key: 'Tab', bubbles: true });

    // Focus should remain on the textarea (handler did not redirect it)
    expect(document.activeElement).toBe(descriptionTextarea);
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
