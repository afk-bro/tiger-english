// src/components/Header.tsx
import { Link } from "react-router-dom";
import { useState } from "react";
import { CreditCard, Info, Mail } from "lucide-react";
import DarkModeToggle from "./DarkModeToggle";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "react-i18next";
import UserMenu from "@/components/ui/UserMenu";
import NavLink from "@/components/ui/NavLink";
import Logo from "@/assets/TE-logo.png";

export default function Header() {
  const { t } = useTranslation();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-base-dark/95 backdrop-blur-sm border-b border-primary-100 dark:border-primary-800/30 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-1 group">
            <img
              src={Logo}
              alt={t("header.logo")}
              className="h-12 w-auto" // adjust height/width as needed
            />
            <div className="flex flex-col">
              <span className="hidden dark:inline text-xl font-display tracking-wide bg-gradient-to-r from-accent-600 to-accent-400 bg-clip-text text-transparent">
                {t("header.logo")}
              </span>
              <span className="inline dark:hidden text-xl font-display tracking-wide bg-gradient-to-r from-[#9a6728] to-[#7c4c16] bg-clip-text text-transparent">
                {t("header.logo")}
              </span>
              <span className="text-xs text-text-light/60 dark:text-text-dark/60 font-medium">
                {t("header.tagline")}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            <NavLink to="/flashcards" icon={<CreditCard className="w-4 h-4" />}>
              {t("header.nav.flashcards")}
            </NavLink>
            <NavLink to="/about" icon={<Info className="w-4 h-4" />}>
              {t("header.nav.about")}
            </NavLink>
            <NavLink to="/contact" icon={<Mail className="w-4 h-4" />}>
              {t("header.nav.contact")}
            </NavLink>

            <div className="w-px h-6 bg-primary-200 dark:bg-primary-700 mx-2"></div>
            {/* Login / Logout */}
            <UserMenu />

            <div className="flex gap-2 mt-4 sm:mt-0 sm:ml-auto">
              <DarkModeToggle />
              <LanguageSwitcher />
            </div>
          </nav>

          {/* Mobile nav button */}
          <div className="md:hidden flex items-center gap-3">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label={isMenuOpen ? t("common.nav.close_menu") : t("common.nav.open_menu")}
              aria-expanded={isMenuOpen}
              className="p-3 text-text-light dark:text-text-dark hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
        {isMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-primary-100 dark:border-primary-800/30">
            <nav className="flex flex-col gap-2" onClick={() => setIsMenuOpen(false)}>
              <NavLink to="/flashcards" exact icon={<CreditCard className="w-4 h-4" />}>
                {t("header.nav.flashcards")}
              </NavLink>
              <NavLink to="/about" exact icon={<Info className="w-4 h-4" />}>
                {t("header.nav.about")}
              </NavLink>
              <NavLink to="/contact" exact icon={<Mail className="w-4 h-4" />}>
                {t("header.nav.contact")}
              </NavLink>
              <div className="flex items-center">
                <UserMenu mobile={true} />
              </div>
            </nav>
            <div className="flex justify-center gap-4 mt-6">
              <DarkModeToggle />
              <LanguageSwitcher />
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
