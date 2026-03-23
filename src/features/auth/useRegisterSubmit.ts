import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { registerUserAPI } from "./registerUserAPI";
import { RegisterFormData } from "@/schemas/authSchema";
import { UseRegisterFormReturn } from "./useRegisterForm";

export interface UseRegisterSubmitReturn {
  isSubmitting: boolean;
  onSubmit: (data: RegisterFormData) => Promise<void>;
}

export function useRegisterSubmit(
  setError: UseRegisterFormReturn['setError'],
  clearErrors: UseRegisterFormReturn['clearErrors']
): UseRegisterSubmitReturn {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    
    // Clear any previous server errors
    clearErrors();
    
    const result = await registerUserAPI({
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      userName: data.username,
      nativeLanguage: data.native_language ?? null,
    });
    
    setIsSubmitting(false);
    
    if (result.success) {
      toast.success(result.message);
      navigate("/login");
    } else {
      // If there's a specific field error, highlight that field
      if (result.field) {
        const FIELD_MAP: Record<string, keyof RegisterFormData> = {
          first_name: 'firstName',
          last_name: 'lastName',
          email: 'email',
          username: 'username',
          password: 'password',
          native_language: 'native_language',
        };

        const formField = result.field ? FIELD_MAP[result.field] : undefined;
        if (formField) {
          setError(formField, { type: 'server', message: result.error });
        } else {
          setError('root', { type: 'server', message: result.error });
        }

        // Scroll to the field with error
        const fieldElement = document.getElementById(result.field);
        if (fieldElement) {
          fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          fieldElement.focus();
        }
      } else {
        // Show general error toast if no specific field is identified
        toast.error(result.error);
      }
    }
  };

  return {
    isSubmitting,
    onSubmit,
  };
}
