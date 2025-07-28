import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
    return (_jsxs(Router, { children: [_jsx(AppInitializer, {}), _jsx(Layout, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/", element: _jsx(Home, {}) }), _jsx(Route, { path: "/register", element: _jsx(Register, {}) }), _jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsx(Route, { path: "/about", element: _jsx(About, {}) }), _jsx(Route, { path: "/contact", element: _jsx(Contact, {}) }), _jsx(Route, { path: "/flashcard-test", element: _jsx(FlashcardTest, {}) }), _jsx(Route, { path: "/flashcards", element: _jsx(FlashcardsPage, {}) }), _jsx(Route, { path: "/u/:username", element: _jsx(UserLayout, {}), children: _jsx(Route, { index: true, element: _jsx(Dashboard, {}) }) })] }) })] }));
}
export default App;
