import { NavLink, useMatch, useResolvedPath } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

interface SidebarNavItemProps {
  to: string;
  label: string;
  icon: LucideIcon;
  collapsed: boolean;
  end?: boolean;
  /** Optional count badge shown on the right side of the nav item when > 0. */
  badge?: number;
}

export default function SidebarNavItem({ to, label, icon: Icon, collapsed, end = false, badge }: SidebarNavItemProps) {
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
        "relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150",
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
      {!collapsed && <span className="flex-1">{label}</span>}
      {!collapsed && badge != null && badge > 0 && (
        <span className="ml-auto flex-shrink-0 min-w-[1.25rem] h-5 px-1 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center leading-none">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
      {collapsed && badge != null && badge > 0 && (
        <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500" aria-hidden="true" />
      )}
    </NavLink>
  );
}
