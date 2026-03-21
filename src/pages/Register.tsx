import Button from "../components/ui/Button";
import FormInput from "../components/ui/FormInput";
import ErrorGuidanceCard from "../components/auth/ErrorGuidanceCard";
import GoogleAuthButton from "@/components/ui/GoogleAuthButton";
import { Mail, Lock, User, ArrowRight, UserPlus, AtSign } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useRegisterForm } from "../features/auth/useRegisterForm";
import { useRegisterSubmit } from "../features/auth/useRegisterSubmit";

export default function Register() {
  const { t } = useTranslation();

  // Use extracted hooks
  const {
    register,
    handleSubmit,
    setError,
    clearErrors,
    errors,
    handleFieldChange,
    getPasswordValidationIcon,
    getConfirmPasswordValidationIcon,
  } = useRegisterForm();

  const { isSubmitting, onSubmit } = useRegisterSubmit(setError, clearErrors);
  return (
    <section className="min-h-screen flex items-center justify-center bg-semantic-bg dark:bg-semantic-bg px-4 md:px-6 py-12 md:py-16">
      <div className="w-full max-w-4xl mx-auto flex justify-center">
        <div className="card card-lg w-full max-w-md space-y-6">
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

        <GoogleAuthButton />

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-200 dark:border-gray-700" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-gray-900 px-2 text-gray-400 dark:text-gray-500">
              or
            </span>
          </div>
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
                <ErrorGuidanceCard errorType="username-taken" />
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
                <ErrorGuidanceCard errorType="email-registered" showLoginLink={true} />
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
      </div>
    </section>
  );
}
