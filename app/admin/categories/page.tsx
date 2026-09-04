'use client';

import React, { useState, useEffect } from 'react';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [parentCategoryId, setParentCategoryId] = useState('');
  const [status, setStatus] = useState<string | null>(null);

  const fetchCategories = async () => {
    const res = await fetch('/api/categories');
    const data = await res.json();
    setCategories(Array.isArray(data) ? data : []);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setName(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, ''));
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus(null);

    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          slug,
          parentCategoryId: parentCategoryId || null,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setStatus('✅ Category created successfully!');
        setName('');
        setSlug('');
        setParentCategoryId('');
        fetchCategories();
      } else {
        setStatus(`❌ ${data.error || 'Failed to create category'}`);
      }
    } catch {
      setStatus('❌ Network error creating category.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this category?')) return;
    await fetch(`/api/categories/${id}`, { method: 'DELETE' });
    fetchCategories();
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Category & Subcategory Management</h1>
        <p className="text-xs text-gray-500 mt-0.5">Manage hierarchical category tree and subcategories.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Create Category Form */}
        <form onSubmit={handleCreateCategory} className="bg-gray-50 p-5 rounded-2xl border border-gray-200 space-y-3 text-xs h-fit">
          <h2 className="font-bold text-gray-900 text-sm">Add Category / Subcategory</h2>

          <div>
            <label className="font-bold text-gray-700 block mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={handleNameChange}
              required
              placeholder="e.g. Ottoman Beds"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
            />
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">URL Slug *</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white font-mono"
            />
          </div>

          <div>
            <label className="font-bold text-gray-700 block mb-1">Parent Category (Optional for Subcategory)</label>
            <select
              value={parentCategoryId}
              onChange={(e) => setParentCategoryId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white font-medium"
            >
              <option value="">None (Top-Level Category)</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>📁 {c.name}</option>
              ))}
            </select>
          </div>

          <button type="submit" className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow">
            Create Category ➔
          </button>

          {status && <p className="text-xs font-bold text-center mt-2">{status}</p>}
        </form>

        {/* Category Tree Table */}
        <div className="md:col-span-2 space-y-4">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border border-gray-200 rounded-xl overflow-hidden">
              <thead className="bg-neutral-900 text-white font-bold">
                <tr>
                  <th className="p-3">Category Name</th>
                  <th className="p-3">Slug</th>
                  <th className="p-3">Products Count</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {categories.map((c) => (
                  <React.Fragment key={c.id}>
                    <tr className="bg-gray-50/80 font-bold text-gray-900">
                      <td className="p-3">📁 {c.name}</td>
                      <td className="p-3 font-mono text-gray-500">{c.slug}</td>
                      <td className="p-3">{c._count?.products || 0} products</td>
                      <td className="p-3">
                        <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:underline">Delete</button>
                      </td>
                    </tr>
                    {c.subcategories && c.subcategories.map((sub: any) => (
                      <tr key={sub.id} className="hover:bg-gray-50 text-gray-700">
                        <td className="p-3 pl-8">↳ {sub.name}</td>
                        <td className="p-3 font-mono text-gray-400">{sub.slug}</td>
                        <td className="p-3">{sub._count?.products || 0} products</td>
                        <td className="p-3">
                          <button onClick={() => handleDelete(sub.id)} className="text-red-600 hover:underline">Delete</button>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
