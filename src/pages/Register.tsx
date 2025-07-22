import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "../components/ui/Button";
import FormInput from "../components/ui/FormInput";
import { Mail, Lock, User, ArrowRight, UserPlus, AtSign, Check, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { registerUser } from "../features/auth/registerUser";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { registerSchema, RegisterFormData } from "@/schemas/authSchema";

export default function Register() {
  const {
    register,
    handleSubmit,
    watch,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const { t } = useTranslation();

  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Watch password fields for real-time validation
  const password = watch("password");
  const confirmPassword = watch("confirmPassword");

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

  // Validation helper functions
  const isPasswordValid = (pwd: string) => {
    return pwd && pwd.length >= 6;
  };

  const isConfirmPasswordValid = (pwd: string, confirmPwd: string) => {
    return confirmPwd && pwd && confirmPwd === pwd;
  };

  // Validation icon components
  const getPasswordValidationIcon = () => {
    if (!password) return null;
    return isPasswordValid(password) ? (
      <Check className="w-5 h-5 text-green-500" />
    ) : (
      <X className="w-5 h-5 text-red-500" />
    );
  };

  const getConfirmPasswordValidationIcon = () => {
    if (!confirmPassword) return null;
    return isConfirmPasswordValid(password, confirmPassword) ? (
      <Check className="w-5 h-5 text-green-500" />
    ) : (
      <X className="w-5 h-5 text-red-500" />
    );
  };

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
    
    // Clear any previous server errors
    clearErrors();
    
    const result = await registerUser({
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
  return (
    <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50 dark:from-base-dark dark:to-primary-900/20 px-6 py-20">
      <div className="w-full max-w-md bg-white dark:bg-base-dark border border-primary-100 dark:border-primary-700/40 rounded-2xl shadow-md p-8 space-y-6">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl mb-4">
            <UserPlus className="text-white w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">
            {t("register.title")}
          </h2>
          <p className="text-sm text-text-light/70 dark:text-text-dark/70 mt-2">
            {t("register.subtitle")}
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <FormInput
            label={t("register.username")}
            icon={<AtSign className="w-5 h-5 text-gray-400 dark:text-gray-500" />}
            type="text"
            placeholder="Username"
            hasError={!!errors.username}
            {...register("username", {
              onChange: handleFieldChange("username")
            })}
          />
          {errors.username && (
            <div className="mt-1">
              <p className="text-sm text-red-500">{errors.username.message}</p>
              {errors.username.type === 'server' && errors.username.message?.includes('already taken') && (
                <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    Please try a different username. You can use letters, numbers, and underscores.
                  </p>
                </div>
              )}
            </div>
          )}
          <FormInput
            label={t("register.first_name")}
            icon={<User className="w-5 h-5 text-gray-400 dark:text-gray-500" />}
            placeholder="John"
            hasError={!!errors.firstName}
            {...register("firstName", {
              onChange: handleFieldChange("firstName")
            })}
          />
          {errors.firstName && (
            <p className="text-sm text-red-500 mt-1">
              {errors.firstName.message}
            </p>
          )}
          <FormInput
            label={t("register.last_name")}
            icon={<User className="w-5 h-5 text-gray-400 dark:text-gray-500" />}
            placeholder="Doe"
            hasError={!!errors.lastName}
            {...register("lastName", {
              onChange: handleFieldChange("lastName")
            })}
          />
          {errors.lastName && (
            <p className="text-sm text-red-500 mt-1">
              {errors.lastName.message}
            </p>
          )}
          <FormInput
            label={t("register.email")}
            icon={<Mail className="w-5 h-5 text-gray-400 dark:text-gray-500" />}
            type="email"
            placeholder="you@example.com"
            hasError={!!errors.email}
            {...register("email", {
              onChange: handleFieldChange("email")
            })}
          />
          {errors.email && (
            <div className="mt-1">
              <p className="text-sm text-red-500">{errors.email.message}</p>
              {errors.email.type === 'server' && errors.email.message?.includes('already registered') && (
                <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-sm text-red-700 dark:text-red-300 mb-2">
                    It looks like you already have an account with this email.
                  </p>
                  <Link
                    to="/login"
                    className="inline-flex items-center text-sm font-medium text-red-600 dark:text-red-400 hover:text-red-500 dark:hover:text-red-300 underline"
                  >
                    Log in instead →
                  </Link>
                </div>
              )}
            </div>
          )}
          <FormInput
            label={t("register.password")}
            icon={<Lock className="w-5 h-5 text-gray-400 dark:text-gray-500" />}
            validationIcon={getPasswordValidationIcon()}
            type="password"
            placeholder="••••••••"
            hasError={!!errors.password}
            {...register("password", {
              onChange: handleFieldChange("password")
            })}
          />
          {errors.password && (
            <p className="text-sm text-red-500 mt-1">
              {errors.password.message}
            </p>
          )}
          <FormInput
            label={t("register.confirm_password")}
            icon={<Lock className="w-5 h-5 text-gray-400 dark:text-gray-500" />}
            validationIcon={getConfirmPasswordValidationIcon()}
            type="password"
            placeholder="••••••••"
            hasError={!!errors.confirmPassword}
            {...register("confirmPassword", {
              onChange: handleFieldChange("confirmPassword")
            })}
          />
          {errors.confirmPassword && (
            <p className="text-sm text-red-500 mt-1">
              {errors.confirmPassword.message}
            </p>
          )}

          <Button
            type="submit"
            variant="primary"
            iconRight={<ArrowRight />}
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? t("register.loading") : t("register.submit")}
          </Button>
        </form>

        {/* ... login link ... */}
        <p className="text-sm text-center text-text-light/70 dark:text-text-dark/70">
          {t("register.login_link")}{" "}
          <Link
            to="/login"
            className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
          >
            {t("register.login_cta")}
          </Link>
        </p>
      </div>
    </section>
  );
}
