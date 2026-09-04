import React from 'react';
import Link from 'next/link';
import { prisma } from '@/lib/prisma';

export default async function AdminDashboardPage() {
  // Query total metrics
  const [totalProducts, totalOrders, totalUsers, pendingOrders, recentOrders] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.user.count(),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.order.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    }),
  ]);

  // Compute total revenue
  const completedOrders = await prisma.order.findMany({
    where: { status: { in: ['SHIPPED', 'DELIVERED'] } },
    select: { total: true },
  });

  const totalRevenue = completedOrders.reduce((sum, o) => sum + Number(o.total), 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Admin Control Center</h1>
        <p className="text-xs text-gray-500 mt-1">Real-time metrics, order alerts, and catalog status.</p>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-amber-50 border border-amber-200 p-5 rounded-2xl space-y-1">
          <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Total Revenue</span>
          <div className="text-2xl font-black text-amber-900">Rs. {totalRevenue.toLocaleString()}</div>
        </div>

        <div className="bg-blue-50 border border-blue-200 p-5 rounded-2xl space-y-1">
          <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Total Orders</span>
          <div className="text-2xl font-black text-blue-900">{totalOrders}</div>
        </div>

        <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl space-y-1">
          <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Products Catalog</span>
          <div className="text-2xl font-black text-emerald-900">{totalProducts}</div>
        </div>

        <div className="bg-purple-50 border border-purple-200 p-5 rounded-2xl space-y-1">
          <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">Pending Orders</span>
          <div className="text-2xl font-black text-purple-900">{pendingOrders}</div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/products/new" className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow">
          + Add New Product
        </Link>
        <Link href="/admin/categories" className="px-4 py-2 bg-neutral-900 hover:bg-black text-white font-bold text-xs rounded-lg">
          Manage Categories
        </Link>
        <Link href="/admin/global-forms" className="px-4 py-2 bg-neutral-900 hover:bg-black text-white font-bold text-xs rounded-lg">
          Manage Global Forms
        </Link>
        <Link href="/admin/orders" className="px-4 py-2 bg-neutral-900 hover:bg-black text-white font-bold text-xs rounded-lg">
          Process Orders
        </Link>
      </div>

      {/* Recent Orders Table */}
      <div className="space-y-4 pt-4 border-t border-gray-100">
        <div className="flex justify-between items-center">
          <h2 className="font-black text-gray-900 text-base">Recent Orders</h2>
          <Link href="/admin/orders" className="text-xs font-bold text-amber-700 hover:underline">
            View All Orders ➔
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-100 font-bold text-gray-700">
              <tr>
                <th className="p-3">Order ID</th>
                <th className="p-3">Customer</th>
                <th className="p-3">Total</th>
                <th className="p-3">Status</th>
                <th className="p-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {recentOrders.map((o) => (
                <tr key={o.id} className="hover:bg-gray-50">
                  <td className="p-3 font-mono font-bold text-gray-900 truncate max-w-32">{o.id}</td>
                  <td className="p-3 font-medium text-gray-800">{o.customerName}</td>
                  <td className="p-3 font-black text-gray-900">Rs. {Number(o.total).toLocaleString()}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      o.status === 'DELIVERED' ? 'bg-emerald-100 text-emerald-800' :
                      o.status === 'PENDING' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {o.status}
                    </span>
                  </td>
                  <td className="p-3 text-gray-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
