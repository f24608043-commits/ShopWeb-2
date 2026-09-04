'use client';

import React, { useState } from 'react';

const STATUS_OPTIONS = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

export function AdminOrdersClient({ orders: initialOrders }: { orders: any[] }) {
  const [orders, setOrders] = useState(initialOrders);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setOrders((prev) =>
          prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o)
        );
      }
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs border border-gray-200 rounded-xl overflow-hidden">
        <thead className="bg-neutral-900 text-white font-bold">
          <tr>
            <th className="p-3">Order ID</th>
            <th className="p-3">Customer</th>
            <th className="p-3">City</th>
            <th className="p-3">Items</th>
            <th className="p-3">Total</th>
            <th className="p-3">Status</th>
            <th className="p-3">Date</th>
            <th className="p-3">Update Status</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {orders.map((o) => (
            <tr key={o.id} className="hover:bg-gray-50 text-xs">
              <td className="p-3 font-mono font-bold text-gray-700 text-[10px] max-w-24 truncate">{o.id.slice(0, 8)}...</td>
              <td className="p-3">
                <div className="font-bold text-gray-900">{o.customerName}</div>
                <div className="text-gray-400">{o.customerEmail}</div>
              </td>
              <td className="p-3 text-gray-600">{o.city}</td>
              <td className="p-3 font-bold text-gray-900">{o.items?.length || 0} items</td>
              <td className="p-3 font-black text-gray-900">Rs. {Number(o.total).toLocaleString()}</td>
              <td className="p-3">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                  o.status === 'DELIVERED'  ? 'bg-emerald-100 text-emerald-800' :
                  o.status === 'SHIPPED'    ? 'bg-blue-100 text-blue-800' :
                  o.status === 'PROCESSING' ? 'bg-purple-100 text-purple-800' :
                  o.status === 'CANCELLED'  ? 'bg-red-100 text-red-800' :
                  'bg-amber-100 text-amber-800'
                }`}>
                  {o.status}
                </span>
              </td>
              <td className="p-3 text-gray-400">{new Date(o.createdAt).toLocaleDateString()}</td>
              <td className="p-3">
                <div className="flex items-center gap-1">
                  <select
                    defaultValue={o.status}
                    id={`status-${o.id}`}
                    className="px-2 py-1 text-[10px] border border-gray-300 rounded bg-white font-bold"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <button
                    disabled={updatingId === o.id}
                    onClick={() => {
                      const sel = document.getElementById(`status-${o.id}`) as HTMLSelectElement;
                      handleStatusUpdate(o.id, sel.value);
                    }}
                    className="px-2 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[10px] rounded disabled:opacity-50"
                  >
                    {updatingId === o.id ? '...' : 'Save'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
