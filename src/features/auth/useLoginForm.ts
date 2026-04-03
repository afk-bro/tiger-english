import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { loginSchema, LoginFormData } from '@/schemas/authSchema';
import { loginUser } from '@/features/auth/loginUser';

export interface UseLoginFormReturn {
  register: ReturnType<typeof useForm<LoginFormData>>['register'];
  handleSubmit: ReturnType<typeof useForm<LoginFormData>>['handleSubmit'];
  onSubmit: (data: LoginFormData) => Promise<void>;
  errors: ReturnType<typeof useForm<LoginFormData>>['formState']['errors'];
  setError: ReturnType<typeof useForm<LoginFormData>>['setError'];
  formState: {
    touchedFields: ReturnType<typeof useForm<LoginFormData>>['formState']['touchedFields'];
    isSubmitting: boolean;
  };
  getEmailValidationIcon: () => React.ReactNode | null;
  handleEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handlePasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function useLoginForm(): UseLoginFormReturn {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    formState: { errors, touchedFields, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  // Clears stale server error when user retypes — mirrors useRegisterForm's handleFieldChange.
  const handleEmailChange = (_e: React.ChangeEvent<HTMLInputElement>) => {
    if (errors.email?.type === 'server') clearErrors('email');
  };

  const handlePasswordChange = (_e: React.ChangeEvent<HTMLInputElement>) => {
    if (errors.password?.type === 'server') clearErrors('password');
  };

  // Check after blur with valid format; X after blur with invalid; null before first blur.
  // Visibility is driven by touchedFields (set by RHF on blur with mode:'onBlur').
  const getEmailValidationIcon = (): React.ReactNode | null => {
    if (!touchedFields.email) return null;
    return errors.email
      ? React.createElement(X, { className: 'w-5 h-5 text-red-500' })
      : React.createElement(Check, { className: 'w-5 h-5 text-green-500' });
  };

  const onSubmit = async (data: LoginFormData) => {
    const result = await loginUser(data);

    if (!result.success) {
      // Server credential errors surface inline below the password field — no toast.
      setError('password', {
        type: 'server',
        message: result.message || 'Invalid email or password',
      });
      return;
    }

    toast.success('Login successful');
    navigate('/home');
  };

  return {
    register,
    handleSubmit,
    onSubmit,
    errors,
    setError,
    formState: { touchedFields, isSubmitting },
    getEmailValidationIcon,
    handleEmailChange,
    handlePasswordChange,
  };
}
