'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/components/providers/cart-context';
import { useSession } from 'next-auth/react';

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { items, subtotal, clearCart } = useCart();

  const [formData, setFormData] = useState({
    customerName: session?.user?.name || '',
    customerEmail: session?.user?.email || '',
    phone: '',
    address: '',
    city: '',
    province: '',
    postalCode: '',
    couponCode: '',
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmitCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;

    setLoading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          items: items.map((i) => ({
            productId: i.productId,
            variationId: i.variationId || null,
            quantity: i.quantity,
          })),
        }),
      });

      const data = await res.json();

      if (res.ok && data.orderId) {
        clearCart();
        router.push(`/order-confirmation/${data.orderId}`);
      } else {
        setErrorMsg(data.error || 'Checkout submission failed.');
      }
    } catch {
      setErrorMsg('Network error submitting order.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-24 space-y-4">
        <h1 className="text-2xl font-black text-gray-900">Your Cart is Empty</h1>
        <p className="text-xs text-gray-500">Please add products to your cart before proceeding to checkout.</p>
        <button
          onClick={() => router.push('/shop')}
          className="px-6 py-2.5 bg-amber-600 text-white font-bold text-xs rounded-full"
        >
          Return to Shop
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-black text-gray-900">Checkout & Shipping</h1>
        <p className="text-xs text-gray-500 mt-1">Enter your delivery details to place your order.</p>
      </div>

      <form onSubmit={handleSubmitCheckout} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* Customer Information Form */}
        <div className="md:col-span-2 bg-white p-6 rounded-2xl border border-gray-200 space-y-4">
          <h2 className="font-bold text-sm text-gray-900 border-b border-gray-100 pb-3">Delivery Information</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="font-bold text-gray-700 block mb-1">Full Name *</label>
              <input
                type="text"
                name="customerName"
                value={formData.customerName}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">Email Address *</label>
              <input
                type="email"
                name="customerEmail"
                value={formData.customerEmail}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="font-bold text-gray-700 block mb-1">Phone Number *</label>
            <input
              type="tel"
              name="phone"
              placeholder="+92 300 1234567"
              value={formData.phone}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="text-xs">
            <label className="font-bold text-gray-700 block mb-1">Street Delivery Address *</label>
            <input
              type="text"
              name="address"
              placeholder="House #, Street, Sector / Colony"
              value={formData.address}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <div>
              <label className="font-bold text-gray-700 block mb-1">City *</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">Province *</label>
              <input
                type="text"
                name="province"
                value={formData.province}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label className="font-bold text-gray-700 block mb-1">Postal Code *</label>
              <input
                type="text"
                name="postalCode"
                value={formData.postalCode}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>

          <div className="pt-2 text-xs">
            <label className="font-bold text-gray-700 block mb-1">Promo Coupon Code (Optional)</label>
            <input
              type="text"
              name="couponCode"
              placeholder="e.g. SAVE10"
              value={formData.couponCode}
              onChange={(e) => setFormData({ ...formData, couponCode: e.target.value.toUpperCase() })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg uppercase font-bold"
            />
          </div>
        </div>

        {/* Order Summary & Submit Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-4">
            <h2 className="font-bold text-sm text-gray-900 border-b border-gray-100 pb-3">Items Snapshot ({items.length})</h2>

            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={`${item.productId}-${item.variationId}`} className="text-xs flex justify-between gap-2 border-b border-gray-50 pb-2">
                  <div>
                    <span className="font-bold text-gray-900 block truncate max-w-40">{item.productName}</span>
                    {item.variationDetails && <span className="text-[10px] text-amber-700">{item.variationDetails}</span>}
                    <span className="text-gray-400 block">Qty: {item.quantity}</span>
                  </div>
                  <span className="font-bold text-gray-900">Rs. {(item.unitPrice * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 pt-3 flex justify-between items-baseline font-black text-gray-900">
              <span className="text-xs">Total Subtotal</span>
              <span className="text-xl text-amber-700">Rs. {subtotal.toLocaleString()}</span>
            </div>

            {errorMsg && <p className="text-xs text-red-600 font-bold bg-red-50 p-3 rounded-lg">{errorMsg}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-xl shadow-lg transition-transform hover:scale-[1.01] active:scale-[0.99]"
            >
              {loading ? 'Processing Order...' : 'Place Order (Cash on Delivery) 📦'}
            </button>
          </div>
        </div>

      </form>
    </div>
  );
}
