'use client';

import React, { useState, useEffect } from 'react';

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const fetchBrands = async () => {
    const res = await fetch('/api/brands');
    const data = await res.json();
    setBrands(Array.isArray(data) ? data : []);
  };

  useEffect(() => { fetchBrands(); }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);
    try {
      const res = await fetch('/api/brands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, slug, logoUrl: logoUrl || null }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('✅ Brand created!');
        setName(''); setSlug(''); setLogoUrl('');
        fetchBrands();
      } else {
        setStatus(`❌ ${data.error}`);
      }
    } catch { setStatus('❌ Network error.'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this brand?')) return;
    await fetch(`/api/brands/${id}`, { method: 'DELETE' });
    fetchBrands();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Brand Management</h1>
        <p className="text-xs text-gray-500 mt-0.5">Add and manage furniture brands.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <form onSubmit={handleCreate} className="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-3 text-xs h-fit">
          <h2 className="font-bold text-gray-900 text-sm">Add Brand</h2>
          <div>
            <label className="font-bold text-gray-700 block mb-1">Brand Name *</label>
            <input type="text" value={name} onChange={handleNameChange} required placeholder="e.g. LuxeSleep" className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white" />
          </div>
          <div>
            <label className="font-bold text-gray-700 block mb-1">Slug *</label>
            <input type="text" value={slug} onChange={(e) => setSlug(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white font-mono" />
          </div>
          <div>
            <label className="font-bold text-gray-700 block mb-1">Logo Image URL</label>
            <input type="url" value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://..." className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white" />
          </div>
          <button type="submit" className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow">Create Brand ➔</button>
          {status && <p className="text-xs font-bold text-center">{status}</p>}
        </form>

        <div className="md:col-span-2">
          <table className="w-full text-left text-xs border border-gray-200 rounded-xl overflow-hidden">
            <thead className="bg-neutral-900 text-white font-bold">
              <tr>
                <th className="p-3">Brand Name</th>
                <th className="p-3">Slug</th>
                <th className="p-3">Products</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {brands.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50">
                  <td className="p-3 font-bold text-gray-900">🏷️ {b.name}</td>
                  <td className="p-3 font-mono text-gray-500">{b.slug}</td>
                  <td className="p-3">{b._count?.products || 0}</td>
                  <td className="p-3">
                    <button onClick={() => handleDelete(b.id)} className="text-red-600 hover:underline font-bold">Delete</button>
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
