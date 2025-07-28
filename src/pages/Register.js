import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import Button from "../components/ui/Button";
import FormInput from "../components/ui/FormInput";
import ErrorGuidanceCard from "../components/auth/ErrorGuidanceCard";
import { Mail, Lock, User, ArrowRight, UserPlus, AtSign } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useRegisterForm } from "../features/auth/useRegisterForm";
import { useRegisterSubmit } from "../features/auth/useRegisterSubmit";
export default function Register() {
    const { t } = useTranslation();
    // Use extracted hooks
    const { register, handleSubmit, setError, clearErrors, errors, handleFieldChange, getPasswordValidationIcon, getConfirmPasswordValidationIcon, } = useRegisterForm();
    const { isSubmitting, onSubmit } = useRegisterSubmit(setError, clearErrors);
    return (_jsx("section", { className: "min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50 dark:from-base-dark dark:to-primary-900/20 px-6 py-20", children: _jsxs("div", { className: "w-full max-w-md bg-white dark:bg-base-dark border border-primary-100 dark:border-primary-700/40 rounded-2xl shadow-md p-8 space-y-6", children: [_jsxs("div", { className: "text-center", children: [_jsx("div", { className: "inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl mb-4", children: _jsx(UserPlus, { className: "text-white w-6 h-6" }) }), _jsx("h2", { className: "text-2xl font-bold text-text-light dark:text-text-dark", children: t("register.title") }), _jsx("p", { className: "text-sm text-text-light/70 dark:text-text-dark/70 mt-2", children: t("register.subtitle") })] }), _jsxs("form", { className: "space-y-4", onSubmit: handleSubmit(onSubmit), children: [_jsx(FormInput, { label: t("register.username"), icon: _jsx(AtSign, { className: "w-5 h-5 text-gray-400 dark:text-gray-500" }), type: "text", placeholder: "Username", hasError: !!errors.username, ...register("username", {
                                onChange: handleFieldChange("username")
                            }) }), errors.username && (_jsxs("div", { className: "mt-1", children: [_jsx("p", { className: "text-sm text-red-500", children: errors.username.message }), errors.username.type === 'server' && errors.username.message?.includes('already taken') && (_jsx(ErrorGuidanceCard, { errorType: "username-taken" }))] })), _jsx(FormInput, { label: t("register.first_name"), icon: _jsx(User, { className: "w-5 h-5 text-gray-400 dark:text-gray-500" }), placeholder: "John", hasError: !!errors.firstName, ...register("firstName", {
                                onChange: handleFieldChange("firstName")
                            }) }), errors.firstName && (_jsx("p", { className: "text-sm text-red-500 mt-1", children: errors.firstName.message })), _jsx(FormInput, { label: t("register.last_name"), icon: _jsx(User, { className: "w-5 h-5 text-gray-400 dark:text-gray-500" }), placeholder: "Doe", hasError: !!errors.lastName, ...register("lastName", {
                                onChange: handleFieldChange("lastName")
                            }) }), errors.lastName && (_jsx("p", { className: "text-sm text-red-500 mt-1", children: errors.lastName.message })), _jsx(FormInput, { label: t("register.email"), icon: _jsx(Mail, { className: "w-5 h-5 text-gray-400 dark:text-gray-500" }), type: "email", placeholder: "you@example.com", hasError: !!errors.email, ...register("email", {
                                onChange: handleFieldChange("email")
                            }) }), errors.email && (_jsxs("div", { className: "mt-1", children: [_jsx("p", { className: "text-sm text-red-500", children: errors.email.message }), errors.email.type === 'server' && errors.email.message?.includes('already registered') && (_jsx(ErrorGuidanceCard, { errorType: "email-registered", showLoginLink: true }))] })), _jsx(FormInput, { label: t("register.password"), icon: _jsx(Lock, { className: "w-5 h-5 text-gray-400 dark:text-gray-500" }), validationIcon: getPasswordValidationIcon(), type: "password", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", hasError: !!errors.password, ...register("password", {
                                onChange: handleFieldChange("password")
                            }) }), errors.password && (_jsx("p", { className: "text-sm text-red-500 mt-1", children: errors.password.message })), _jsx(FormInput, { label: t("register.confirm_password"), icon: _jsx(Lock, { className: "w-5 h-5 text-gray-400 dark:text-gray-500" }), validationIcon: getConfirmPasswordValidationIcon(), type: "password", placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022", hasError: !!errors.confirmPassword, ...register("confirmPassword", {
                                onChange: handleFieldChange("confirmPassword")
                            }) }), errors.confirmPassword && (_jsx("p", { className: "text-sm text-red-500 mt-1", children: errors.confirmPassword.message })), _jsx(Button, { type: "submit", variant: "primary", iconRight: _jsx(ArrowRight, {}), className: "w-full", disabled: isSubmitting, children: isSubmitting ? t("register.loading") : t("register.submit") })] }), _jsxs("p", { className: "text-sm text-center text-text-light/70 dark:text-text-dark/70", children: [t("register.login_link"), " ", _jsx(Link, { to: "/login", className: "text-primary-600 dark:text-primary-400 font-medium hover:underline", children: t("register.login_cta") })] })] }) }));
}
