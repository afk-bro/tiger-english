import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, X } from "lucide-react";
import { registerSchema } from "@/schemas/authSchema";
export function useRegisterForm() {
    const { register, handleSubmit, watch, setError, clearErrors, formState: { errors }, } = useForm({
        resolver: zodResolver(registerSchema),
    });
    // Watch password fields for real-time validation
    const password = watch("password");
    const confirmPassword = watch("confirmPassword");
    // Validation helper functions
    const isPasswordValid = (pwd) => {
        return pwd && pwd.length >= 6;
    };
    const isConfirmPasswordValid = (pwd, confirmPwd) => {
        return confirmPwd && pwd && confirmPwd === pwd;
    };
    // Function to clear server errors when user starts typing
    const handleFieldChange = (fieldName) => {
        return (e) => {
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
    const getPasswordValidationIcon = () => {
        if (!password)
            return null;
        return isPasswordValid(password)
            ? React.createElement(Check, { className: "w-5 h-5 text-green-500" })
            : React.createElement(X, { className: "w-5 h-5 text-red-500" });
    };
    const getConfirmPasswordValidationIcon = () => {
        if (!confirmPassword)
            return null;
        return isConfirmPasswordValid(password, confirmPassword)
            ? React.createElement(Check, { className: "w-5 h-5 text-green-500" })
            : React.createElement(X, { className: "w-5 h-5 text-red-500" });
    };
    return {
        register,
        handleSubmit,
        watch,
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
