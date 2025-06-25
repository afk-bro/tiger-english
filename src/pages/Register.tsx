import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Layout from "../components/Layout";
import Button from "../components/ui/Button";
import FormInput from "../components/ui/FormInput";
import { Mail, Lock, User, ArrowRight } from "lucide-react";

export default function Register() {
  const schema = z.object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
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

  const onSubmit = (data: FormData) => {
    console.log("Registering:", data);
    // send to Supabase or show toast
  };
  return (
    <Layout>
      <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50 dark:from-base-dark dark:to-primary-900/20 px-6 py-20">
        <div className="w-full max-w-md bg-white dark:bg-base-dark border border-primary-100 dark:border-primary-700/40 rounded-2xl shadow-md p-8 space-y-6">
          {/* ... header stuff here ... */}

          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <FormInput
              label="First Name"
              icon={
                <User className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              }
              placeholder="John"
              {...register("firstName")}
            />
            {errors.firstName && (
              <p className="text-sm text-red-500 mt-1">
                {errors.firstName.message}
              </p>
            )}
            <FormInput
              label="Last Name"
              icon={
                <User className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              }
              placeholder="Doe"
              {...register("lastName")}
            />
            {errors.lastName && (
              <p className="text-sm text-red-500 mt-1">
                {errors.lastName.message}
              </p>
            )}
            <FormInput
              label="Email"
              icon={
                <Mail className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              }
              type="email"
              placeholder="you@example.com"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-sm text-red-500 mt-1">
                {errors.email.message}
              </p>
            )}
            <FormInput
              label="Password"
              icon={
                <Lock className="w-5 h-5 text-gray-400 dark:text-gray-500" />
              }
              type="password"
              placeholder="••••••••"
              {...register("password")}
            />
            {errors.password && (
              <p className="text-sm text-red-500 mt-1">
                {errors.password.message}
              </p>
            )}
            <Button
              type="submit"
              variant="primary"
              iconRight={<ArrowRight />}
              className="w-full"
            >
              Sign Up
            </Button>
          </form>

          {/* ... login link ... */}
        </div>
      </section>
    </Layout>
  );
}
