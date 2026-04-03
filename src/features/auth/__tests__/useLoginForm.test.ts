/// <reference types="vitest/globals" />
import { renderHook, act } from '@testing-library/react';
import { useLoginForm } from '../useLoginForm';
import { loginUser } from '@/features/auth/loginUser';

const mockNavigate = vi.fn();

vi.mock('@/features/auth/loginUser');
vi.mock('@/lib/supabase', () => ({ supabase: { auth: { signInWithPassword: vi.fn() } } }));
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useLoginForm', () => {
  it('formState.isSubmitting is false by default', () => {
    const { result } = renderHook(() => useLoginForm());
    expect(result.current.formState.isSubmitting).toBe(false);
  });

  it('sets server error on password field when loginUser returns success: false', async () => {
    vi.mocked(loginUser).mockResolvedValue({
      success: false,
      message: 'Invalid email or password',
    });
    const { result } = renderHook(() => useLoginForm());

    await act(async () => {
      await result.current.onSubmit({ email: 'a@b.com', password: 'Secure1!' });
    });

    expect(result.current.errors.password?.type).toBe('server');
    expect(result.current.errors.password?.message).toBe('Invalid email or password');
  });

  it('navigates to /home on successful login', async () => {
    vi.mocked(loginUser).mockResolvedValue({ success: true });
    const { result } = renderHook(() => useLoginForm());

    await act(async () => {
      await result.current.onSubmit({ email: 'a@b.com', password: 'Secure1!' });
    });

    expect(mockNavigate).toHaveBeenCalledWith('/home');
  });
});
