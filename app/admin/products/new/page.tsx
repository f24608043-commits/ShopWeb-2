'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [globalForms, setGlobalForms] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    shortDescription: '',
    basePrice: 0,
    originalPrice: 0,
    categoryId: '',
    brandId: '',
    productType: 'SIMPLE',
    stock: 10,
    globalFormId: '',
    imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=800',
  });

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch('/api/categories').then((r) => r.json()),
      fetch('/api/brands').then((r) => r.json()),
      fetch('/api/global-forms').then((r) => r.json()),
    ]).then(([c, b, g]) => {
      setCategories(Array.isArray(c) ? c : []);
      setBrands(Array.isArray(b) ? b : []);
      setGlobalForms(Array.isArray(g) ? g : []);
    });
  }, []);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const generatedSlug = val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
    setFormData({ ...formData, name: val, slug: generatedSlug });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      // 1. Create Base Product
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          slug: formData.slug,
          description: formData.description,
          shortDescription: formData.shortDescription,
          basePrice: Number(formData.basePrice),
          originalPrice: formData.originalPrice ? Number(formData.originalPrice) : null,
          categoryId: formData.categoryId || null,
          brandId: formData.brandId || null,
          productType: formData.productType,
          stock: formData.productType === 'SIMPLE' ? Number(formData.stock) : null,
          globalFormId: formData.globalFormId || null,
          images: [{ url: formData.imageUrl, altText: formData.name, order: 1 }],
        }),
      });

      const newProduct = await res.json();

      if (!res.ok) {
        setStatus(`❌ ${newProduct.error || 'Failed to create product'}`);
        setLoading(false);
        return;
      }

      // 2. If Variable product & Global Form selected, auto generate variations
      if (formData.productType === 'VARIABLE' && formData.globalFormId) {
        setStatus('⚙️ Product created. Generating Cartesian variation grid...');
        const genRes = await fetch(`/api/products/${newProduct.id}/variations/generate`, {
          method: 'POST',
        });
        const genData = await genRes.json();

        if (genRes.ok) {
          setStatus(`🎉 Success! Product & ${genData.totalGenerated} variations created.`);
          setTimeout(() => router.push('/admin/products'), 1500);
        } else {
          setStatus(`⚠️ Product created, but variation generation error: ${genData.error}`);
        }
      } else {
        setStatus('🎉 Product created successfully!');
        setTimeout(() => router.push('/admin/products'), 1500);
      }
    } catch {
      setStatus('❌ Network error creating product.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="border-b border-gray-100 pb-3">
        <h1 className="text-2xl font-black text-gray-900">Create New Product</h1>
        <p className="text-xs text-gray-500">Step-by-step product creation with global forms & variation generator.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="font-bold text-gray-700 block mb-1">Product Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={handleNameChange}
            required
            placeholder="e.g. Chesterfield Luxury Velvet Bed"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="font-bold text-gray-700 block mb-1">URL Slug *</label>
          <input
            type="text"
            value={formData.slug}
            onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono bg-gray-50"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-gray-700 block mb-1">Base Price (Rs.) *</label>
            <input
              type="number"
              value={formData.basePrice}
              onChange={(e) => setFormData({ ...formData, basePrice: Number(e.target.value) })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-bold text-gray-900"
            />
          </div>
          <div>
            <label className="font-bold text-gray-700 block mb-1">Original Price (Crossed Out)</label>
            <input
              type="number"
              value={formData.originalPrice}
              onChange={(e) => setFormData({ ...formData, originalPrice: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="font-bold text-gray-700 block mb-1">Category</label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
            >
              <option value="">Select Category...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-bold text-gray-700 block mb-1">Brand</label>
            <select
              value={formData.brandId}
              onChange={(e) => setFormData({ ...formData, brandId: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
            >
              <option value="">Select Brand...</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="font-bold text-gray-700 block mb-1">Product Type *</label>
          <select
            value={formData.productType}
            onChange={(e) => setFormData({ ...formData, productType: e.target.value as any })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white font-bold"
          >
            <option value="SIMPLE">SIMPLE (Single price and single stock)</option>
            <option value="VARIABLE">VARIABLE (Multiple Size / Fabric / Color variations)</option>
          </select>
        </div>

        {formData.productType === 'SIMPLE' ? (
          <div>
            <label className="font-bold text-gray-700 block mb-1">Stock Quantity *</label>
            <input
              type="number"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg font-bold"
            />
          </div>
        ) : (
          <div>
            <label className="font-bold text-gray-700 block mb-1">Attach Reusable Global Form *</label>
            <select
              value={formData.globalFormId}
              onChange={(e) => setFormData({ ...formData, globalFormId: e.target.value })}
              className="w-full px-3 py-2 border border-amber-300 rounded-lg bg-amber-50 font-bold text-amber-900"
            >
              <option value="">Select Global Form (e.g. Bed Specifications)...</option>
              {globalForms.map((g) => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
            <p className="text-[11px] text-gray-500 mt-1">
              Variations (SKUs, price adjustments, stock grid) will be generated automatically upon creation.
            </p>
          </div>
        )}

        <div>
          <label className="font-bold text-gray-700 block mb-1">Main Image URL *</label>
          <input
            type="url"
            value={formData.imageUrl}
            onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg"
          />
        </div>

        <div>
          <label className="font-bold text-gray-700 block mb-1">Description *</label>
          <textarea
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            required
            className="w-full p-3 border border-gray-300 rounded-lg"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-lg"
        >
          {loading ? 'Creating Product & Variations...' : 'Save Product ➔'}
        </button>

        {status && <p className="text-xs font-bold text-center mt-2 p-2 bg-gray-100 rounded">{status}</p>}
      </form>
    </div>
  );
}
