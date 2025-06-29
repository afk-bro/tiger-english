import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";
import { logoutUser } from "../features/auth/logoutUser";

type Profile = {
  firstName: string;
  lastName: string;
  email?: string;
  // Add more fields later
};

export default function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        toast.error("You must be logged in.");
        navigate("/login");
        return;
      }

      const { user } = session;

      const { data, error } = await supabase
        .from("profiles")
        .select("first_name, last_name, email")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Profile fetch error", error);
        toast.error(`Error loading profile: ${error.message}`);
      } else {
        setProfile({
          firstName: data.first_name,
          lastName: data.last_name,
          email: data.email,
        }); // ✅ sets just the string
      }
    };

    fetchProfile();
  }, [navigate]);

  return (
    <Layout>
      <div className="min-h-screen bg-slate-50 dark:bg-base-dark px-6 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-text-light dark:text-white mb-4">
            {profile?.firstName ? `Welcome, ${profile.firstName}!` : "Loading..."}
          </h1>
          <p className="text-base text-text-light/70 dark:text-text-dark/70">
            This is your dashboard. We’ll add tools and insights here soon.
          </p>
        </div>
      </div>
    </Layout>
  );
}
