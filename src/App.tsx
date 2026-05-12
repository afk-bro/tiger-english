// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { useTranslation } from "react-i18next";
import AppInitializer from "./components/AppInitializer";
import PublicLayout from "./components/layout/PublicLayout";
import AuthLayout from "./components/layout/AuthLayout";
import RequireAuth from "./features/auth/RequireAuth";
import RequireTeacher from "./features/teacher/components/RequireTeacher";
import RequireAdmin from "./features/admin/components/RequireAdmin";
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
const PracticeHub               = lazy(() => import("@/features/practice/pages/PracticeHub"));
const ConversationsPage         = lazy(() => import("@/features/conversations/pages/ConversationsPage"));
const MissionRunnerPage         = lazy(() => import("@/features/conversations/pages/MissionRunnerPage"));
const ConversationHistoryPage   = lazy(() => import("@/features/conversations/pages/ConversationHistoryPage"));
const ConversationDetailPage    = lazy(() => import("@/features/conversations/pages/ConversationDetailPage"));
const AssessmentRunnerPage      = lazy(() => import("@/features/assessment/pages/AssessmentRunnerPage"));
const AssessmentResultsPage     = lazy(() => import("@/features/assessment/pages/AssessmentResultsPage"));
const TeacherOverviewPage       = lazy(() => import("@/features/teacher/pages/TeacherOverviewPage"));
const TeacherClassesPage        = lazy(() => import("@/features/teacher/pages/TeacherClassesPage"));
const TeacherClassDetailPage    = lazy(() => import("@/features/teacher/pages/TeacherClassDetailPage"));
const TeacherStudentsPage       = lazy(() => import("@/features/teacher/pages/TeacherStudentsPage"));
const TeacherStudentDetailPage  = lazy(() => import("@/features/teacher/pages/TeacherStudentDetailPage"));
const OrgOverviewPage           = lazy(() => import("@/features/org-admin/pages/OrgOverviewPage"));
const OrgBillingPage            = lazy(() => import("@/features/org-admin/pages/OrgBillingPage"));
const AdminAiUsagePage          = lazy(() => import("@/features/admin/pages/AdminAiUsagePage"));
const TutorLayout               = lazy(() => import("@/features/ai-tutor/components/TutorLayout").then(m => ({ default: m.TutorLayout })));
const AiTutorHomePage           = lazy(() => import("@/pages/ai-tutor/AiTutorHomePage"));
const PhrasebookPage            = lazy(() => import("@/pages/ai-tutor/PhrasebookPage"));
const ScenarioBriefingPage      = lazy(() => import("@/pages/ai-tutor/ScenarioBriefingPage"));
const TutorSessionPage          = lazy(() => import("@/pages/ai-tutor/TutorSessionPage"));

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
          <Route path="/practice" element={<PracticeHub />} />
          <Route path="/conversations" element={<ConversationsPage />} />
          <Route path="/conversations/:slug" element={<MissionRunnerPage />} />
          <Route path="/u/:username/conversations" element={<ConversationHistoryPage />} />
          <Route path="/u/:username/conversations/scenarios" element={<ConversationsPage />} />
          <Route path="/u/:username/conversations/:sessionId" element={<ConversationDetailPage />} />
          <Route path="/library" element={<StubPage titleKey="common.sidebar.nav.library" />} />
          <Route path="/study-groups" element={<StubPage titleKey="common.sidebar.nav.study_groups" />} />
          <Route path="/notifications" element={<StubPage titleKey="common.sidebar.nav.notifications" />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/drag-drop" element={<StubPage titleKey="common.sidebar.nav.drag_drop" />} />
          <Route path="/ad-libs" element={<StubPage titleKey="common.sidebar.nav.ad_libs" />} />
          {/* Assessment routes */}
          <Route path="/u/:username/assessment/:level" element={<AssessmentRunnerPage />} />
          <Route path="/u/:username/assessment/:level/results" element={<AssessmentResultsPage />} />
          <Route path="/assessment/:level" element={<AssessmentRunnerPage />} />
          <Route path="/assessment/:level/results" element={<AssessmentResultsPage />} />
          {/* Teacher portal */}
          <Route path="/teacher" element={<RequireTeacher><TeacherOverviewPage /></RequireTeacher>} />
          <Route path="/teacher/classes" element={<RequireTeacher><TeacherClassesPage /></RequireTeacher>} />
          <Route path="/teacher/classes/:classId" element={<RequireTeacher><TeacherClassDetailPage /></RequireTeacher>} />
          <Route path="/teacher/students" element={<RequireTeacher><TeacherStudentsPage /></RequireTeacher>} />
          <Route path="/teacher/students/:studentId" element={<RequireTeacher><TeacherStudentDetailPage /></RequireTeacher>} />
          {/* Org admin — gated by RequireAdmin (defense-in-depth; backend
              is the authoritative gate via SUPER_ADMIN_USER_IDS) */}
          <Route path="/admin/orgs/:slug" element={<RequireAdmin><OrgOverviewPage /></RequireAdmin>} />
          <Route path="/admin/orgs/:slug/billing" element={<RequireAdmin><OrgBillingPage /></RequireAdmin>} />
          <Route path="/admin/ai-usage" element={<RequireAdmin><AdminAiUsagePage /></RequireAdmin>} />
        </Route>

        {/* AI Tutor routes — gated by VITE_AI_TUTOR_ENABLED feature flag */}
        {import.meta.env.VITE_AI_TUTOR_ENABLED === 'true' && (
          <Route element={<RequireAuth><TutorLayout /></RequireAuth>}>
            <Route path="/ai-tutor" element={<AiTutorHomePage />} />
            <Route path="/ai-tutor/scenarios/:slug/phrasebook" element={<PhrasebookPage />} />
            <Route path="/ai-tutor/scenarios/:slug/briefing" element={<ScenarioBriefingPage />} />
            <Route path="/ai-tutor/scenarios/:slug/session/:sessionId" element={<TutorSessionPage />} />
          </Route>
        )}
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
