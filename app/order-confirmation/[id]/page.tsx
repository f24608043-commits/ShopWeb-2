import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function OrderConfirmationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: order } = await supabase
    .from('orders')
    .select(`
      *,
      items:order_items(*),
      coupon:coupons(*)
    `)
    .eq('id', id)
    .single();

  if (!order) {
    return (
      <div className="text-center py-24 space-y-4 max-w-md mx-auto">
        <span className="text-5xl block">⚠️</span>
        <h1 className="text-2xl font-black text-gray-900">Order Not Found</h1>
        <p className="text-xs text-gray-500">We could not locate this order ID in our system.</p>
        <Link href="/shop" className="inline-block px-6 py-2.5 bg-amber-600 text-white font-bold text-xs rounded-full">
          Return to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 py-4">
      {/* Success Badge */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-8 text-center space-y-3">
        <span className="text-5xl block">🎉</span>
        <h1 className="text-3xl font-black text-emerald-900">Order Confirmed!</h1>
        <p className="text-xs text-emerald-700 max-w-md mx-auto">
          Thank you, <span className="font-bold">{order.customer_name}</span>. Your order has been placed successfully and is being prepared for dispatch.
        </p>
        <div className="inline-block bg-white px-4 py-1.5 rounded-full text-xs font-mono font-bold text-gray-700 border border-emerald-300">
          Order ID: {order.id}
        </div>
      </div>

      {/* Invoice Snapshot */}
      <div className="bg-white p-8 rounded-2xl border border-gray-200 space-y-6 shadow-sm">
        <div className="flex justify-between items-center border-b border-gray-100 pb-4 text-xs">
          <div>
            <h2 className="font-bold text-gray-900 text-base">Invoice Details</h2>
            <p className="text-gray-500">Date: {new Date(order.created_at).toLocaleDateString()}</p>
          </div>
          <span className="px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full uppercase">
            Status: {order.status}
          </span>
        </div>

        {/* Customer & Shipping Summary */}
        <div className="grid grid-cols-2 gap-4 text-xs bg-gray-50 p-4 rounded-xl">
          <div>
            <span className="font-bold text-gray-700 block mb-1">Customer Info</span>
            <p className="text-gray-900 font-medium">{order.customer_name}</p>
            <p className="text-gray-500">{order.customer_email}</p>
            <p className="text-gray-500">{order.phone}</p>
          </div>
          <div>
            <span className="font-bold text-gray-700 block mb-1">Delivery Address</span>
            <p className="text-gray-900 font-medium">{order.address}</p>
            <p className="text-gray-500">{order.city}, {order.province} {order.postal_code}</p>
          </div>
        </div>

        {/* Items Table */}
        <div className="space-y-3">
          <h3 className="font-bold text-xs text-gray-900 uppercase tracking-wider">Purchased Items</h3>
          <div className="divide-y divide-gray-100">
            {order.items?.map((item: any) => (
              <div key={item.id} className="py-3 text-xs flex justify-between items-center">
                <div>
                  <span className="font-bold text-gray-900 block">{item.product_name}</span>
                  {item.selected_options && (
                    <span className="text-[11px] text-amber-700 font-medium">
                      {(Array.isArray(item.selected_options)
                        ? (item.selected_options as any[])
                        : []
                      ).map((o: any) => `${o.option}: ${o.value}`).join(', ')}
                    </span>
                  )}
                  <span className="text-gray-400 block">Qty: {item.quantity} × Rs. {Number(item.unit_price).toLocaleString()}</span>
                </div>
                <span className="font-black text-gray-900">Rs. {Number(item.total_price).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Summary */}
        <div className="border-t border-gray-200 pt-4 space-y-2 text-xs text-gray-600">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span className="font-bold text-gray-900">Rs. {Number(order.subtotal).toLocaleString()}</span>
          </div>
          {Number(order.discount) > 0 && (
            <div className="flex justify-between text-emerald-600 font-bold">
              <span>Coupon Discount</span>
              <span>-Rs. {Number(order.discount).toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-black text-gray-900 pt-2 border-t border-gray-100">
            <span>Total Paid</span>
            <span className="text-2xl text-amber-700">Rs. {Number(order.total).toLocaleString()}</span>
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-4 text-xs font-bold">
        <Link href="/shop" className="px-8 py-3 bg-amber-600 text-white rounded-full shadow-md">
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}
