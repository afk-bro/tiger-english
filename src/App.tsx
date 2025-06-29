// src/App.tsx
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import Register from "@/pages/Register";
import Login from "@/pages/Login";
import Dashboard from "./pages/Dashboard";
import AppInitializer from "./components/AppInitiazlier";
import Layout from "./components/Layout";

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
        {/* Future routes: Login, Register, Dashboard, etc. */}
      </Routes>
      </Layout>
    </Router>
  );
}

export default App;
