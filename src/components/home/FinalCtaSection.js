import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/components/home/FinalCtaSection.tsx
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "../ui/Button";
export default function FinalCtaSection() {
    const { t } = useTranslation();
    return (_jsxs("section", { className: "relative overflow-hidden", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 dark:from-primary-400 dark:via-primary-600 dark:to-accent-700" }), _jsx("div", { className: "relative text-center py-24 px-6", children: _jsxs("div", { className: "max-w-4xl mx-auto", children: [_jsx("h2", { className: "text-4xl md:text-5xl font-bold text-white mb-6", children: t("cta.heading") }), _jsx("p", { className: "text-xl text-white/90 max-w-2xl mx-auto mb-12", children: t("cta.desc") }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-4 justify-center items-center", children: [_jsx(Link, { to: "/register", children: _jsx(Button, { to: "/register", variant: "primary", iconRight: _jsx(ArrowRight, {}), children: t("cta.button") }) }), _jsx(Link, { to: "/contact", children: _jsx(Button, { to: "/contact", variant: "outline", iconRight: _jsx(ArrowRight, {}), children: t("cta.contact") }) })] })] }) })] }));
}
