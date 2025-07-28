import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/components/home/HeroSection.tsx
import { Link } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";
import { useTranslation } from "react-i18next";
import Button from "../ui/Button";
export default function HeroSection() {
    const { t } = useTranslation();
    return (_jsxs("section", { className: "relative overflow-hidden", children: [_jsx("div", { className: "absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-primary-900/20 dark:via-base-dark dark:to-accent-900/20" }), _jsx("div", { className: "relative text-center py-24 md:py-32 px-6", children: _jsxs("div", { className: "max-w-4xl mx-auto", children: [_jsxs("div", { className: "inline-flex items-center gap-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-4 py-2 rounded-full text-sm font-medium mb-8", children: [_jsx(Sparkles, { className: "w-4 h-4" }), t("hero.badge")] }), _jsx("h1", { className: "text-5xl md:text-7xl font-bold leading-tight mb-6 bg-gradient-to-r from-primary-300 to-[#fcd34d] font-display bg-clip-text text-transparent tracking-wide", children: t("hero.title") }), _jsx("p", { className: "text-xl md:text-2xl text-text-light/80 dark:text-text-dark/80 max-w-3xl mx-auto mb-12 leading-relaxed", children: t("hero.subtitle") }), _jsxs("div", { className: "flex flex-col sm:flex-row gap-4 justify-center items-center", children: [_jsx(Link, { to: "/register", children: _jsx(Button, { to: "/register", variant: "primary", iconRight: _jsx(ArrowRight, {}), children: t("hero.cta") }) }), _jsx(Link, { to: "/about", children: _jsx("button", { className: "text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 px-8 py-4 text-lg font-medium transition-colors", children: t("hero.learn_more") }) })] })] }) })] }));
}
