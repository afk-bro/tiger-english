import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, X } from "lucide-react";
import { registerSchema, RegisterFormData } from "@/schemas/authSchema";
import { isPasswordValid } from "@/features/auth/passwordRules";

export interface UseRegisterFormReturn {
  // Form methods
  register: ReturnType<typeof useForm<RegisterFormData>>['register'];
  handleSubmit: ReturnType<typeof useForm<RegisterFormData>>['handleSubmit'];
  watch: ReturnType<typeof useForm<RegisterFormData>>['watch'];
  setValue: ReturnType<typeof useForm<RegisterFormData>>['setValue'];
  setError: ReturnType<typeof useForm<RegisterFormData>>['setError'];
  clearErrors: ReturnType<typeof useForm<RegisterFormData>>['clearErrors'];
  errors: ReturnType<typeof useForm<RegisterFormData>>['formState']['errors'];

  // Helpers
  handleFieldChange: (fieldName: keyof RegisterFormData) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  getConfirmPasswordValidationIcon: () => React.ReactNode | null;
}

export function useRegisterForm(): UseRegisterFormReturn {
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    trigger,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onBlur',
    reValidateMode: 'onChange',
  });

  const password = watch("password");
  const confirmPassword = watch("confirmPassword");

  // Clears server errors immediately; re-validates Zod errors on change once the
  // field has already been validated (i.e. it currently has an error).
  const handleFieldChange = (fieldName: keyof RegisterFormData) => {
    return (_e: React.ChangeEvent<HTMLInputElement>) => {
      if (errors[fieldName]?.type === 'server') {
        clearErrors(fieldName);
      } else if (errors[fieldName]) {
        trigger(fieldName);
      }
    };
  };

  // ✓ only when the base password fully satisfies all rules AND both fields match.
  const getConfirmPasswordValidationIcon = (): React.ReactNode | null => {
    if (!confirmPassword) return null;
    const valid = isPasswordValid(password) && confirmPassword === password;
    return valid
      ? React.createElement(Check, { className: "w-5 h-5 text-green-500" })
      : React.createElement(X, { className: "w-5 h-5 text-red-500" });
  };

  return {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    clearErrors,
    errors,
    handleFieldChange,
    getConfirmPasswordValidationIcon,
  };
}
