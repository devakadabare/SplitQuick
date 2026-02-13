'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import authService from '@/lib/auth';
import { Users, Zap, DollarSign, Check } from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(authService.isAuthenticated());
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, router]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold" style={{ color: 'var(--primary)' }}>
              SplitQuick
            </h1>
            <div className="flex gap-4">
              <Link href="/login" className="btn-secondary">
                Sign In
              </Link>
              <Link href="/register" className="btn-primary">
                Sign Up Free
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="inline-block px-4 py-2 bg-purple-100 rounded-full mb-6">
          <span className="text-purple-700 font-semibold text-sm">
            The ACTUALLY Free Splitwise Alternative
          </span>
        </div>

        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Split Expenses with Friends
          <br />
          <span style={{ color: 'var(--primary)' }}>Unlimited. Forever Free.</span>
        </h1>

        <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-10">
          Track shared expenses, settle debts, and keep friendships money-drama-free.
          No 4-expense limit. No paywalls. Just simple, fast expense splitting.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register" className="btn-primary text-lg px-8 py-4">
            Get Started - It's Free
          </Link>
          <Link href="/login" className="btn-secondary text-lg px-8 py-4">
            Sign In
          </Link>
        </div>

        <p className="text-sm text-gray-500 mt-4">
          No credit card required • Unlimited expenses • Free forever
        </p>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="card text-center">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'var(--primary-light)' }}>
              <Check size={32} className="text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Truly Free
            </h3>
            <p className="text-gray-600">
              Unlimited expenses, forever. No 4-expense limit like Splitwise.
              We use ads instead of paywalls.
            </p>
          </div>

          <div className="card text-center">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'var(--primary-light)' }}>
              <Zap size={32} className="text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Lightning Fast
            </h3>
            <p className="text-gray-600">
              Add an expense in 10 seconds. Balance-first dashboard shows what matters.
              In and out, fast.
            </p>
          </div>

          <div className="card text-center">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ backgroundColor: 'var(--primary-light)' }}>
              <Users size={32} className="text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Guest Friendly
            </h3>
            <p className="text-gray-600">
              Friends don't need accounts to see what they owe. Share a link,
              they're in.
            </p>
          </div>
        </div>
      </section>

      {/* Smart Settlement Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Smart Settlement Simplification
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our algorithm minimizes the number of transactions needed to settle all debts
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="card">
              <h3 className="font-semibold text-lg mb-4 text-gray-700">Complex Debts:</h3>
              <div className="space-y-2 text-gray-600">
                <p>• Alice owes Bob $30</p>
                <p>• Alice owes Carol $20</p>
                <p>• Bob owes Carol $10</p>
                <p>• Carol owes David $40</p>
              </div>
              <p className="mt-4 text-sm text-gray-500 italic">4 separate transactions needed</p>
            </div>

            <div className="card" style={{ backgroundColor: 'var(--primary-light)', color: 'white' }}>
              <h3 className="font-semibold text-lg mb-4">Simplified to:</h3>
              <div className="space-y-2">
                <p>• Alice pays Carol $50</p>
              </div>
              <p className="mt-4 text-sm opacity-90 italic">Just 1 optimized transaction!</p>
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Why Choose SplitQuick?
        </h2>

        <div className="card overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Feature</th>
                <th className="px-6 py-3 text-center text-sm font-semibold" style={{ color: 'var(--primary)' }}>SplitQuick</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">Splitwise</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-6 py-4 text-gray-900">Expense Limit</td>
                <td className="px-6 py-4 text-center font-semibold" style={{ color: 'var(--success)' }}>Unlimited</td>
                <td className="px-6 py-4 text-center font-semibold" style={{ color: 'var(--error)' }}>Only 4 free</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-gray-900">Price</td>
                <td className="px-6 py-4 text-center font-semibold" style={{ color: 'var(--success)' }}>Free (ads)</td>
                <td className="px-6 py-4 text-center font-semibold" style={{ color: 'var(--warning)' }}>Subscription</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-gray-900">Add Expense Speed</td>
                <td className="px-6 py-4 text-center font-semibold" style={{ color: 'var(--success)' }}>10 seconds</td>
                <td className="px-6 py-4 text-center text-gray-600">60+ seconds</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-gray-900">Guest Users</td>
                <td className="px-6 py-4 text-center font-semibold" style={{ color: 'var(--success)' }}>Full support</td>
                <td className="px-6 py-4 text-center text-gray-600">Limited</td>
              </tr>
              <tr>
                <td className="px-6 py-4 text-gray-900">Settlement Simplification</td>
                <td className="px-6 py-4 text-center font-semibold" style={{ color: 'var(--success)' }}>✓</td>
                <td className="px-6 py-4 text-center font-semibold" style={{ color: 'var(--success)' }}>✓</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-purple-600 to-purple-700 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Ready to Split Expenses the Smart Way?
          </h2>
          <p className="text-xl text-purple-100 mb-8">
            Join thousands of users splitting expenses for free
          </p>
          <Link href="/register" className="inline-block bg-white text-purple-700 font-semibold px-8 py-4 rounded-lg hover:bg-gray-100 transition-colors">
            Get Started - It's Free
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p className="mb-2">© 2026 SplitQuick. All rights reserved.</p>
            <p className="text-sm">The ACTUALLY Free Splitwise Alternative</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
