/// <reference types="vitest/globals" />
import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { useRegisterForm } from '../useRegisterForm';

describe('useRegisterForm — getConfirmPasswordValidationIcon', () => {
  it('returns X icon when password is invalid even if confirm matches', async () => {
    const { result } = renderHook(() => useRegisterForm());
    await act(async () => {
      result.current.setValue('password', 'abc');
      result.current.setValue('confirmPassword', 'abc');
    });
    const icon = result.current.getConfirmPasswordValidationIcon() as React.ReactElement | null;
    expect(icon).not.toBeNull();
    expect(icon!.props.className).toContain('text-red-500');
  });

  it('returns X icon when password is valid but confirm does not match', async () => {
    const { result } = renderHook(() => useRegisterForm());
    await act(async () => {
      result.current.setValue('password', 'Secure1!');
      result.current.setValue('confirmPassword', 'wrong');
    });
    const icon = result.current.getConfirmPasswordValidationIcon() as React.ReactElement | null;
    expect(icon!.props.className).toContain('text-red-500');
  });

  it('returns Check icon when password is valid and confirm matches', async () => {
    const { result } = renderHook(() => useRegisterForm());
    await act(async () => {
      result.current.setValue('password', 'Secure1!');
      result.current.setValue('confirmPassword', 'Secure1!');
    });
    const icon = result.current.getConfirmPasswordValidationIcon() as React.ReactElement | null;
    expect(icon!.props.className).toContain('text-green-500');
  });
});
