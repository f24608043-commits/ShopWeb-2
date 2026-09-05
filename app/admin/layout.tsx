import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Server-side protection
  if (!user) {
    redirect('/login?callbackUrl=/admin');
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'ADMIN') {
    return (
      <div className="text-center py-24 space-y-4 max-w-md mx-auto">
        <span className="text-5xl block">⛔</span>
        <h1 className="text-2xl font-black text-gray-900">Access Denied</h1>
        <p className="text-xs text-gray-500">You must be logged in as an administrator to access the Admin Dashboard.</p>
        <Link href="/" className="inline-block px-6 py-2 bg-amber-600 text-white font-bold text-xs rounded-full">
          Return to Storefront
        </Link>
      </div>
    );
  }

  const adminNav = [
    { name: 'Dashboard', href: '/admin', icon: '📊' },
    { name: 'Products', href: '/admin/products', icon: '📦' },
    { name: 'Categories', href: '/admin/categories', icon: '📁' },
    { name: 'Brands', href: '/admin/brands', icon: '🏷️' },
    { name: 'Global Forms', href: '/admin/global-forms', icon: '⚙️' },
    { name: 'Orders', href: '/admin/orders', icon: '🛒' },
    { name: 'Coupons', href: '/admin/coupons', icon: '🎟️' },
    { name: 'Reviews', href: '/admin/reviews', icon: '⭐' },
    { name: 'Blog', href: '/admin/blog', icon: '✍️' },
    { name: 'Subscribers', href: '/admin/subscribers', icon: '✉️' },
    { name: 'Store Settings', href: '/admin/settings', icon: '⚙️' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 py-4">
      {/* Admin Sidebar Navigation */}
      <aside className="lg:col-span-1 bg-neutral-900 text-white p-5 rounded-2xl space-y-6 h-fit">
        <div>
          <span className="text-xs font-bold text-amber-500 uppercase tracking-widest block">ADMIN PORTAL</span>
          <h2 className="text-lg font-black text-white">Store Control</h2>
        </div>

        <nav className="space-y-1 text-xs font-medium">
          {adminNav.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-neutral-800 text-gray-300 hover:text-white transition-colors"
            >
              <span>{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          ))}
        </nav>

        <div className="pt-4 border-t border-neutral-800 text-[11px] text-gray-400 space-y-1">
          <p className="font-bold text-gray-300">Signed in as:</p>
          <p className="truncate text-amber-400">{user.email}</p>
          <Link href="/" className="inline-block text-xs font-bold text-gray-300 hover:text-white pt-2">
            ← View Customer Storefront
          </Link>
        </div>
      </aside>

      {/* Main Admin Dashboard Content */}
      <main className="lg:col-span-4 bg-white p-8 rounded-2xl border border-gray-200 shadow-sm min-h-[500px]">
        {children}
      </main>
    </div>
  );
}
