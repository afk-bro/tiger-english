import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";
import { logoutUser } from "@/features/auth/logoutUser";
import { toast } from "sonner";
import { Menu, Transition } from "@headlessui/react";
import { Fragment } from "react";

export default function UserMenu() {
  const [firstName, setFirstName] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("first_name")
        .eq("id", user.id)
        .single();

      if (!error && data?.first_name) {
        setFirstName(data.first_name);
      }
    };

    fetchProfile();

    const { data: listener } = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) {
        setFirstName(null);
      } else {
        fetchProfile();
      }
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    const error = await logoutUser();
    if (!error) {
      toast.success("Logged out");
      navigate("/login");
    }
  };

  if (!firstName) {
    return (
      <button
        onClick={() => navigate("/login")}
        className="text-sm text-primary-600 dark:text-primary-400 hover:underline mr-2"
      >
        Login
      </button>
    );
  }

  const initial = firstName.charAt(0).toUpperCase();

  return (
    <Menu as="div" className="relative inline-block text-left">
      <Menu.Button className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-primary-500 text-white font-bold">
        {initial}
      </Menu.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="opacity-0 scale-95"
        enterTo="opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="opacity-100 scale-100"
        leaveTo="opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-40 origin-top-right rounded-md bg-white dark:bg-base-dark shadow-lg ring-1 ring-black/10 focus:outline-none z-50">
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => navigate("/dashboard")}
                  className={`w-full text-left px-4 py-2 text-sm ${
                    active
                      ? "bg-primary-100 dark:bg-primary-800"
                      : "text-gray-700 dark:text-gray-100"
                  }`}
                >
                  Dashboard
                </button>
              )}
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={handleLogout}
                  className={`w-full text-left px-4 py-2 text-sm text-red-600 ${
                    active && "bg-red-100 dark:bg-red-900"
                  }`}
                >
                  Logout
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
}
