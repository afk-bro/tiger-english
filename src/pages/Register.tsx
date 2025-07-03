import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "../components/ui/Button";
import FormInput from "../components/ui/FormInput";
import { Mail, Lock, User, ArrowRight, UserPlus } from "lucide-react";
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
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  const { t } = useTranslation();

  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: RegisterFormData) => {
    setIsSubmitting(true);
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
      toast.error(result.error);
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
            label={t("register.first_name")}
            icon={<User className="w-5 h-5 text-gray-400 dark:text-gray-500" />}
            placeholder="John"
            {...register("firstName")}
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
            {...register("lastName")}
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
            {...register("email")}
          />
          {errors.email && (
            <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
          )}
          <FormInput
            label={t("register.password")}
            icon={<Lock className="w-5 h-5 text-gray-400 dark:text-gray-500" />}
            type="password"
            placeholder="••••••••"
            {...register("password")}
          />
          {errors.password && (
            <p className="text-sm text-red-500 mt-1">
              {errors.password.message}
            </p>
          )}
          <FormInput
            label={t("register.username")}
            icon={<User className="w-5 h-5 text-gray-400 dark:text-gray-500" />}
            type="text"
            placeholder="Username"
            {...register("username")}
          />
          {errors.username && (
            <p className="text-sm text-red-500 mt-1">
              {errors.username.message}
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
