// src/pages/Home.tsx
import Layout from '../components/Layout';
import HeroSection from '../components/home/HeroSection';
import FeaturesSection from '../components/home/FeaturesSection';
import FinalCtaSection from '../components/home/FinalCtaSection';

export default function Home() {
  return (
    <Layout>
      <HeroSection />
      <FeaturesSection />
      <FinalCtaSection />
    </Layout>
  );
}

