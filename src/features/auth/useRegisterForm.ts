import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, X } from "lucide-react";
import { registerSchema, RegisterFormData } from "@/schemas/authSchema";

export interface UseRegisterFormReturn {
  // Form methods
  register: ReturnType<typeof useForm<RegisterFormData>>['register'];
  handleSubmit: ReturnType<typeof useForm<RegisterFormData>>['handleSubmit'];
  watch: ReturnType<typeof useForm<RegisterFormData>>['watch'];
  setValue: ReturnType<typeof useForm<RegisterFormData>>['setValue'];
  setError: ReturnType<typeof useForm<RegisterFormData>>['setError'];
  clearErrors: ReturnType<typeof useForm<RegisterFormData>>['clearErrors'];
  errors: ReturnType<typeof useForm<RegisterFormData>>['formState']['errors'];
  
  // Watched values
  password: string;
  confirmPassword: string;
  
  // Helper functions
  handleFieldChange: (fieldName: keyof RegisterFormData) => (e: React.ChangeEvent<HTMLInputElement>) => void;
  getPasswordValidationIcon: () => React.ReactNode | null;
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
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  // Watch password fields for real-time validation
  const password = watch("password");
  const confirmPassword = watch("confirmPassword");

  // Validation helper functions
  const isPasswordValid = (pwd: string) => {
    return pwd && pwd.length >= 6;
  };

  const isConfirmPasswordValid = (pwd: string, confirmPwd: string) => {
    return confirmPwd && pwd && confirmPwd === pwd;
  };

  // Function to clear server errors when user starts typing
  const handleFieldChange = (fieldName: keyof RegisterFormData) => {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      // Clear server error for this field when user starts typing
      if (errors[fieldName]?.type === 'server') {
        clearErrors(fieldName);
      }
      // Call the original register onChange
      const originalOnChange = register(fieldName).onChange;
      if (originalOnChange) {
        originalOnChange(e);
      }
    };
  };

  // Validation icon components
  const getPasswordValidationIcon = (): React.ReactNode | null => {
    if (!password) return null;
    return isPasswordValid(password) 
      ? React.createElement(Check, { className: "w-5 h-5 text-green-500" })
      : React.createElement(X, { className: "w-5 h-5 text-red-500" });
  };

  const getConfirmPasswordValidationIcon = (): React.ReactNode | null => {
    if (!confirmPassword) return null;
    return isConfirmPasswordValid(password, confirmPassword)
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
    password,
    confirmPassword,
    handleFieldChange,
    getPasswordValidationIcon,
    getConfirmPasswordValidationIcon,
  };
}
