import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// src/components/Header.tsx
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { CreditCard, Info, Mail } from "lucide-react";
import DarkModeToggle from "./DarkModeToggle";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "react-i18next";
import UserMenu from "@/components/ui/UserMenu";
import NavLink from "@/components/ui/NavLink";
import Logo from "@/assets/golden_lantern.png";
export default function Header() {
    const location = useLocation();
    const { t } = useTranslation();
    const isActive = (path) => location.pathname === path;
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const navLinkClass = (path) => `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive(path)
        ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
        : "text-text-light/70 dark:text-text-dark/70 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20"}`;
    return (_jsx("header", { className: "sticky top-0 z-50 bg-white/95 dark:bg-base-dark/95 backdrop-blur-sm border-b border-primary-100 dark:border-primary-800/30 shadow-sm", children: _jsxs("div", { className: "max-w-7xl mx-auto px-6 py-4", children: [_jsxs("div", { className: "flex items-center justify-between", children: [_jsxs(Link, { to: "/", className: "flex items-center gap-1 group", children: [_jsx("img", { src: Logo, alt: "Golden Lantern Academy", className: "h-12 w-auto" // adjust height/width as needed
                                 }), _jsxs("div", { className: "flex flex-col", children: [_jsx("span", { className: "hidden dark:inline text-xl font-display tracking-wide bg-gradient-to-r from-accent-600 to-accent-400 bg-clip-text text-transparent", children: t("header.logo") }), _jsx("span", { className: "inline dark:hidden text-xl font-display tracking-wide bg-gradient-to-r from-[#9a6728] to-[#7c4c16] bg-clip-text text-transparent", children: t("header.logo") }), _jsx("span", { className: "font-body text-xs text-text-light/60 dark:text-text-dark/60 font-medium", children: t("header.tagline") })] })] }), _jsxs("nav", { className: "hidden md:flex items-center gap-2", children: [_jsx(NavLink, { to: "/flashcards", icon: _jsx(CreditCard, { className: "w-4 h-4" }), children: t("header.nav.flashcards") }), _jsx(NavLink, { to: "/about", icon: _jsx(Info, { className: "w-4 h-4" }), children: t("header.nav.about") }), _jsx(NavLink, { to: "/contact", icon: _jsx(Mail, { className: "w-4 h-4" }), children: t("header.nav.contact") }), _jsx("div", { className: "w-px h-6 bg-primary-200 dark:bg-primary-700 mx-2" }), _jsx(UserMenu, {}), _jsxs("div", { className: "flex gap-2 mt-4 sm:mt-0 sm:ml-auto", children: [_jsx(DarkModeToggle, {}), _jsx(LanguageSwitcher, {})] })] }), _jsx("div", { className: "md:hidden flex items-center gap-3", children: _jsx("button", { onClick: () => setIsMenuOpen(!isMenuOpen), className: "p-2 text-text-light dark:text-text-dark hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors", children: _jsx("svg", { className: "w-6 h-6", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 6h16M4 12h16M4 18h16" }) }) }) })] }), isMenuOpen && (_jsxs("div", { className: "md:hidden mt-4 pt-4 border-t border-primary-100 dark:border-primary-800/30", children: [_jsxs("nav", { className: "flex flex-col gap-2", children: [_jsxs(Link, { to: "/flashcards", className: navLinkClass("/flashcards"), children: [_jsx(CreditCard, { className: "w-4 h-4" }), t("header.nav.flashcards")] }), _jsxs(Link, { to: "/about", className: navLinkClass("/about"), children: [_jsx(Info, { className: "w-4 h-4" }), t("header.nav.about")] }), _jsxs(Link, { to: "/contact", className: navLinkClass("/contact"), children: [_jsx(Mail, { className: "w-4 h-4" }), t("header.nav.contact")] }), _jsx("div", { className: "flex items-center", children: _jsx(UserMenu, { mobile: true }) })] }), _jsxs("div", { className: "flex justify-center gap-4 mt-6", children: [_jsx(DarkModeToggle, {}), _jsx(LanguageSwitcher, {})] })] }))] }) }));
}
