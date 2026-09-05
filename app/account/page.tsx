import React from 'react';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function AccountPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user?.id) {
    redirect('/login?callbackUrl=/account');
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  const [userData, recentOrders] = await Promise.all([
    supabase
      .from('profiles')
      .select('name, email, role, created_at')
      .eq('id', user.id)
      .single(),
    supabase
      .from('orders')
      .select('*, items:order_items(*)')
      .eq('customer_email', user.email!)
      .order('created_at', { ascending: false })
      .limit(5),
  ]);

  const userObj = userData.data;
  const orders = recentOrders.data || [];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="border-b border-gray-200 pb-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black text-gray-900">My Account</h1>
          <p className="text-xs text-gray-500 mt-1">Manage your profile and view your order history.</p>
        </div>
        {profile?.role === 'ADMIN' && (
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
          {(userObj?.name || 'U')[0].toUpperCase()}
        </div>
        <div className="text-xs space-y-1">
          <p className="font-black text-gray-900 text-base">{userObj?.name}</p>
          <p className="text-gray-500">{userObj?.email}</p>
          <p className="text-gray-400">Member since {new Date(userObj?.created_at || Date.now()).toLocaleDateString()}</p>
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase inline-block ${
            userObj?.role === 'ADMIN' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
          }`}>
            {userObj?.role}
          </span>
        </div>
      </div>

      {/* Recent Orders */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-black text-gray-900">Recent Orders</h2>
        </div>

        {orders.length === 0 ? (
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
            {orders.map((o: any) => (
              <div key={o.id} className="bg-white p-5 rounded-xl border border-gray-200 flex items-center justify-between">
                <div className="text-xs space-y-1">
                  <p className="font-mono font-bold text-gray-700 text-[11px]">#{o.id}</p>
                  <p className="font-bold text-gray-900">{o.items?.length || 0} items — Rs. {Number(o.total).toLocaleString()}</p>
                  <p className="text-gray-400">{new Date(o.created_at).toLocaleDateString()}</p>
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
