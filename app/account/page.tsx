import React from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export default async function AccountPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/account');
  }

  const [user, recentOrders] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, role: true, createdAt: true },
    }),
    prisma.order.findMany({
      where: { customerEmail: session.user.email! },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { items: true },
    }),
  ]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="border-b border-gray-200 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-900">My Account</h1>
          <p className="text-xs text-gray-500 mt-1">Manage your profile and view your order history.</p>
        </div>
        {session.user.role === 'ADMIN' && (
          <Link
            href="/admin"
            className="px-5 py-2.5 bg-neutral-900 text-white font-bold text-xs rounded-xl shadow"
          >
            👑 Admin Dashboard
          </Link>
        )}
      </div>

      {/* Profile Summary Card */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm flex items-center gap-5">
        <div className="w-16 h-16 bg-amber-600 rounded-full flex items-center justify-center text-2xl text-white font-black shrink-0">
          {(user?.name || 'U')[0].toUpperCase()}
        </div>
        <div className="text-xs space-y-1">
          <p className="font-black text-gray-900 text-base">{user?.name}</p>
          <p className="text-gray-500">{user?.email}</p>
          <p className="text-gray-400">Member since {new Date(user?.createdAt || Date.now()).toLocaleDateString()}</p>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase inline-block ${
            user?.role === 'ADMIN' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
          }`}>
            {user?.role}
          </span>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-black text-gray-900">Recent Orders</h2>
        </div>

        {recentOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-3">
            <span className="text-4xl block">📦</span>
            <h3 className="font-bold text-gray-800">No orders yet</h3>
            <p className="text-xs text-gray-500">Start shopping to see your order history here.</p>
            <Link href="/shop" className="inline-block mt-2 px-6 py-2.5 bg-amber-600 text-white font-bold text-xs rounded-full">
              Browse Shop
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((o) => (
              <div key={o.id} className="bg-white p-5 rounded-xl border border-gray-200 flex items-center justify-between">
                <div className="text-xs space-y-1">
                  <p className="font-mono font-bold text-gray-700 text-[11px]">#{o.id}</p>
                  <p className="font-bold text-gray-900">{o.items.length} items — Rs. {Number(o.total).toLocaleString()}</p>
                  <p className="text-gray-400">{new Date(o.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    o.status === 'DELIVERED'  ? 'bg-emerald-100 text-emerald-800' :
                    o.status === 'SHIPPED'    ? 'bg-blue-100 text-blue-800' :
                    o.status === 'CANCELLED'  ? 'bg-red-100 text-red-800' :
                    'bg-amber-100 text-amber-800'
                  }`}>
                    {o.status}
                  </span>
                  <Link href={`/order-confirmation/${o.id}`} className="text-xs font-bold text-amber-700 hover:underline">
                    View ➔
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
