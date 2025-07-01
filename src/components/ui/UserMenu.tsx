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
import { blurActiveElement } from "@/utils/dom"

interface UserMenuProps {
  mobile?: boolean;
}

export default function UserMenu({ mobile = false }: UserMenuProps) {
  const { profile, clearProfile } = useUserStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    const error = await logoutUser();
    if (!error) {
      clearProfile();
      toast.success("Logged out");
      blurActiveElement();
      navigate("/login");
    }
  };

  if (!profile) {
    return (
      <button
        onClick={() => navigate("/login")}
        className="text-sm text-primary-600 dark:text-primary-400 hover:underline mr-2"
      >
        Login
      </button>
    );
  }

  const initial = profile.first_name.charAt(0).toUpperCase();

  // Mobile version - simple logout button
  if (mobile) {
    return (
      <button
        onClick={handleLogout}
        className="text-sm text-red-600 hover:underline"
      >
        Logout
      </button>
    );
  }

  // Desktop version - dropdown menu
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
              <div className="font-medium">
                <div className="px-1 py-1">
                {profile.first_name} {profile.last_name}
                </div>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {profile.email}
              </div>
            </div>
          <div className="px-1 py-1">
            <MenuItem>
              {({ active }) => (
                <button
                  onClick={() => navigate("/dashboard")}
                  className={`${
                    active ? "bg-gray-100 dark:bg-gray-700" : ""
                  } group flex w-full items-center rounded-md px-2 py-2 text-sm text-gray-900 dark:text-gray-100`}
                >
                  Dashboard
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
                  Logout
                </button>
              )}
            </MenuItem>
          </div>
        </MenuItems>
      </Transition>
    </Menu>
  );
}
