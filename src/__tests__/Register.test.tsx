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

function fillForm(overrides: Partial<Record<string, string>> = {}) {
  const values = {
    username: 'johndoe',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    password: 'Securepass1!',
    confirmPassword: 'Securepass1!',
    ...overrides,
  };
  fireEvent.change(screen.getByLabelText(/username/i), { target: { value: values.username } });
  fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: values.firstName } });
  fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: values.lastName } });
  fireEvent.change(screen.getByLabelText(/email/i), { target: { value: values.email } });
  fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: values.password } });
  fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: values.confirmPassword } });
}

describe('Register.tsx', () => {
  it('successfully registers a user and shows a success toast', async () => {
    render(<Register />, { wrapper: Wrapper });

    await userEvent.type(screen.getByLabelText(/username/i), 'johndoe');
    await userEvent.type(screen.getByLabelText(/first name/i), 'John');
    await userEvent.type(screen.getByLabelText(/last name/i), 'Doe');
    await userEvent.type(screen.getByLabelText(/email/i), 'john@example.com');
    await userEvent.type(screen.getByLabelText(/^password$/i), 'Securepass1!');
    await userEvent.type(screen.getByLabelText(/confirm password/i), 'Securepass1!');

    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith(
        'Account created successfully! Please log in to continue.'
      );
    });
  });

  describe('schema validation constraints', () => {
    it('shows error when username is too short (min 3)', async () => {
      render(<Register />, { wrapper: Wrapper });
      fillForm({ username: 'ab' });
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
      await waitFor(() => {
        expect(screen.getByText('Username must be at least 3 characters')).toBeInTheDocument();
      });
    });

    it('shows error when username is too long (max 30)', async () => {
      render(<Register />, { wrapper: Wrapper });
      fillForm({ username: 'a'.repeat(31) });
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
      await waitFor(() => {
        expect(screen.getByText('Username must be 30 characters or fewer')).toBeInTheDocument();
      });
    });

    it('shows error when first name is too long (max 50)', async () => {
      render(<Register />, { wrapper: Wrapper });
      fillForm({ firstName: 'A'.repeat(51) });
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
      await waitFor(() => {
        expect(screen.getByText('First name must be 50 characters or fewer')).toBeInTheDocument();
      });
    });

    it('shows error when last name is too long (max 50)', async () => {
      render(<Register />, { wrapper: Wrapper });
      fillForm({ lastName: 'A'.repeat(51) });
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
      await waitFor(() => {
        expect(screen.getByText('Last name must be 50 characters or fewer')).toBeInTheDocument();
      });
    });

    it('shows error when password is too short (min 8)', async () => {
      render(<Register />, { wrapper: Wrapper });
      fillForm({ password: 'Short1!', confirmPassword: 'Short1!' });
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
      await waitFor(() => {
        expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
      });
    });

    it('shows error when password is too long (max 100)', async () => {
      render(<Register />, { wrapper: Wrapper });
      const longPassword = 'A!'.padEnd(101, 'a');
      fillForm({ password: longPassword, confirmPassword: longPassword });
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
      await waitFor(() => {
        expect(screen.getByText('Password must be 100 characters or fewer')).toBeInTheDocument();
      });
    });

    it('shows error when password has no uppercase letter', async () => {
      render(<Register />, { wrapper: Wrapper });
      fillForm({ password: 'nouppercase1!', confirmPassword: 'nouppercase1!' });
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
      await waitFor(() => {
        expect(screen.getByText('Password must contain at least one uppercase letter')).toBeInTheDocument();
      });
    });

    it('shows error when password has no special character', async () => {
      render(<Register />, { wrapper: Wrapper });
      fillForm({ password: 'NoSpecialChar1', confirmPassword: 'NoSpecialChar1' });
      fireEvent.click(screen.getByRole('button', { name: /sign up/i }));
      await waitFor(() => {
        expect(screen.getByText('Password must contain at least one special character (!@#$%^&*)')).toBeInTheDocument();
      });
    });
  });
});
