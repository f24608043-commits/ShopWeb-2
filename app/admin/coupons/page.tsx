'use client';

import React, { useState, useEffect } from 'react';

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'PERCENTAGE',
    discountValue: 10,
    minOrderValue: 0,
    usageLimit: 100,
    expiresAt: '',
  });
  const [status, setStatus] = useState<string | null>(null);

  const fetchCoupons = async () => {
    const res = await fetch('/api/coupons');
    const data = await res.json();
    setCoupons(Array.isArray(data) ? data : []);
  };

  useEffect(() => { fetchCoupons(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    try {
      const res = await fetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          discountValue: Number(formData.discountValue),
          minOrderValue: Number(formData.minOrderValue),
          usageLimit: Number(formData.usageLimit),
          expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('✅ Coupon created!');
        setFormData({ code: '', discountType: 'PERCENTAGE', discountValue: 10, minOrderValue: 0, usageLimit: 100, expiresAt: '' });
        fetchCoupons();
      } else {
        setStatus(`❌ ${data.error}`);
      }
    } catch { setStatus('❌ Network error.'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this coupon?')) return;
    await fetch(`/api/coupons/${id}`, { method: 'DELETE' });
    fetchCoupons();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Coupon & Promo Code Management</h1>
        <p className="text-xs text-gray-500 mt-0.5">Create and manage discount coupons for your storefront.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* Create Coupon Form */}
        <form onSubmit={handleCreate} className="md:col-span-2 bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-3 text-xs h-fit">
          <h2 className="font-bold text-gray-900 text-sm">Create Coupon</h2>

          <div>
            <label className="font-bold text-gray-700 block mb-1">Coupon Code *</label>
            <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })} required placeholder="e.g. SAVE10" className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white font-mono font-bold uppercase" />
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">Discount Type *</label>
            <select value={formData.discountType} onChange={(e) => setFormData({ ...formData, discountType: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white font-bold">
              <option value="PERCENTAGE">Percentage (%) Off</option>
              <option value="FIXED">Fixed Amount (Rs.) Off</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-gray-700 block mb-1">
                {formData.discountType === 'PERCENTAGE' ? 'Discount %' : 'Rs. Off'} *
              </label>
              <input type="number" value={formData.discountValue} onChange={(e) => setFormData({ ...formData, discountValue: Number(e.target.value) })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white font-bold" />
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">Min Order (Rs.)</label>
              <input type="number" value={formData.minOrderValue} onChange={(e) => setFormData({ ...formData, minOrderValue: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Usage Limit</label>
              <input type="number" value={formData.usageLimit} onChange={(e) => setFormData({ ...formData, usageLimit: Number(e.target.value) })} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white" />
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">Expiry Date</label>
              <input type="date" value={formData.expiresAt} onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white" />
            </div>
          </div>

          <button type="submit" className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow">Create Coupon ➔</button>
          {status && <p className="text-xs font-bold text-center">{status}</p>}
        </form>

        {/* Coupons Table */}
        <div className="md:col-span-3 overflow-x-auto">
          <table className="w-full text-left text-xs border border-gray-200 rounded-xl overflow-hidden">
            <thead className="bg-neutral-900 text-white font-bold">
              <tr>
                <th className="p-3">Code</th>
                <th className="p-3">Discount</th>
                <th className="p-3">Min Order</th>
                <th className="p-3">Used / Limit</th>
                <th className="p-3">Expires</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {coupons.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="p-3 font-mono font-black text-amber-700">🎟️ {c.code}</td>
                  <td className="p-3 font-bold text-gray-900">
                    {c.discountType === 'PERCENTAGE' ? `${c.discountValue}% off` : `Rs. ${Number(c.discountValue).toLocaleString()} off`}
                  </td>
                  <td className="p-3 text-gray-600">Rs. {Number(c.minOrderValue).toLocaleString()}</td>
                  <td className="p-3">
                    <span className="font-bold text-gray-900">{c.usedCount}</span>
                    <span className="text-gray-400"> / {c.usageLimit || '∞'}</span>
                  </td>
                  <td className="p-3 text-gray-500">
                    {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString() : '—'}
                  </td>
                  <td className="p-3">
                    <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:underline font-bold">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
