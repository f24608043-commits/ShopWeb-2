'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { signIn } from 'next-auth/react';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        // Auto sign-in after registration
        await signIn('credentials', {
          email: formData.email,
          password: formData.password,
          redirect: false,
        });
        router.push('/account');
      } else {
        setError(data.error || 'Registration failed.');
      }
    } catch {
      setError('Network error registering account.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-gray-900">Create an Account</h1>
        <p className="text-xs text-gray-500">Sign up for order tracking & faster checkouts.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-8 rounded-2xl border border-gray-200 space-y-4 shadow-sm text-xs">
        <div>
          <label className="font-bold text-gray-700 block mb-1">Full Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="font-bold text-gray-700 block mb-1">Email Address *</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="font-bold text-gray-700 block mb-1">Password *</label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="font-bold text-gray-700 block mb-1">Confirm Password *</label>
          <input
            type="password"
            value={formData.confirmPassword}
            onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        {error && <p className="text-xs text-red-600 font-bold bg-red-50 p-2.5 rounded-lg">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow"
        >
          {loading ? 'Creating Account...' : 'Register Account ➔'}
        </button>
      </form>

      <p className="text-center text-xs text-gray-500">
        Already have an account?{' '}
        <Link href="/login" className="text-amber-700 font-bold hover:underline">
          Sign In Here
        </Link>
      </p>
    </div>
  );
}
