import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';

export default async function AdminProductsPage() {
  const supabase = await createClient();
  const { data: products } = await supabase
    .from('products')
    .select(`
      *,
      images:product_images(limit: 1),
      category:categories(*),
      brand:brands(*),
      variations:product_variations(*)
    `)
    .order('created_at', { ascending: false });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center border-b border-gray-100 pb-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Product Management</h1>
          <p className="text-xs text-gray-500 mt-0.5">Manage products, stock levels, global forms, and variations.</p>
        </div>
        <Link
          href="/admin/products/new"
          className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow"
        >
          + Create Product
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border border-gray-200 rounded-xl overflow-hidden">
          <thead className="bg-neutral-900 text-white font-bold">
            <tr>
              <th className="p-3">Image</th>
              <th className="p-3">Product Name</th>
              <th className="p-3">Category</th>
              <th className="p-3">Base Price</th>
              <th className="p-3">Type</th>
              <th className="p-3">Stock / Variations</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products?.map((p: any) => (
              <tr key={p.id} className="hover:bg-gray-50">
                <td className="p-3">
                  <div className="relative w-12 h-12 rounded bg-gray-100 overflow-hidden border">
                    <Image
                      src={p.images?.[0]?.url || 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=400'}
                      alt={p.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                </td>
                <td className="p-3 font-bold text-gray-900">{p.name}</td>
                <td className="p-3 text-gray-600">{p.category?.name || 'Unassigned'}</td>
                <td className="p-3 font-black text-gray-900">Rs. {Number(p.base_price).toLocaleString()}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    p.product_type === 'VARIABLE' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {p.product_type}
                  </span>
                </td>
                <td className="p-3">
                  {p.product_type === 'VARIABLE' ? (
                    <span className="font-bold text-amber-700">{p.variations?.length || 0} Variations</span>
                  ) : (
                    <span className="font-bold text-gray-800">{p.stock ?? 0} in stock</span>
                  )}
                </td>
                <td className="p-3 space-x-2">
                  <Link href={`/products/${p.slug}`} className="text-amber-700 hover:underline font-bold">
                    View
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
