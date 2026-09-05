import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/orders/[id] - Fetch single order details
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const { id } = await params;

    const { data: order } = await supabase
      .from('orders')
      .select(`
        *,
        items:order_items(*),
        coupon:coupons(code, discount_type, discount_value)
      `)
      .eq('id', id)
      .single();

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user?.id)
      .single();

    const isAdmin = profile?.role === 'ADMIN';

    // Guest orders or owner or admin can view
    const isOwner = user?.id === order.user_id;
    const isGuestOrder = order.user_id === null;

    if (!isGuestOrder && !isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Unauthorized to view this order' }, { status: 403 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('GET /api/orders/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch order details' }, { status: 500 });
  }
}
