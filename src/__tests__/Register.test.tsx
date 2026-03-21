/// <reference types="vitest/globals" />

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Register from '@/pages/Register';
import { toast } from 'sonner';
import i18n from '@/lib/i18n';

beforeAll(async () => {
  await i18n.changeLanguage('en');
});

vi.mock('@/features/auth/registerUserAPI', () => ({
  registerUserAPI: vi.fn().mockResolvedValue({
    success: true,
    message: 'Account created successfully! Please log in to continue.',
  }),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOAuth: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
  },
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => vi.fn(),
  };
});

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Register.tsx', () => {
  it('successfully registers a user and shows a success toast', async () => {
    render(<Register />, { wrapper: Wrapper });

    await userEvent.type(screen.getByLabelText(/username/i), 'johndoe');
    await userEvent.type(screen.getByLabelText(/first name/i), 'John');
    await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');
    await userEvent.type(screen.getByLabelText(/email/i), 'john@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'securepass123');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'securepass123');

    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Account created successfully! Please log in to continue.'
      );
    });
  });
});
