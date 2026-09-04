'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { useCart } from '@/components/providers/cart-context';

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session } = useSession();
  const { itemCount, setIsCartOpen } = useCart();
  const [searchQuery, setSearchQuery] = useState('');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shop?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Shop All', href: '/shop' },
    { name: 'Beds', href: '/shop?category=beds' },
    { name: 'Mattresses', href: '/shop?category=mattresses' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
      {/* Announcement Bar */}
      <div className="bg-neutral-900 text-white text-xs py-2 px-4 text-center font-medium">
        ✨ Exclusive Limited Time Sale: Use coupon <span className="bg-amber-500 text-black px-1.5 py-0.5 rounded font-bold">SAVE10</span> for 10% Off Orders over Rs. 10,000!
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tight text-neutral-900">
              LUXE<span className="text-amber-600">HOME</span>
            </span>
          </Link>

          {/* Desktop Search Bar */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex flex-1 max-w-md mx-4">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search luxury beds, mattresses, sofas..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-10 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              <button
                type="submit"
                aria-label="Submit search"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-amber-600"
              >
                🔍
              </button>
            </div>
          </form>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center space-x-6 text-sm font-medium">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={`transition-colors ${
                  pathname === link.href ? 'text-amber-600 font-semibold' : 'text-gray-700 hover:text-amber-600'
                }`}
              >
                {link.name}
              </Link>
            ))}
          </nav>

          {/* User Account & Cart Buttons */}
          <div className="flex items-center gap-4">
            {session?.user ? (
              <div className="relative group">
                <Link
                  href={session.user.role === 'ADMIN' ? '/admin' : '/account'}
                  className="flex items-center gap-1.5 text-sm font-medium text-gray-700 hover:text-amber-600"
                >
                  <span className="w-8 h-8 rounded-full bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-800">
                    {session.user.name?.charAt(0) || 'U'}
                  </span>
                  <span className="hidden sm:inline">{session.user.name?.split(' ')[0]}</span>
                  {session.user.role === 'ADMIN' && (
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded">
                      ADMIN
                    </span>
                  )}
                </Link>

                <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all p-2 text-sm z-50">
                  {session.user.role === 'ADMIN' && (
                    <Link href="/admin" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded">
                      👑 Admin Dashboard
                    </Link>
                  )}
                  <Link href="/account" className="block px-3 py-2 text-gray-700 hover:bg-gray-100 rounded">
                    📦 My Orders & Profile
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="w-full text-left px-3 py-2 text-red-600 hover:bg-red-50 rounded mt-1"
                  >
                    🚪 Sign Out
                  </button>
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="text-sm font-medium text-gray-700 hover:text-amber-600 flex items-center gap-1"
              >
                👤 <span className="hidden sm:inline">Sign In</span>
              </Link>
            )}

            {/* Cart Trigger */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-gray-700 hover:text-amber-600 transition-colors"
              aria-label="Shopping Cart"
            >
              <span className="text-xl">🛒</span>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-amber-600 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                  {itemCount}
                </span>
              )}
            </button>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-700 hover:text-amber-600"
              aria-label="Toggle menu"
            >
              ☰
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white px-4 pt-2 pb-4 space-y-3">
          <form onSubmit={handleSearchSubmit} className="mt-2">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm"
            />
          </form>
          <div className="flex flex-col space-y-2 font-medium text-sm pt-2">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className="py-1.5 text-gray-800 hover:text-amber-600"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </header>
  );
}
