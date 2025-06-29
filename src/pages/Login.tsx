import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Layout from "../components/Layout";
import Button from "../components/ui/Button";
import FormInput from "../components/ui/FormInput";
import { Mail, Lock, LogIn } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Login() {
  const schema = z.object({
    email: z.string().email("Invalid email"),
    password: z.string().min(6, "Password must be at least 6 characters"),
  });

  type FormData = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    const { error } = await supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    });
    setIsSubmitting(false);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Login successful");
      navigate("/dashboard"); // Adjust route as needed
    }
  };

  return (
    <Layout>
      <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50 dark:from-base-dark dark:to-primary-900/20 px-6 py-20">
        <div className="w-full max-w-md bg-white dark:bg-base-dark border border-primary-100 dark:border-primary-700/40 rounded-2xl shadow-md p-8 space-y-6">
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

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <FormInput
              label={t("login.email")}
              icon={<Mail className="w-5 h-5 text-gray-400 dark:text-gray-500" />}
              type="email"
              placeholder="you@example.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
            )}
            <FormInput
              label={t("login.password")}
              icon={<Lock className="w-5 h-5 text-gray-400 dark:text-gray-500" />}
              type="password"
              placeholder="••••••••"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
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
      </section>
    </Layout>
  );
}
