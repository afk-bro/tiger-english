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

function App() {
  return (
    <Router>
      <AppInitializer />
      <Layout >
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        {/* Future routes: Login, Register, Dashboard, etc. */}
      </Routes>
      </Layout>
    </Router>
  );
}

export default App;
