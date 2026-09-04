import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { updateOrderStatusSchema } from '@/lib/validations/checkout';

// PUT /api/orders/[id]/status - Admin update order status
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = await params;
    const body = await req.json();
    const validatedData = updateOrderStatusSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid status payload', details: validatedData.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { status } = validatedData.data;

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: { status },
      include: { items: true },
    });

    return NextResponse.json({
      message: `Order status updated to ${status}`,
      order: updatedOrder,
    });
  } catch (error) {
    console.error('PUT /api/orders/[id]/status error:', error);
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 });
  }
}
