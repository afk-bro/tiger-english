/// <reference types="vitest/globals" />
import { renderHook, act } from '@testing-library/react';
import { useLoginForm } from '../useLoginForm';
import { loginUser } from '@/features/auth/loginUser';

vi.mock('@/features/auth/loginUser');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => vi.fn() };
});
vi.mock('@/stores/useUserStore', () => ({
  useUserStore: { getState: vi.fn(() => ({ profile: null })) },
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));

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
});
