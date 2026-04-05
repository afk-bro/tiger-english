import Button from "../components/ui/Button";
import FormInput from "../components/ui/FormInput";
import GoogleAuthButton from "@/components/ui/GoogleAuthButton";
import { Mail, Lock, LogIn } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useLoginForm } from "@/features/auth/useLoginForm";

export default function Login() {
  const { t } = useTranslation();
  const {
    register,
    handleSubmit,
    onSubmit,
    errors,
    formState: { isSubmitting },
    getEmailValidationIcon,
    handleEmailChange,
    handlePasswordChange,
  } = useLoginForm();

  return (
    <section className="min-h-screen flex items-center justify-center bg-semantic-bg dark:bg-semantic-bg px-4 md:px-6 py-12 md:py-16">
      <div className="w-full max-w-4xl mx-auto flex justify-center">
        <div className="card card-lg w-full max-w-md space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl mb-4">
              <LogIn className="text-white w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">
              {t("login.title")}
            </h2>
            <p className="text-sm text-text-light/70 dark:text-text-dark/70 mt-2">
              {t("login.subtitle")}
            </p>
          </div>

          <GoogleAuthButton />

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white dark:bg-gray-900 px-2 text-gray-400 dark:text-gray-500">
                {t('auth.separator')}
              </span>
            </div>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <FormInput
              label={t("login.email")}
              icon={<Mail className="w-5 h-5 text-gray-400 dark:text-gray-500" />}
              validationIcon={getEmailValidationIcon()}
              type="email"
              placeholder="you@example.com"
              hasError={!!errors.email}
              {...register("email", { onChange: handleEmailChange })}
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
            )}
            <FormInput
              label={t("login.password")}
              icon={<Lock className="w-5 h-5 text-gray-400 dark:text-gray-500" />}
              type="password"
              placeholder="••••••••"
              hasError={!!errors.password}
              {...register("password", { onChange: handlePasswordChange })}
            />
            {errors.password && (
              <p className="text-sm text-red-500 mt-1">
                {errors.password.message}
              </p>
            )}
            <Button
              type="submit"
              variant="primary"
              iconRight={<LogIn />}
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? t("login.loading") : t("login.submit")}
            </Button>
          </form>

          <p className="text-sm text-center text-text-light/70 dark:text-text-dark/70">
            {t("login.no_account")}{" "}
            <Link
              to="/register"
              className="text-primary-600 dark:text-primary-400 font-medium hover:underline"
            >
              {t("login.create_account")}
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}
