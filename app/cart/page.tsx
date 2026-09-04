'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/components/providers/cart-context';

export default function CartPage() {
  const { items, removeItem, updateQuantity, clearCart, subtotal } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [couponResult, setCouponResult] = useState<any>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setCouponError(null);
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: couponCode.trim(),
          items: items.map((i) => ({
            productId: i.productId,
            variationId: i.variationId,
            quantity: i.quantity,
          })),
        }),
      });

      const data = await res.json();
      if (res.ok && data.valid) {
        setCouponResult(data);
      } else {
        setCouponError(data.error || 'Invalid coupon code');
        setCouponResult(null);
      }
    } catch {
      setCouponError('Failed to validate coupon.');
    }
  };

  const discountAmount = couponResult?.discount || 0;
  const finalTotal = Math.max(0, subtotal - discountAmount);

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-black text-gray-900">Your Shopping Cart</h1>
        <p className="text-xs text-gray-500 mt-1">Review items, apply promo codes, and proceed to checkout.</p>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-2xl p-16 text-center border border-gray-200 space-y-4">
          <span className="text-5xl block">🛒</span>
          <h2 className="text-xl font-bold text-gray-900">Your cart is empty</h2>
          <p className="text-xs text-gray-500">You haven't added any luxury beds or furniture items to your cart yet.</p>
          <Link href="/shop" className="inline-block px-8 py-3 bg-amber-600 text-white font-bold text-xs rounded-full">
            Browse Shop Catalog
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Item List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex justify-between items-center text-xs font-bold text-gray-500 pb-2">
              <span>{items.length} Product{items.length > 1 ? 's' : ''}</span>
              <button onClick={clearCart} className="text-red-600 hover:underline">Clear Entire Cart</button>
            </div>

            {items.map((item) => (
              <div
                key={`${item.productId}-${item.variationId || 'simple'}`}
                className="bg-white p-4 rounded-xl border border-gray-200 flex gap-4 items-center"
              >
                <div className="relative w-20 h-20 bg-gray-100 rounded-lg overflow-hidden shrink-0">
                  <Image src={item.image} alt={item.productName} fill className="object-cover" />
                </div>

                <div className="flex-1 min-w-0">
                  <Link href={`/products/${item.productSlug}`} className="font-bold text-sm text-gray-900 hover:text-amber-600 truncate block">
                    {item.productName}
                  </Link>
                  {item.variationDetails && (
                    <p className="text-xs text-amber-700 font-medium">{item.variationDetails}</p>
                  )}
                  <div className="text-xs font-bold text-gray-900 mt-1">
                    Rs. {item.unitPrice.toLocaleString()} each
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateQuantity(item.productId, item.variationId, item.quantity - 1)}
                    className="w-7 h-7 bg-gray-100 rounded text-xs font-bold hover:bg-gray-200"
                  >
                    -
                  </button>
                  <span className="text-xs font-bold text-gray-900 px-1">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.productId, item.variationId, item.quantity + 1)}
                    className="w-7 h-7 bg-gray-100 rounded text-xs font-bold hover:bg-gray-200"
                  >
                    +
                  </button>
                </div>

                <div className="text-right min-w-24">
                  <span className="text-sm font-black text-gray-900 block">
                    Rs. {(item.unitPrice * item.quantity).toLocaleString()}
                  </span>
                  <button
                    onClick={() => removeItem(item.productId, item.variationId)}
                    className="text-[11px] text-red-600 hover:underline mt-1"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary & Coupon Sidebar */}
          <div className="space-y-6">
            
            {/* Coupon Code Input */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 space-y-3">
              <h3 className="font-bold text-xs text-gray-900 uppercase tracking-wider">Have a Coupon Code?</h3>
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. SAVE10"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-xs font-bold"
                />
                <button type="submit" className="px-4 py-2 bg-neutral-900 text-white font-bold text-xs rounded-lg">
                  Apply
                </button>
              </form>
              {couponResult && (
                <p className="text-xs text-emerald-600 font-bold">
                  🎉 Coupon "{couponResult.coupon.code}" Applied (-Rs. {discountAmount.toLocaleString()})
                </p>
              )}
              {couponError && <p className="text-xs text-red-600 font-semibold">{couponError}</p>}
            </div>

            {/* Total Summary */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-4">
              <h3 className="font-bold text-sm text-gray-900 border-b border-gray-100 pb-3">Order Summary</h3>
              
              <div className="space-y-2 text-xs text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-bold text-gray-900">Rs. {subtotal.toLocaleString()}</span>
                </div>

                {discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span>Coupon Discount</span>
                    <span>-Rs. {discountAmount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between">
                  <span>Nationwide Shipping</span>
                  <span className="text-emerald-600 font-bold">FREE</span>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-3 flex justify-between items-baseline text-base font-black text-gray-900">
                <span>Total Amount</span>
                <span className="text-2xl text-amber-700">Rs. {finalTotal.toLocaleString()}</span>
              </div>

              <Link
                href="/checkout"
                className="w-full py-3.5 bg-amber-600 hover:bg-amber-700 text-white text-center font-bold text-xs rounded-xl shadow-md block"
              >
                Proceed To Checkout ➔
              </Link>
            </div>

          </div>

        </div>
      )}
    </div>
  );
}
