/// <reference types="vitest/globals" />

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Register from '@/pages/Register';
import { toast } from 'sonner';
import i18n from '@/lib/i18n'; // or correct path


beforeAll(async () => {
  await i18n.changeLanguage('en');
});

screen.debug();

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn().mockResolvedValue({
        data: { user: { id: '123' } },
        error: null,
      }),
    },
    from: () => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
    }),
  },
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock useNavigate
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

// Wrapper for routing context
const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Register.tsx', () => {
  it('successfully registers a user and shows a success toast', async () => {
    render(<Register />, { wrapper: Wrapper });

    await userEvent.type(screen.getByLabelText(/first name/i), 'John');
    await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');
    await userEvent.type(screen.getByLabelText(/email/i), 'john@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'securepass');

    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Account created successfully!');
    });
  });
});
