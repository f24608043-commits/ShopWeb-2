'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError('Invalid email or password credentials.');
      setLoading(false);
    } else {
      router.push('/account');
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-black text-gray-900">Sign In to LUXEHOME</h1>
        <p className="text-xs text-gray-500">Enter your credentials to access your account & orders.</p>
      </div>

      {/* Demo Credentials Box */}
      <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-xs text-amber-900 space-y-1">
        <p className="font-bold">👑 Admin Credentials:</p>
        <p>Email: <code className="font-mono bg-amber-100 px-1 rounded">alexabraham587@gmail.com</code></p>
        <p>Password: <code className="font-mono bg-amber-100 px-1 rounded">Qasim.11</code></p>
      </div>

      <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl border border-gray-200 space-y-4 shadow-sm text-xs">
        <div>
          <label className="font-bold text-gray-700 block mb-1">Email Address *</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="font-bold text-gray-700 block mb-1">Password *</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
          {loading ? 'Signing In...' : 'Sign In ➔'}
        </button>
      </form>

      <p className="text-center text-xs text-gray-500">
        Don't have an account?{' '}
        <Link href="/register" className="text-amber-700 font-bold hover:underline">
          Register Here
        </Link>
      </p>
    </div>
  );
}
