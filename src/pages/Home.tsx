// src/pages/Home.tsx
import Layout from "../components/Layout";
import { Link } from "react-router-dom";
import {
  BookOpenCheck,
  UserCheck,
  Brain,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import LanguageTest from '../components/LanguageTest';

export default function Home() {

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:from-primary-900/20 dark:via-base-dark dark:to-accent-900/20"></div>
        <div className="relative text-center py-24 md:py-32 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-4 py-2 rounded-full text-sm font-medium mb-8">
              <Sparkles className="w-4 h-4" />
              AI-Powered English Learning
            </div>
            <h1 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight mb-6 bg-gradient-to-r from-primary-600 to-accent-600 bg-clip-text text-transparent">
              Learn English with Confidence
            </h1>
            <p className="text-xl md:text-2xl text-text-light/80 dark:text-text-dark/80 max-w-3xl mx-auto mb-12 leading-relaxed">
              Designed for Thai students and professionals. Build vocabulary,
              improve fluency, and grow your skills with AI-powered tools and
              personalized tutoring.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/register">
                <button className="group bg-gradient-to-r from-accent-500 to-accent-600 hover:from-accent-600 hover:to-accent-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 flex items-center gap-2">
                  Start Learning Today
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <Link to="/about">
                <button className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 px-8 py-4 text-lg font-medium transition-colors">
                  Learn More
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-surface-light dark:bg-surface-dark">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-text-light dark:text-text-dark mb-4">
              Everything You Need to Master English
            </h2>
            <p className="text-xl text-text-light/70 dark:text-text-dark/70 max-w-2xl mx-auto">
              Our comprehensive platform combines cutting-edge AI with proven
              teaching methods
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="group p-8 bg-white dark:bg-base-dark border border-primary-100 dark:border-primary-800/30 rounded-2xl shadow-sm hover:shadow-xl hover:border-primary-200 dark:hover:border-primary-700/50 transition-all duration-300 hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-800 dark:to-primary-700 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <BookOpenCheck className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-2xl font-bold text-text-light dark:text-text-dark mb-4">
                Interactive Flashcards
              </h3>
              <p className="text-text-light/70 dark:text-text-dark/70 leading-relaxed">
                Generate AI-powered vocabulary cards with contextual images,
                audio pronunciation, and personalized definitions tailored to
                your learning style.
              </p>
            </div>

            <div className="group p-8 bg-white dark:bg-base-dark border border-accent-100 dark:border-accent-800/30 rounded-2xl shadow-sm hover:shadow-xl hover:border-accent-200 dark:hover:border-accent-700/50 transition-all duration-300 hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-accent-100 to-accent-200 dark:from-accent-800 dark:to-accent-700 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <UserCheck className="w-8 h-8 text-accent-600 dark:text-accent-400" />
              </div>
              <h3 className="text-2xl font-bold text-text-light dark:text-text-dark mb-4">
                Personalized Tutoring
              </h3>
              <p className="text-text-light/70 dark:text-text-dark/70 leading-relaxed">
                Get one-on-one support from experienced tutors who understand
                Thai learners' unique challenges and adapt to your pace and
                goals.
              </p>
            </div>

            <div className="group p-8 bg-white dark:bg-base-dark border border-success-100 dark:border-success-800/30 rounded-2xl shadow-sm hover:shadow-xl hover:border-success-200 dark:hover:border-success-700/50 transition-all duration-300 hover:-translate-y-2">
              <div className="w-16 h-16 bg-gradient-to-br from-success-100 to-success-200 dark:from-success-800 dark:to-success-700 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Brain className="w-8 h-8 text-success-600 dark:text-success-400" />
              </div>
              <h3 className="text-2xl font-bold text-text-light dark:text-text-dark mb-4">
                AI-Powered Learning
              </h3>
              <p className="text-text-light/70 dark:text-text-dark/70 leading-relaxed">
                Experience intelligent content that adapts to your progress,
                identifies weak areas, and provides targeted exercises for
                maximum improvement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600 via-primary-500 to-accent-500 dark:from-primary-800 dark:via-primary-700 dark:to-accent-700"></div>
        <div className="relative text-center py-24 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Ready to Transform Your English Skills?
            </h2>
            <p className="text-xl text-white/90 max-w-2xl mx-auto mb-12">
              Join thousands of Thai learners who have already improved their
              English with our proven methods and AI-powered tools.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link to="/register">
                <button className="group bg-white text-primary-600 hover:bg-primary-50 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 flex items-center gap-2">
                  Create Your Account
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <Link to="/contact">
                <button className="text-white hover:text-white/80 px-8 py-4 text-lg font-medium border border-white/30 hover:border-white/50 rounded-xl transition-all duration-200">
                  Contact Us
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
