// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import AppInitializer from "./components/AppInitializer";
import PublicLayout from "./components/layout/PublicLayout";
import AuthLayout from "./components/layout/AuthLayout";
import RequireAuth from "./features/auth/RequireAuth";
import RequireGuest from "./features/auth/RequireGuest";
import ErrorBoundary from "./components/ErrorBoundary";
import { useUserStore } from "@/stores/useUserStore";

const Home           = lazy(() => import("@/pages/Home"));
const AuthHome       = lazy(() => import("@/pages/AuthHome"));
const Register       = lazy(() => import("@/pages/Register"));
const Login          = lazy(() => import("@/pages/Login"));
const AuthCallback   = lazy(() => import("@/pages/AuthCallback"));
const About          = lazy(() => import("@/pages/About"));
const Contact        = lazy(() => import("@/pages/Contact"));
const FlashcardsPage = lazy(() => import("./pages/FlashcardsPage"));
const Dashboard      = lazy(() => import("./pages/Dashboard"));
const Settings       = lazy(() => import("@/pages/Settings"));
const LessonsIndex   = lazy(() => import("@/features/lessons/pages/LessonsIndex"));
const UnitHub        = lazy(() => import("@/features/lessons/pages/UnitHub"));
const SectionPage    = lazy(() => import("@/features/lessons/pages/SectionPage"));
const SkillsPage       = lazy(() => import("@/features/skills/pages/SkillsPage"));
const SkillDetailPage  = lazy(() => import("@/features/skills/pages/SkillDetailPage"));
const ReviewPage                = lazy(() => import("@/features/review/pages/ReviewPage"));
const ConversationsPage         = lazy(() => import("@/features/conversations/pages/ConversationsPage"));
const MissionRunnerPage         = lazy(() => import("@/features/conversations/pages/MissionRunnerPage"));
const ConversationHistoryPage   = lazy(() => import("@/features/conversations/pages/ConversationHistoryPage"));

// Stub pages for new authenticated routes
const StubPage = ({ titleKey }: { titleKey: string }) => {
  const { t } = useTranslation();
  return (
    <div className="p-8 text-2xl font-semibold text-gray-700 dark:text-gray-300">
      {t('common.stub.coming_soon', { title: t(titleKey) })}
    </div>
  );
};

// Auth-aware layout for /flashcards: public marketing chrome for anon
// users, full app shell for authenticated users. The route stays
// publicly reachable; only the chrome flips. Predicate mirrors
// FlashcardsPage's `isAuthenticated = profile !== null` so chrome and
// page-level auth behavior are always in sync. See spec at
// docs/superpowers/specs/2026-05-04-flashcards-sidebar-layout-design.md.
export function FlashcardsLayout() {
  const profile = useUserStore((s) => s.profile);
  return profile ? <AuthLayout /> : <PublicLayout />;
}

const PageLoader = () => (
  <div className="min-h-screen bg-semantic-bg flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

// Exported so route-level integration tests can render the route tree
// inside a MemoryRouter without needing the BrowserRouter shell.
export function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        {/* Public routes with PublicLayout */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/u/:username" element={<StubPage titleKey="common.stub.public_profile" />} />
          <Route path="/login" element={<RequireGuest><Login /></RequireGuest>} />
          <Route path="/register" element={<RequireGuest><Register /></RequireGuest>} />
        </Route>

        {/* /flashcards: auth-aware chrome — sidebar when signed in, public layout otherwise */}
        <Route path="/flashcards" element={<FlashcardsLayout />}>
          <Route index element={<FlashcardsPage />} />
        </Route>

        {/* Auth callback — no layout wrapper */}
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Authenticated routes with AuthLayout + RequireAuth */}
        <Route element={<RequireAuth><AuthLayout /></RequireAuth>}>
          <Route path="/home" element={<AuthHome />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/lessons" element={<LessonsIndex />} />
          <Route path="/lessons/:unitSlug" element={<UnitHub />} />
          <Route path="/lessons/:unitSlug/:sectionKey" element={<SectionPage />} />
          <Route path="/skills" element={<SkillsPage />} />
          <Route path="/skills/:skillKey" element={<SkillDetailPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/conversations" element={<ConversationsPage />} />
          <Route path="/conversations/:slug" element={<MissionRunnerPage />} />
          <Route path="/u/:username/conversations" element={<ConversationHistoryPage />} />
          <Route path="/library" element={<StubPage titleKey="common.sidebar.nav.library" />} />
          <Route path="/study-groups" element={<StubPage titleKey="common.sidebar.nav.study_groups" />} />
          <Route path="/notifications" element={<StubPage titleKey="common.sidebar.nav.notifications" />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/drag-drop" element={<StubPage titleKey="common.sidebar.nav.drag_drop" />} />
          <Route path="/ad-libs" element={<StubPage titleKey="common.sidebar.nav.ad_libs" />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AppInitializer />
        <AppRoutes />
      </Router>
    </ErrorBoundary>
  );
}

export default App;
