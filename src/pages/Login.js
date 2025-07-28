import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Button from "../components/ui/Button";
import FormInput from "../components/ui/FormInput";
import { Mail, Lock, LogIn } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";
import { loginSchema } from "@/schemas/authSchema";
import { useUserStore } from "@/stores/useUserStore";
import { loginUser } from "@/features/auth/loginUser";
export default function Login() {
    const { register, handleSubmit, formState: { errors }, } = useForm({
        resolver: zodResolver(loginSchema),
    });
    const { t } = useTranslation();
    const navigate = useNavigate();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const onSubmit = async (data) => {
        setIsSubmitting(true);
        // Call reusable login handler
        const result = await loginUser(data);
        // Stop loading spinner
        setIsSubmitting(false);
        if (!result.success) {
            toast.error(result.message || "Login failed");
            return;
        }
        // Safely get latest profile data from Zustand store
        const updatedProfile = useUserStore.getState().profile;
        if (updatedProfile?.username) {
            toast.success("Login successful");
            navigate(`/u/${updatedProfile.username}`);
        }
        else {
            toast.error("Profile not found after login");
        }
    };
    return (_jsx("section", { className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50 dark:from-base-dark dark:to-primary-900/20 px-6 py-20", children: _jsxs("div", { className: "w-full max-w-md bg-white dark:bg-base-dark border border-primary-100 dark:border-primary-700/40 rounded-2xl shadow-md p-8 space-y-6", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl mb-4", children: _jsx(LogIn, { className: "text-white w-6 h-6" }) }), _jsx("h2", { className: "text-2xl font-bold text-text-light dark:text-text-dark", children: t("login.title") }), _jsx("p", { className: "text-sm text-text-light/70 dark:text-text-dark/70 mt-2", children: t("login.subtitle") })] }), _jsxs("form", { className: "space-y-4", onSubmit: handleSubmit(onSubmit), children: [_jsx(FormInput, { label: t("login.email"), icon: _jsx(Mail, { className: "w-5 h-5 text-gray-400 dark:text-gray-500" }), type: "email", placeholder: "you@example.com", ...register("email") }), errors.email && (_jsx("p", { className: "text-sm text-red-500 mt-1", children: errors.email.message })), _jsx(FormInput, { label: t("login.password"), icon: _jsx(Lock, { className: "w-5 h-5 text-gray-400 dark:text-gray-500" }), type: "password", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", ...register("password") }), errors.password && (_jsx("p", { className: "text-sm text-red-500 mt-1", children: errors.password.message })), _jsx(Button, { type: "submit", variant: "primary", iconRight: _jsx(LogIn, {}), className: "w-full", disabled: isSubmitting, children: isSubmitting ? t("login.loading") : t("login.submit") })] }), _jsxs("p", { className: "text-sm text-center text-text-light/70 dark:text-text-dark/70", children: [t("login.no_account"), " ", _jsx(Link, { to: "/register", className: "text-primary-600 dark:text-primary-400 font-medium hover:underline", children: t("login.create_account") })] })] }) }));
}
