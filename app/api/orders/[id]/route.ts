import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

// GET /api/orders/[id] - Fetch single order details
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        coupon: { select: { code: true, discountType: true, discountValue: true } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Guest orders or owner or admin can view
    const isOwner = session?.user?.id === order.userId;
    const isAdmin = session?.user?.role === 'ADMIN';
    const isGuestOrder = order.userId === null;

    if (!isGuestOrder && !isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized to view this order' }, { status: 403 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('GET /api/orders/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch order details' }, { status: 500 });
  }
}
