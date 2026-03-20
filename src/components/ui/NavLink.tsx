import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import clsx from "clsx";

interface NavLinkProps {
  to: string;
  children: ReactNode;
  icon?: ReactNode;
  exact?: boolean;
}

export default function NavLink({ to, children, icon, exact = false }: NavLinkProps) {
  const { pathname } = useLocation();
  const isActive = exact ? pathname === to : pathname.startsWith(to);

  return (
    <RouterNavLink
      to={to}
      className={clsx(
        "flex items-center gap-2 px-3 py-2 text-sm transition-all duration-200 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-400/40 rounded-lg",
        isActive
          ? "text-primary-600 dark:text-primary-400 font-medium"
          : "text-semantic-muted hover:text-primary-500 dark:text-semantic-muted dark:hover:text-primary-400"
      )}
    >
      {icon}
      {children}
    </RouterNavLink>
  );
}
