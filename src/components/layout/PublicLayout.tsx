// src/components/layout/PublicLayout.tsx
import { Outlet } from 'react-router-dom';
import Header from '../Header';
import Footer from '../Footer';

export default function PublicLayout() {
  return (
    <div className="min-h-screen flex flex-col bg-base-light text-text-light dark:bg-base-dark dark:text-text-dark transition-colors duration-300 font-sans">
      <Header />
      <main className="flex-1"><Outlet /></main>
      <Footer />
    </div>
  );
}
