// src/components/Header.tsx
import { Link, useLocation } from "react-router-dom";
import {
  BookOpen,
  CreditCard,
  LogIn,
  UserPlus,
  Info,
  Mail,
} from "lucide-react";
import DarkModeToggle from "./DarkModeToggle";
import LanguageSwitcher from "./LanguageSwitcher";
import Button from "./ui/Button";
import { useTranslation } from "react-i18next";

export default function Header() {
  const location = useLocation();
  const { t } = useTranslation();

  const isActive = (path: string) => location.pathname === path;

  const navLinkClass = (path: string) =>
    `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
      isActive(path)
        ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
        : "text-text-light/70 dark:text-text-dark/70 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20"
    }`;

  return (
    <header className="sticky top-0 z-50 bg-white/95 dark:bg-base-dark/95 backdrop-blur-sm border-b border-primary-100 dark:border-primary-800/30 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
                Gain English
              </span>
              <span className="text-xs text-text-light/60 dark:text-text-dark/60 font-medium">
                {t("header.tagline")}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-2">
            <Link to="/flashcards" className={navLinkClass("/flashcards")}>
              <CreditCard className="w-4 h-4" />
              {t("header.nav.flashcards")}
            </Link>
            <Link to="/about" className={navLinkClass("/about")}>
              <Info className="w-4 h-4" />
              {t("header.nav.about")}
            </Link>
            <Link to="/contact" className={navLinkClass("/contact")}>
              <Mail className="w-4 h-4" />
              {t("header.nav.contact")}
            </Link>

            <div className="w-px h-6 bg-primary-200 dark:bg-primary-700 mx-2"></div>

            <Link to="/login" className={navLinkClass("/login")}>
              <LogIn className="w-4 h-4" />
              {t("header.nav.login")}
            </Link>

            <Button
              to="/register"
              variant="primary"
              size='sm'
              iconRight={<UserPlus className="w-4 h-4" />}
            >
              {t("header.nav.register")}
            </Button>

            <div className="ml-2 flex items-center gap-2">
              <DarkModeToggle />
              <LanguageSwitcher />
            </div>
          </nav>

          {/* Mobile nav button (inactive for now) */}
          <div className="md:hidden flex items-center gap-3">
            <DarkModeToggle />
            <button className="p-2 text-text-light dark:text-text-dark hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-lg transition-colors">
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
      </div>
    </header>
  );
}
