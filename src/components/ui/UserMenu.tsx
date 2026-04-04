import { useUserStore } from "@/stores/useUserStore";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "@/features/auth/logoutUser";
import { toast } from "sonner";
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems,
  Transition,
} from "@headlessui/react";
import { Fragment } from "react";
import { blurActiveElement } from "@/utils/dom";
import Button from "@/components/ui/Button";
import { useTranslation } from "react-i18next";
import { UserPlus } from "lucide-react";

interface UserMenuProps {
  mobile?: boolean;
}

export default function UserMenu({ mobile = false }: UserMenuProps) {
  const { profile, profileLoading, session, clearProfile } = useUserStore();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLogout = async () => {
    const error = await logoutUser();
    if (!error) {
      clearProfile();
      toast.success(t("logout.success") || "Logout Successful");
      blurActiveElement();
      navigate("/login");
    }
  };

  // Show spinner while loading OR when a session exists but profile hasn't resolved yet
  // (e.g. transient DB error returning null). Prevents flashing unauthenticated UI.
  if (profileLoading || (session && !profile)) {
    return (
      <div
        role="status"
        aria-label={t("common.loading")}
        className="w-9 h-9 rounded-full border-2 border-primary-200 border-t-primary-500 animate-spin"
      />
    );
  }

  // Logged-out state (no session, no profile): show Login + Register buttons
  if (!profile) {
    return (
      <div className="flex flex-col gap-2 w-full sm:flex-row sm:items-center sm:justify-end">
        <Button
          fullWidth
          size="sm"
          to="/login"
          variant="outline"
          className="
          bg-blue-600 
          text-white 
          border border-blue-600 
          hover:bg-blue-700 
          dark:bg-transparent 
          dark:border-blue-400 
          dark:text-blue-400 
          dark:hover:bg-blue-500 
          dark:hover:text-white 
          transition
          "
        >
          {t("header.nav.login")}
        </Button>

        <Button
          fullWidth
          size="sm"
          to="/register"
          variant="primary"
          iconRight={<UserPlus className="w-4 h-4" />}
        >
          {t("header.nav.register")}
        </Button>
      </div>
    );
  }

  const initial = profile.first_name.charAt(0).toUpperCase();

  // Mobile version: simplified logout
  if (mobile) {
    return (
      <button
        onClick={handleLogout}
        className="text-sm text-red-600 hover:underline"
      >
        {t("header.nav.logout")}
      </button>
    );
  }

  // Logged-in desktop version: avatar dropdown
  return (
    <Menu as="div" className="relative inline-block text-left">
      <MenuButton className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary-500 text-white font-bold">
        {initial}
      </MenuButton>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <MenuItems className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-gray-100 rounded-md bg-white dark:bg-gray-800 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
          <div className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-600">
            <div className="font-medium px-1 py-1">
              {profile.first_name} {profile.last_name}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {profile.email}
            </div>
          </div>

          <div className="px-1 py-1">
            <MenuItem>
              {({ active }) => (
                <button
                  onClick={() => {
                    navigate('/home');
                  }}
                  className={`${
                    active ? "bg-gray-100 dark:bg-gray-700" : ""
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-900 dark:text-gray-100`}
                >
                  {t("header.nav.dashboard")}
                </button>
              )}
            </MenuItem>
          </div>

          <div className="px-1 py-1">
            <MenuItem>
              {({ active }) => (
                <button
                  onClick={handleLogout}
                  className={`${
                    active
                      ? "bg-red-500 text-white"
                      : "text-gray-900 dark:text-gray-100"
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                >
                  {t("header.nav.logout")}
                </button>
              )}
            </MenuItem>
          </div>
        </MenuItems>
      </Transition>
    </Menu>
  );
}
