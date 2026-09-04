import React from 'react';
import { prisma } from '@/lib/prisma';
import { AdminOrdersClient } from './admin-orders-client';

export default async function AdminOrdersPage() {
  const orders = await prisma.order.findMany({
    include: { items: true, coupon: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Order Management</h1>
        <p className="text-xs text-gray-500 mt-0.5">View all customer orders and update their fulfillment status.</p>
      </div>
      <AdminOrdersClient orders={JSON.parse(JSON.stringify(orders))} />
    </div>
  );
}
