import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useUserStore } from "@/stores/useUserStore";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "@/features/auth/logoutUser";
import { toast } from "sonner";
import { Menu, MenuButton, MenuItem, MenuItems, Transition, } from "@headlessui/react";
import { Fragment } from "react";
import { blurActiveElement } from "@/utils/dom";
import Button from "@/components/ui/Button";
import { useTranslation } from "react-i18next";
import { UserPlus } from "lucide-react";
export default function UserMenu({ mobile = false }) {
    const { profile, clearProfile } = useUserStore();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const handleLogout = async () => {
        const error = await logoutUser();
        if (!error) {
            clearProfile();
            toast.success(t("auth.logout.success") || "Logged out");
            blurActiveElement();
            navigate("/login");
        }
    };
    // Logged-out state: show Login + Register buttons
    if (!profile) {
        return (_jsxs("div", { className: "flex flex-col gap-2 w-full sm:flex-row sm:items-center sm:justify-end", children: [_jsx(Button, { fullWidth: true, size: "sm", to: "/login", variant: "outline", className: "\n          bg-blue-600 \n          text-white \n          border border-blue-600 \n          hover:bg-blue-700 \n          dark:bg-transparent \n          dark:border-blue-400 \n          dark:text-blue-400 \n          dark:hover:bg-blue-500 \n          dark:hover:text-white \n          transition\n          ", children: t("header.nav.login") }), _jsx(Button, { fullWidth: true, size: "sm", to: "/register", variant: "primary", iconRight: _jsx(UserPlus, { className: "w-4 h-4" }), children: t("header.nav.register") })] }));
    }
    const initial = profile.first_name.charAt(0).toUpperCase();
    // Mobile version: simplified logout
    if (mobile) {
        return (_jsx("button", { onClick: handleLogout, className: "text-sm text-red-600 hover:underline", children: t("header.nav.logout") }));
    }
    // Logged-in desktop version: avatar dropdown
    return (_jsxs(Menu, { as: "div", className: "relative inline-block text-left", children: [_jsx(MenuButton, { className: "inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary-500 text-white font-bold", children: initial }), _jsx(Transition, { as: Fragment, enter: "transition ease-out duration-100", enterFrom: "transform opacity-0 scale-95", enterTo: "transform opacity-100 scale-100", leave: "transition ease-in duration-75", leaveFrom: "transform opacity-100 scale-100", leaveTo: "transform opacity-0 scale-95", children: _jsxs(MenuItems, { className: "absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none", children: [_jsxs("div", { className: "px-3 py-2 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600", children: [_jsxs("div", { className: "font-medium px-1 py-1", children: [profile.first_name, " ", profile.last_name] }), _jsx("div", { className: "text-xs text-gray-500 dark:text-gray-400", children: profile.email })] }), _jsx("div", { className: "px-1 py-1", children: _jsx(MenuItem, { children: ({ active }) => (_jsx("button", { onClick: () => {
                                        if (profile?.username) {
                                            navigate(`/u/${profile.username}`);
                                        }
                                    }, className: `${active ? "bg-gray-100 dark:bg-gray-700" : ""} group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-900 dark:text-gray-100`, children: t("header.nav.dashboard") })) }) }), _jsx("div", { className: "px-1 py-1", children: _jsx(MenuItem, { children: ({ active }) => (_jsx("button", { onClick: handleLogout, className: `${active
                                        ? "bg-red-500 text-white"
                                        : "text-gray-900 dark:text-gray-100"} group flex w-full items-center rounded-md px-2 py-2 text-sm`, children: t("header.nav.logout") })) }) })] }) })] }));
}
