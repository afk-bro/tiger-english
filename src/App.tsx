// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
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
const StubPage = ({ title }: { title: string }) => (
  <div className="p-8 text-2xl font-semibold text-gray-700 dark:text-gray-300">{title} — coming soon</div>
);

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
              <Route path="/u/:username" element={<StubPage title="Public Profile" />} />
              <Route path="/login" element={<RequireGuest><Login /></RequireGuest>} />
              <Route path="/register" element={<RequireGuest><Register /></RequireGuest>} />
            </Route>

            {/* Auth callback — no layout wrapper */}
            <Route path="/auth/callback" element={<AuthCallback />} />

            {/* Authenticated routes with AuthLayout + RequireAuth */}
            <Route element={<RequireAuth><AuthLayout /></RequireAuth>}>
              <Route path="/home" element={<AuthHome />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/library" element={<StubPage title="Library" />} />
              <Route path="/study-groups" element={<StubPage title="Study Groups" />} />
              <Route path="/notifications" element={<StubPage title="Notifications" />} />
              <Route path="/flashcards" element={<FlashcardsPage />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/drag-drop" element={<StubPage title="Drag & Drop" />} />
              <Route path="/ad-libs" element={<StubPage title="Ad Libs" />} />
            </Route>
          </Routes>
        </Suspense>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
