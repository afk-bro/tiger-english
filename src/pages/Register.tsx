// src/pages/Register.tsx
import { useState } from 'react';
import Layout from '../components/Layout';
import { Link } from 'react-router-dom';
import { UserPlus, Mail, Lock, ArrowRight } from 'lucide-react';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <Layout>
      <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50 dark:from-base-dark dark:to-primary-900/20 px-6 py-20">
        <div className="w-full max-w-md bg-white dark:bg-base-dark border border-primary-100 dark:border-primary-700/40 rounded-2xl shadow-md p-8 space-y-6">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl mb-4">
              <UserPlus className="text-white w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold text-text-light dark:text-text-dark">Create Your Account</h2>
            <p className="text-sm text-text-light/70 dark:text-text-dark/70 mt-2">
              Join Gain English and start mastering English with AI tools and real tutors.
            </p>
          </div>

          <form className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1 text-text-light dark:text-text-dark">
                Email
              </label>
              <div className="flex items-center border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-base-dark">
                <div className="px-3">
                  <Mail className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-transparent text-text-light dark:text-text-dark placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
                  placeholder="you@example.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium block mb-1 text-text-light dark:text-text-dark">
                Password
              </label>
              <div className="flex items-center border border-gray-300 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-base-dark">
                <div className="px-3">
                  <Lock className="w-5 h-5 text-gray-400 dark:text-gray-500" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-transparent text-text-light dark:text-text-dark placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white py-3 px-4 rounded-lg text-lg font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all duration-200"
            >
              Sign Up
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          <p className="text-sm text-center text-text-light/70 dark:text-text-dark/70">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 dark:text-primary-400 font-medium hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </section>
    </Layout>
  );
}
