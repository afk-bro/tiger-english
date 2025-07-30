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
    });
    
    setIsSubmitting(false);
    
    if (result.success) {
      toast.success(result.message);
      navigate("/login");
    } else {
      // If there's a specific field error, highlight that field
      if (result.field) {
        setError(result.field as keyof RegisterFormData, {
          type: 'server',
          message: result.error,
        });
        
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
