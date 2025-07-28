import { jsxs as _jsxs } from "react/jsx-runtime";
import { NavLink as RouterNavLink, useLocation } from "react-router-dom";
import clsx from "clsx";
export default function NavLink({ to, children, icon, exact = false }) {
    const { pathname } = useLocation();
    const isActive = exact ? pathname === to : pathname.startsWith(to);
    return (_jsxs(RouterNavLink, { to: to, className: clsx("flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200", isActive
            ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
            : "text-text-light/70 dark:text-text-dark/70 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20"), children: [icon, children] }));
}
