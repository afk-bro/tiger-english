// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import AppInitializer from "./components/AppInitiazlier";
import Layout from "./components/Layout";
import UserLayout from "@/routes/UserLayout";
import ErrorBoundary from "./components/ErrorBoundary";

// Lazy load pages for better performance
const Home = lazy(() => import("@/pages/Home"));
const Register = lazy(() => import("@/pages/Register"));
const Login = lazy(() => import("@/pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const About = lazy(() => import("@/pages/About"));
const Contact = lazy(() => import("@/pages/Contact"));
const FlashcardTest = lazy(() => import("./pages/FlashcardTest"));
const FlashcardsPage = lazy(() => import("./pages/FlashcardsPage"));

// Loading component for lazy routes
const PageLoader = () => (
  <div className="min-h-screen bg-slate-50 dark:bg-base-dark flex items-center justify-center">
    <div className="text-xl text-text-light dark:text-text-dark">Loading...</div>
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AppInitializer />
        <Layout>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/register" element={<Register />} />
              <Route path="/login" element={<Login />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/flashcard-test" element={<FlashcardTest />} />
              <Route path="/flashcards" element={<FlashcardsPage />} />

              {/* Username-protected routes */}
              <Route path="/u/:username" element={<UserLayout />}>
                <Route index element={<Dashboard />} />
                {/* Future: <Route path="stats" element={<StatsPage />} /> */}
              </Route>
            </Routes>
          </Suspense>
        </Layout>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
