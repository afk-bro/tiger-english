import { NavLink, useMatch, useResolvedPath } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

interface SidebarNavItemProps {
  to: string;
  label: string;
  icon: LucideIcon;
  collapsed: boolean;
  end?: boolean;
}

export default function SidebarNavItem({ to, label, icon: Icon, collapsed, end = false }: SidebarNavItemProps) {
  const resolved = useResolvedPath(to);
  const match = useMatch({ path: resolved.pathname, end });
  const isActive = !!match;

  return (
    <NavLink
      to={to}
      end={end}
      aria-label={collapsed ? label : undefined}
      title={collapsed ? label : undefined}
      className={[
        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500",
        isActive
          ? collapsed
            ? "bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400 border-r-2 border-primary-500"
            : "bg-primary-100 dark:bg-primary-900/40 text-primary-600 dark:text-primary-400"
          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800",
      ].join(" ")}
    >
      <Icon
        className={["w-5 h-5 flex-shrink-0", isActive ? "text-primary-600 dark:text-primary-400" : ""].join(" ")}
      />
      {!collapsed && <span>{label}</span>}
    </NavLink>
  );
}
