import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

vi.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOAuth: vi.fn(),
    },
  },
}));

import { supabase } from '@/lib/supabase';
import GoogleAuthButton from '../GoogleAuthButton';

const mockSignIn = supabase.auth.signInWithOAuth as ReturnType<typeof vi.fn>;

beforeEach(() => {
  vi.clearAllMocks();
  mockSignIn.mockResolvedValue({ data: {}, error: null });
});

describe('GoogleAuthButton', () => {
  it('renders "Continue with Google" text', () => {
    render(<GoogleAuthButton />);
    expect(screen.getByText('auth.google.button')).toBeInTheDocument();
  });

  it('calls signInWithOAuth with google provider on click', async () => {
    render(<GoogleAuthButton />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(mockSignIn).toHaveBeenCalledWith(
        expect.objectContaining({ provider: 'google' })
      );
    });
  });

  it('includes /auth/callback in the redirectTo option', async () => {
    render(<GoogleAuthButton />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      const call = mockSignIn.mock.calls[0][0];
      expect(call.options.redirectTo).toContain('/auth/callback');
    });
  });

  it('shows loading state while OAuth is initiating', async () => {
    // signInWithOAuth never resolves in this test so loading stays true
    mockSignIn.mockImplementation(() => new Promise(() => {}));
    render(<GoogleAuthButton />);
    fireEvent.click(screen.getByRole('button'));
    expect(await screen.findByText('auth.google.connecting')).toBeInTheDocument();
  });

  it('shows error message when signInWithOAuth fails', async () => {
    mockSignIn.mockResolvedValue({ data: null, error: { message: 'OAuth failed' } });
    render(<GoogleAuthButton />);
    fireEvent.click(screen.getByRole('button'));
    expect(await screen.findByText('OAuth failed')).toBeInTheDocument();
  });
});
