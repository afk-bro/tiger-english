import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUserStore } from "@/stores/useUserStore";

export default function Dashboard() {
  const { profile, loading } = useUserStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !profile) {
      navigate("/login");
    }
  }, [loading, profile, navigate]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-base-dark px-6 py-16">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-text-light dark:text-white mb-4">
          {loading
            ? "Loading..."
            : profile
            ? `Welcome, ${profile.first_name}!`
            : "Welcome!"}
        </h1>
        <p className="text-base text-text-light/70 dark:text-text-dark/70">
          This is your dashboard. We’ll add tools and insights here soon.
        </p>
      </div>
    </div>
  );
}
