// src/pages/Home.tsx
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <section className="text-center py-24 px-6 bg-yellow-200">
        <h1 className="text-5xl font-extrabold mb-4">Gain English</h1>
        <p className="text-xl mb-8">
          English learning tools for Thai students and professionals — powered by AI.
        </p>
        <Link to="/register">
          <button className="bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition">
            Start Learning
          </button>
        </Link>
      </section>

      <section className="py-20 px-6 max-w-5xl mx-auto grid md:grid-cols-3 gap-10 text-center">
        <div>
          <h3 className="text-xl font-semibold mb-2">🔤 Interactive Flashcards</h3>
          <p>Create your own cards powered by AI-generated images and definitions.</p>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">👨‍🏫 Personalized Tutoring</h3>
          <p>Book 1-on-1 sessions tailored to your learning goals and fluency level.</p>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">🤖 AI-Powered Learning</h3>
          <p>Use smart tools to build vocabulary, track progress, and stay engaged.</p>
        </div>
      </section>

      <section className="bg-yellow-100 text-center py-16">
        <p className="text-lg mb-4">Ready to improve your English?</p>
        <Link to="/register">
          <button className="bg-black text-white px-6 py-3 rounded-md hover:bg-gray-800 transition">
            Create Your Account
          </button>
        </Link>
      </section>
    </main>
  );
}
