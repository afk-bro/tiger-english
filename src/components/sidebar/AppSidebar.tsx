import { useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Home, LayoutDashboard, GraduationCap, BookOpen, Users, Bell,
  Layers, MousePointer2, FileText, MessageCircleQuestion,
  RotateCcw, Zap, MessageSquare,
  Settings, HelpCircle, User, LogOut,
  ChevronLeft, ChevronRight, X,
} from "lucide-react";
import SidebarNavItem from "./SidebarNavItem";
import { useAiTutorStore } from "@/stores/useAiTutorStore";
import Logo from "@/assets/TE-logo.png";

interface AppSidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;  // ref to the button that opened the drawer
}

const NAV_ITEMS = [
  { to: "/home",              labelKey: "common.sidebar.nav.home",            icon: Home,             end: true },
  { to: "/dashboard",         labelKey: "common.sidebar.nav.dashboard",       icon: LayoutDashboard },
  { to: "/lessons",           labelKey: "common.sidebar.nav.lessons",         icon: GraduationCap },
  { to: "/review",            labelKey: "common.sidebar.nav.review",          icon: RotateCcw },
  { to: "/skills",            labelKey: "common.sidebar.nav.skills",          icon: Zap },
  { to: "/conversations",     labelKey: "common.sidebar.nav.conversations",   icon: MessageSquare },
  { to: "/library",           labelKey: "common.sidebar.nav.library",         icon: BookOpen },
  { to: "/study-groups",      labelKey: "common.sidebar.nav.study_groups",    icon: Users },
  { to: "/notifications",     labelKey: "common.sidebar.nav.notifications",   icon: Bell },
  { to: "/flashcards",        labelKey: "common.sidebar.nav.flashcards",      icon: Layers },
  { to: "/drag-drop",         labelKey: "common.sidebar.nav.drag_drop",       icon: MousePointer2 },
  { to: "/ad-libs",           labelKey: "common.sidebar.nav.ad_libs",         icon: FileText },
] as const;

const UTILITY_ITEMS = [
  { labelKey: "common.sidebar.utility.settings", icon: Settings },
  { labelKey: "common.sidebar.utility.help",     icon: HelpCircle },
  { labelKey: "common.sidebar.utility.profile",  icon: User },
  { labelKey: "common.sidebar.utility.logout",   icon: LogOut },
] as const;

export default function AppSidebar({ collapsed, onToggleCollapsed, isOpen, onClose, triggerRef }: AppSidebarProps) {
  const { t } = useTranslation();
  const openAiTutor = useAiTutorStore((s) => s.open);
  // Return focus to the trigger (hamburger) button on drawer close
  const prevIsOpen = useRef(isOpen);
  useEffect(() => {
    if (prevIsOpen.current && !isOpen && triggerRef?.current) {
      triggerRef.current.focus();
    }
    prevIsOpen.current = isOpen;
  }, [isOpen, triggerRef]);

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
            alt={t('common.sidebar.title')}
            className="w-7 h-7 flex-shrink-0 rounded"
          />
          {!collapsed && (
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 truncate">
              {t('common.sidebar.title')}
            </span>
          )}
        </div>
        <button
          onClick={onToggleCollapsed}
          aria-label={collapsed ? t('common.nav.expand_sidebar') : t('common.nav.collapse_sidebar')}
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
            label={t(item.labelKey)}
            icon={item.icon}
            collapsed={collapsed}
            end={'end' in item ? item.end : false}
          />
        ))}
      </nav>

      {/* AI Tutor button */}
      <div className="px-2 py-2 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => openAiTutor()}
          aria-label={collapsed ? t("common.sidebar.nav.ai_tutor", { defaultValue: "AI Tutor" }) : undefined}
          title={collapsed ? t("common.sidebar.nav.ai_tutor", { defaultValue: "AI Tutor" }) : undefined}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-medium bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 hover:bg-primary-100 dark:hover:bg-primary-900/40 transition-colors"
        >
          <MessageCircleQuestion className="w-5 h-5 flex-shrink-0" aria-hidden />
          {!collapsed && <span>{t("common.sidebar.nav.ai_tutor", { defaultValue: "AI Tutor" })}</span>}
        </button>
      </div>

      {/* Bottom utility zone */}
      <div className="px-2 py-3 border-t border-gray-200 dark:border-gray-700 space-y-1">
        {UTILITY_ITEMS.map((item) => {
          const label = t(item.labelKey);
          return (
            <button
              key={item.labelKey}
              aria-label={collapsed ? label : undefined}
              title={collapsed ? label : undefined}
              disabled
              className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm text-gray-400 dark:text-gray-600 cursor-not-allowed"
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </button>
          );
        })}
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
      {/* Overlay */}
      <div
        data-testid="sidebar-overlay"
        onClick={onClose}
        className={[
          "fixed inset-0 bg-black/50 z-40 transition-opacity duration-200",
          isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none",
        ].join(" ")}
      />
      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t('common.nav.open_nav')}
        className={[
          "fixed right-0 top-0 h-full z-50 transition-transform duration-200",
          isOpen ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        <div className="flex items-start h-full">
          <button
            onClick={onClose}
            aria-label={t('common.nav.close_nav')}
            className="m-2 p-2 rounded-full bg-white dark:bg-gray-800 shadow flex-shrink-0 mt-2"
          >
            <X className="w-4 h-4" />
          </button>
          {sidebarContent}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {desktopPanel}
      {mobileDrawer}
    </>
  );
}
