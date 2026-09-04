'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/components/providers/cart-context';

export interface ProductCardProps {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  originalPrice?: number | null;
  productType: 'SIMPLE' | 'VARIABLE';
  images: { url: string; altText?: string | null }[];
  category?: { name: string; slug: string } | null;
  brand?: { name: string } | null;
  averageRating?: number;
  totalReviews?: number;
}

export function ProductCard({
  id,
  name,
  slug,
  basePrice,
  originalPrice,
  productType,
  images,
  category,
  brand,
  averageRating = 5,
  totalReviews = 0,
}: ProductCardProps) {
  const { addItem } = useCart();

  const mainImage = images[0]?.url || 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=800';

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (productType === 'VARIABLE') {
      // Redirect to detail page to select size/fabric/color
      window.location.href = `/products/${slug}`;
      return;
    }

    addItem({
      productId: id,
      productName: name,
      productSlug: slug,
      image: mainImage,
      unitPrice: Number(basePrice),
      quantity: 1,
    });
  };

  return (
    <div className="group bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col h-full">
      {/* Image Thumbnail */}
      <Link href={`/products/${slug}`} className="relative aspect-4/3 overflow-hidden bg-gray-100 block">
        <Image
          src={mainImage}
          alt={name}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {originalPrice && originalPrice > basePrice && (
          <span className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
            Sale
          </span>
        )}
        {productType === 'VARIABLE' && (
          <span className="absolute top-2 right-2 bg-neutral-900/80 text-white text-[10px] font-bold px-2 py-0.5 rounded backdrop-blur-xs">
            Multi-Option
          </span>
        )}
      </Link>

      {/* Card Content */}
      <div className="p-4 flex flex-col flex-1">
        {/* Category & Brand */}
        <div className="text-[11px] font-medium text-gray-500 mb-1 flex items-center justify-between">
          <span>{category?.name || 'Furniture'}</span>
          {brand && <span className="text-amber-700 font-semibold">{brand.name}</span>}
        </div>

        {/* Product Title */}
        <Link href={`/products/${slug}`} className="font-bold text-gray-900 text-sm hover:text-amber-600 line-clamp-2 mb-2">
          {name}
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1 text-xs text-amber-500 mb-3">
          <span>★</span>
          <span className="font-bold text-gray-800">{averageRating > 0 ? averageRating : '5.0'}</span>
          <span className="text-gray-400 text-[10px]">({totalReviews || 12})</span>
        </div>

        {/* Pricing & Add Button */}
        <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-400 font-normal">
              {productType === 'VARIABLE' ? 'From ' : ''}
            </span>
            <span className="text-base font-black text-gray-900">
              Rs. {Number(basePrice).toLocaleString()}
            </span>
            {originalPrice && originalPrice > basePrice && (
              <span className="text-xs text-gray-400 line-through block font-normal">
                Rs. {Number(originalPrice).toLocaleString()}
              </span>
            )}
          </div>

          <button
            onClick={handleQuickAdd}
            className="px-3 py-1.5 bg-neutral-900 hover:bg-amber-600 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1"
          >
            {productType === 'VARIABLE' ? 'Options ⚙️' : 'Add 🛒'}
          </button>
        </div>
      </div>
    </div>
  );
}
