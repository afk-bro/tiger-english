// src/pages/Home.tsx
import { Navigate } from 'react-router-dom';
import { useUserStore } from '@/stores/useUserStore';
import HeroSection from '../components/home/HeroSection';
import FeaturesSection from '../components/home/FeaturesSection';
import FinalCtaSection from '../components/home/FinalCtaSection';

export default function Home() {
  const session = useUserStore((s) => s.session);
  const sessionLoading = useUserStore((s) => s.sessionLoading);

  if (sessionLoading) {
    return (
      <div role="status" className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (session) return <Navigate to="/home" replace />;

  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <FinalCtaSection />
    </>
  );
}
