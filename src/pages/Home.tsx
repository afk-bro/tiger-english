// src/pages/Home.tsx
import { Link } from 'react-router-dom';
import DarkModeToggle from '../components/DarkModeToggle';

export default function Home() {
  return (
    <main className="min-h-screen bg-base-light text-text-light dark:bg-base-dark dark:text-text-dark transition-colors duration-300">
      <header className="flex justify-between items-center px-6 py-4">
        <h1 className="text-2xl font-bold">Gain English</h1>
        <DarkModeToggle />
      </header>

      <section className="text-center py-24 px-6 bg-primary-light dark:bg-primary-dark">
        <h2 className="text-5xl font-extrabold mb-4">Learn English with Confidence</h2>
        <p className="text-xl mb-8 max-w-2xl mx-auto">
          Designed for Thai students and professionals. Build vocabulary, improve fluency, and grow your skills with AI-powered tools and tutoring.
        </p>
        <Link to="/register">
          <button className="bg-accent-dark text-white px-6 py-3 rounded-md hover:bg-accent transition">
            Start Learning
          </button>
        </Link>
      </section>

      <section className="py-20 px-6 max-w-5xl mx-auto grid md:grid-cols-3 gap-10 text-center">
        <div>
          <h3 className="text-xl font-semibold mb-2">🔤 Interactive Flashcards</h3>
          <p>Generate AI-backed vocabulary cards with images and definitions.</p>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">👨‍🏫 Personalized Tutoring</h3>
          <p>Get one-on-one support tailored to your level and goals.</p>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">🤖 AI-Powered Learning</h3>
          <p>Engage smarter with content that adapts to your progress.</p>
        </div>
      </section>

      <section className="bg-primary-light dark:bg-primary-dark text-center py-16">
        <p className="text-lg mb-4">Ready to level up your English?</p>
        <Link to="/register">
          <button className="bg-accent-dark text-white px-6 py-3 rounded-md hover:bg-accent transition">
            Create Your Account
          </button>
        </Link>
      </section>
    </main>
  );
}
