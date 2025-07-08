// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Register from "@/pages/Register";
import Login from "@/pages/Login";
import Dashboard from "./pages/Dashboard";
import AppInitializer from "./components/AppInitiazlier";
import Layout from "./components/Layout";
import About from "./pages/About";
import Contact from "./pages/Contact";
import UserLayout from "@/routes/UserLayout";
import FlashcardTest from "./pages/FlashcardTest";
import FlashcardsPage from "./pages/FlashcardsPage";

function App() {
  return (
    <Router>
      <AppInitializer />
      <Layout>
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
      </Layout>
    </Router>
  );
}

export default App;
