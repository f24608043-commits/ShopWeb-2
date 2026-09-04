'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/components/providers/cart-context';

export function CartDrawer() {
  const { items, isCartOpen, setIsCartOpen, removeItem, updateQuantity, subtotal } = useCart();

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={() => setIsCartOpen(false)}
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col">
          
          {/* Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-neutral-900 text-white">
            <div className="flex items-center gap-2">
              <span className="text-xl">🛒</span>
              <h2 className="font-bold text-lg">Your Shopping Cart</h2>
            </div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="text-gray-400 hover:text-white p-1 text-lg font-bold"
            >
              ✕
            </button>
          </div>

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {items.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <span className="text-4xl block">🛍️</span>
                <p className="font-bold text-gray-800 text-base">Your cart is currently empty</p>
                <p className="text-xs text-gray-500">Explore our luxury bed frames and mattresses to add items!</p>
                <Link
                  href="/shop"
                  onClick={() => setIsCartOpen(false)}
                  className="inline-block mt-4 px-6 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-full"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={`${item.productId}-${item.variationId || 'simple'}`}
                  className="flex gap-3 border border-gray-100 rounded-lg p-3 bg-gray-50/50 relative"
                >
                  {/* Thumbnail */}
                  <div className="relative w-16 h-16 rounded overflow-hidden bg-gray-200 shrink-0">
                    <Image
                      src={item.image}
                      alt={item.productName}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 pr-6">
                    <Link
                      href={`/products/${item.productSlug}`}
                      onClick={() => setIsCartOpen(false)}
                      className="font-bold text-xs text-gray-900 hover:text-amber-600 truncate block"
                    >
                      {item.productName}
                    </Link>

                    {item.variationDetails && (
                      <p className="text-[11px] text-amber-700 font-medium mt-0.5">
                        {item.variationDetails}
                      </p>
                    )}

                    <div className="text-xs font-black text-gray-900 mt-1">
                      Rs. {item.unitPrice.toLocaleString()}
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex items-center border border-gray-300 rounded bg-white">
                        <button
                          onClick={() => updateQuantity(item.productId, item.variationId, item.quantity - 1)}
                          className="px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-bold text-gray-800">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.variationId, item.quantity + 1)}
                          className="px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-100"
                        >
                          +
                        </button>
                      </div>

                      <span className="text-xs font-bold text-gray-900 ml-auto">
                        Rs. {(item.unitPrice * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <button
                    onClick={() => removeItem(item.productId, item.variationId)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-600 text-xs font-bold p-1"
                    title="Remove Item"
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer Summary */}
          {items.length > 0 && (
            <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-3">
              <div className="flex justify-between items-center text-sm font-bold text-gray-900">
                <span>Estimated Subtotal</span>
                <span className="text-lg font-black text-amber-700">Rs. {subtotal.toLocaleString()}</span>
              </div>
              <p className="text-[11px] text-gray-500">Taxes, coupon discounts, and shipping calculated at checkout.</p>
              
              <div className="grid grid-cols-2 gap-2 pt-1">
                <Link
                  href="/cart"
                  onClick={() => setIsCartOpen(false)}
                  className="py-2.5 text-center border border-gray-300 hover:border-gray-400 bg-white font-bold text-xs rounded-lg text-gray-800"
                >
                  View Cart
                </Link>
                <Link
                  href="/checkout"
                  onClick={() => setIsCartOpen(false)}
                  className="py-2.5 text-center bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-lg shadow-sm"
                >
                  Checkout Now ➔
                </Link>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
