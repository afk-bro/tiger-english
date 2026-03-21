import { useRef, useEffect } from "react";
import {
  Home, LayoutDashboard, BookOpen, Users, Bell,
  Layers, MousePointer2, FileText,
  Settings, HelpCircle, User, LogOut,
  ChevronLeft, ChevronRight, X,
} from "lucide-react";
import SidebarNavItem from "./SidebarNavItem";
import Logo from "@/assets/TE-logo.png";

interface AppSidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  isOpen: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { to: "/",              label: "Home",         icon: Home,           end: true },
  { to: "/dashboard",     label: "Dashboard",    icon: LayoutDashboard },
  { to: "/library",       label: "Library",      icon: BookOpen },
  { to: "/study-groups",  label: "Study Groups", icon: Users },
  { to: "/notifications", label: "Notifications",icon: Bell },
  { to: "/flashcards",    label: "Flashcards",   icon: Layers },
  { to: "/drag-drop",     label: "Drag & Drop",  icon: MousePointer2 },
  { to: "/ad-libs",       label: "Ad Libs",      icon: FileText },
] as const;

const UTILITY_ITEMS = [
  { label: "Settings",  icon: Settings },
  { label: "Help",      icon: HelpCircle },
  { label: "Profile",   icon: User },
  { label: "Logout",    icon: LogOut },
] as const;

export default function AppSidebar({ collapsed, onToggleCollapsed, isOpen, onClose }: AppSidebarProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Return focus to close button on drawer close (mobile)
  const prevIsOpen = useRef(isOpen);
  useEffect(() => {
    if (prevIsOpen.current && !isOpen) {
      closeButtonRef.current?.focus();
    }
    prevIsOpen.current = isOpen;
  }, [isOpen]);

  const sidebarContent = (
    <div
      className={[
        "flex flex-col h-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700",
        "transition-[width] duration-150 ease-in-out",
        collapsed ? "w-16" : "w-60",
      ].join(" ")}
    >
      {/* Top zone */}
      <div className="flex items-center justify-between px-3 py-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 min-w-0">
          <img
            src={Logo}
            alt="Tiger English"
            className="w-7 h-7 flex-shrink-0 rounded"
          />
          {!collapsed && (
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
              Tiger English
            </span>
          )}
        </div>
        <button
          onClick={onToggleCollapsed}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 flex-shrink-0"
        >
          {collapsed ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Nav zone */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        {NAV_ITEMS.map((item) => (
          <SidebarNavItem
            key={item.to}
            to={item.to}
            label={item.label}
            icon={item.icon}
            collapsed={collapsed}
            end={'end' in item ? item.end : false}
          />
        ))}
      </nav>

      {/* Bottom utility zone */}
      <div className="px-2 py-3 border-t border-gray-200 dark:border-gray-700 space-y-1">
        {UTILITY_ITEMS.map((item) => (
          <button
            key={item.label}
            aria-label={collapsed ? item.label : undefined}
            title={collapsed ? item.label : undefined}
            disabled
            className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-400 dark:text-gray-600 cursor-not-allowed"
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{item.label}</span>}
          </button>
        ))}
      </div>
    </div>
  );

  // Desktop: inline panel
  const desktopPanel = (
    <div className="hidden md:flex h-full">
      {sidebarContent}
    </div>
  );

  // Mobile: off-canvas overlay drawer
  const mobileDrawer = (
    <div className="md:hidden">
      {isOpen && (
        <>
          <div
            data-testid="sidebar-overlay"
            className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-200"
            onClick={onClose}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="fixed right-0 top-0 h-full z-50 transition-transform duration-200"
          >
            <div className="flex items-start">
              <button
                ref={closeButtonRef}
                onClick={onClose}
                aria-label="Close navigation"
                className="m-2 p-2 rounded-full bg-white dark:bg-gray-800 shadow"
              >
                <X className="w-4 h-4" />
              </button>
              {sidebarContent}
            </div>
          </div>
        </>
      )}
    </div>
  );

  return (
    <>
      {desktopPanel}
      {mobileDrawer}
    </>
  );
}
