import { useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import Button from '../components/ui/Button';
import FormInput from '../components/ui/FormInput';
import { Mail, Lock, User, ArrowRight } from 'lucide-react';

export default function Register() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <Layout>
      <section className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-50 to-accent-50 dark:from-base-dark dark:to-primary-900/20 px-6 py-20">
        <div className="w-full max-w-md bg-white dark:bg-base-dark border border-primary-100 dark:border-primary-700/40 rounded-2xl shadow-md p-8 space-y-6">
          {/* ... header stuff here ... */}

          <form className="space-y-4">
            <FormInput
              label="First Name"
              icon={<User className="w-5 h-5 text-gray-400 dark:text-gray-500" />}
              value={firstName}
              onChange={setFirstName}
              placeholder="John"
              name="firstName"
            />
            <FormInput
              label="Last Name"
              icon={<User className="w-5 h-5 text-gray-400 dark:text-gray-500" />}
              value={lastName}
              onChange={setLastName}
              placeholder="Doe"
              name="lastName"
            />
            <FormInput
              label="Email"
              icon={<Mail className="w-5 h-5 text-gray-400 dark:text-gray-500" />}
              type="email"
              value={email}
              onChange={setEmail}
              placeholder="you@example.com"
              name="email"
            />
            <FormInput
              label="Password"
              icon={<Lock className="w-5 h-5 text-gray-400 dark:text-gray-500" />}
              type="password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              name="password"
            />

            <Button type="submit" variant="primary" iconRight={<ArrowRight />} className="w-full">
              Sign Up
            </Button>
          </form>

          {/* ... login link ... */}
        </div>
      </section>
    </Layout>
  );
}
