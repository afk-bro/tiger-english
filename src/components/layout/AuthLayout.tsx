// src/components/layout/AuthLayout.tsx
import { useState } from "react";
import { Link } from "react-router-dom";
import type { ReactNode } from "react";
import { useSidebarStore } from "@/stores/useSidebarStore";
import AppSidebar from "@/components/sidebar/AppSidebar";
import DarkModeToggle from "@/components/DarkModeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import UserMenu from "@/components/ui/UserMenu";
import Logo from "@/assets/TE-logo.png";
import { Menu } from "lucide-react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  const { collapsed, toggleCollapsed } = useSidebarStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-semantic-bg dark:bg-semantic-bg text-semantic-text dark:text-semantic-text">
      {/* Slim authenticated header */}
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-primary-100 dark:border-primary-800/30 shadow-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <img src={Logo} alt="Tiger English" className="h-9 w-auto" />
          </Link>
          <div className="flex items-center gap-2">
            <DarkModeToggle />
            <LanguageSwitcher />
            <UserMenu />
            {/* Mobile sidebar toggle */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Content + sidebar */}
      <div className="flex flex-1 overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
        <AppSidebar
          collapsed={collapsed}
          onToggleCollapsed={toggleCollapsed}
          isOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />
      </div>
    </div>
  );
}
