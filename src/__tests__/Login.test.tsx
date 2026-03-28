/// <reference types="vitest/globals" />
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import Login from '@/pages/Login';
import { toast } from 'sonner';
import i18n from '@/lib/i18n';
import { loginUser } from '@/features/auth/loginUser';

beforeAll(async () => {
  await i18n.changeLanguage('en');
});

vi.mock('@/features/auth/loginUser', () => ({
  loginUser: vi.fn(),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOAuth: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
  },
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});

vi.mock('@/stores/useUserStore', () => ({
  useUserStore: { getState: vi.fn(() => ({ profile: null })) },
}));

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('Login.tsx', () => {
  it('shows email error when submitted blank', async () => {
    render(<Login />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));
    await waitFor(() => {
      expect(screen.getByText('Invalid email')).toBeInTheDocument();
    });
  });

  it('shows password error when submitted blank', async () => {
    render(<Login />, { wrapper: Wrapper });
    fireEvent.click(screen.getByRole('button', { name: /log in/i }));
    await waitFor(() => {
      expect(screen.getByText('Password must be at least 8 characters')).toBeInTheDocument();
    });
  });

  it('shows no validation icon for email before the field is blurred', () => {
    render(<Login />, { wrapper: Wrapper });
    // Before blur, getEmailValidationIcon returns null — no pr-10 padding on input
    const emailInput = screen.getByLabelText(/email address/i);
    expect(emailInput).not.toHaveClass('pr-10');
  });

  it('shows check icon (no error border) after blur with valid email', async () => {
    const user = userEvent.setup();
    render(<Login />, { wrapper: Wrapper });
    await user.type(screen.getByLabelText(/email address/i), 'valid@example.com');
    await user.tab();
    await waitFor(() => {
      expect(screen.getByLabelText(/email address/i)).not.toHaveClass('border-red-300');
      // pr-10 class present means validationIcon was rendered
      expect(screen.getByLabelText(/email address/i)).toHaveClass('pr-10');
    });
  });

  it('shows X icon (error border) after blur with invalid email', async () => {
    const user = userEvent.setup();
    render(<Login />, { wrapper: Wrapper });
    await user.type(screen.getByLabelText(/email address/i), 'notanemail');
    await user.tab();
    await waitFor(() => {
      expect(screen.getByLabelText(/email address/i)).toHaveClass('border-red-300');
      expect(screen.getByLabelText(/email address/i)).toHaveClass('pr-10');
    });
  });

  it('never shows a validation icon on the password field', async () => {
    const user = userEvent.setup();
    render(<Login />, { wrapper: Wrapper });
    const passwordInput = screen.getByLabelText(/^password$/i);
    await user.type(passwordInput, 'Secure1!');
    await user.tab();
    // No validationIcon prop on password FormInput → no pr-10 padding
    expect(passwordInput).not.toHaveClass('pr-10');
  });

  it('shows inline error below password and does not toast on invalid credentials', async () => {
    vi.mocked(loginUser).mockResolvedValue({
      success: false,
      message: 'Invalid email or password',
    });
    const user = userEvent.setup();
    render(<Login />, { wrapper: Wrapper });

    await user.type(screen.getByLabelText(/email address/i), 'a@b.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Secure1!');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });
    expect(toast.error).not.toHaveBeenCalledWith('Invalid email or password');
  });

  it('clears server error on password field when user retypes', async () => {
    vi.mocked(loginUser).mockResolvedValue({
      success: false,
      message: 'Invalid email or password',
    });
    const user = userEvent.setup();
    render(<Login />, { wrapper: Wrapper });

    await user.type(screen.getByLabelText(/email address/i), 'a@b.com');
    await user.type(screen.getByLabelText(/^password$/i), 'Secure1!');
    await user.click(screen.getByRole('button', { name: /log in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password')).toBeInTheDocument();
    });

    // Typing in password field should clear the server error
    await user.type(screen.getByLabelText(/^password$/i), 'x');

    await waitFor(() => {
      expect(screen.queryByText('Invalid email or password')).not.toBeInTheDocument();
    });
  });
});
