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

// Stub pages for new authenticated routes
const StubPage = ({ titleKey }: { titleKey: string }) => {
  const { t } = useTranslation();
  return (
    <div className="p-8 text-2xl font-semibold text-gray-700 dark:text-gray-300">
      {t('common.stub.coming_soon', { title: t(titleKey) })}
    </div>
  );
};

const PageLoader = () => (
  <div className="min-h-screen bg-semantic-bg flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AppInitializer />
        <Suspense fallback={<PageLoader />}>
          <Routes>
            {/* Public routes with PublicLayout */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/flashcards" element={<FlashcardsPage />} />
              <Route path="/u/:username" element={<StubPage titleKey="common.sidebar.nav.home" />} />
              <Route path="/login" element={<RequireGuest><Login /></RequireGuest>} />
              <Route path="/register" element={<RequireGuest><Register /></RequireGuest>} />
            </Route>

            {/* Auth callback — no layout wrapper */}
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Authenticated routes with AuthLayout + RequireAuth */}
            <Route element={<RequireAuth><AuthLayout /></RequireAuth>}>
              <Route path="/home" element={<AuthHome />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/library" element={<StubPage titleKey="common.sidebar.nav.library" />} />
              <Route path="/study-groups" element={<StubPage titleKey="common.sidebar.nav.study_groups" />} />
              <Route path="/notifications" element={<StubPage titleKey="common.sidebar.nav.notifications" />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/drag-drop" element={<StubPage titleKey="common.sidebar.nav.drag_drop" />} />
              <Route path="/ad-libs" element={<StubPage titleKey="common.sidebar.nav.ad_libs" />} />
            </Route>
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
