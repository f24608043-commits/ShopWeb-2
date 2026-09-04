'use client';

import React, { useState } from 'react';
import Link from 'next/link';

export function Footer() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    try {
      const res = await fetch('/api/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();

      if (res.ok) {
        setStatus('✅ Thank you for subscribing!');
        setEmail('');
      } else {
        setStatus(`❌ ${data.error || 'Failed to subscribe'}`);
      }
    } catch {
      setStatus('❌ Network error. Please try again.');
    }
  };

  return (
    <footer className="bg-neutral-900 text-gray-300 text-sm mt-16 border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Brand & Description */}
          <div className="space-y-4">
            <Link href="/" className="text-2xl font-black text-white tracking-tight">
              LUXE<span className="text-amber-500">HOME</span>
            </Link>
            <p className="text-xs text-gray-400 leading-relaxed">
              Crafting premium luxury bed frames, mattresses, and bespoke furniture with uncompromising quality, artisan craftsmanship, and nationwide delivery.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-white font-bold text-base mb-3">Shop Catalog</h3>
            <ul className="space-y-2 text-xs">
              <li><Link href="/shop" className="hover:text-amber-400">All Products</Link></li>
              <li><Link href="/shop?category=beds" className="hover:text-amber-400">Upholstered Beds</Link></li>
              <li><Link href="/shop?category=chesterfield-beds" className="hover:text-amber-400">Chesterfield Beds</Link></li>
              <li><Link href="/shop?category=mattresses" className="hover:text-amber-400">Orthopedic Mattresses</Link></li>
            </ul>
          </div>

          {/* Company & Support */}
          <div>
            <h3 className="text-white font-bold text-base mb-3">Customer Support</h3>
            <ul className="space-y-2 text-xs">
              <li><Link href="/contact" className="hover:text-amber-400">Contact Us</Link></li>
              <li><Link href="/blog" className="hover:text-amber-400">Buying Guides & Blog</Link></li>
              <li><Link href="/account/orders" className="hover:text-amber-400">Track Order</Link></li>
              <li><Link href="/admin" className="hover:text-amber-400 font-semibold text-amber-500">👑 Admin Portal</Link></li>
            </ul>
          </div>

          {/* Newsletter Signup */}
          <div className="space-y-3">
            <h3 className="text-white font-bold text-base">Newsletter</h3>
            <p className="text-xs text-gray-400">Subscribe for exclusive discount coupons, new product releases, and design trends.</p>
            <form onSubmit={handleSubscribe} className="flex flex-col gap-2">
              <input
                type="email"
                placeholder="Enter your email..."
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-neutral-800 border border-neutral-700 rounded text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                required
              />
              <button
                type="submit"
                className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded transition-colors"
              >
                Subscribe Now
              </button>
            </form>
            {status && <p className="text-xs font-medium mt-1">{status}</p>}
          </div>

        </div>

        <div className="border-t border-neutral-800 mt-10 pt-6 text-center text-xs text-gray-500">
          © {new Date().getFullYear()} LUXEHOME Furniture Inc. All rights reserved. Built with Next.js App Router & PostgreSQL.
        </div>
      </div>
    </footer>
  );
}
