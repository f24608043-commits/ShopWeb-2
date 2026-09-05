import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkoutSchema } from '@/lib/validations/checkout';

// GET /api/orders - List orders for authenticated customer or all orders for admin
export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    const isAdmin = profile?.role === 'ADMIN';

    let query = supabase
      .from('orders')
      .select(`
        *,
        items:order_items(*),
        coupon:coupons(code, discount_type, discount_value)
      `)
      .order('created_at', { ascending: false });

    if (!isAdmin) {
      query = query.eq('user_id', user.id);
    }

    const { data: orders, error } = await query;

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
    }

    return NextResponse.json(orders);
  } catch (error) {
    console.error('GET /api/orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

// POST /api/orders - Atomic Checkout & Database Transaction Endpoint
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id || null;

    const body = await req.json();
    const validatedData = checkoutSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid checkout payload', details: validatedData.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const {
      customerName,
      customerEmail,
      phone,
      address,
      city,
      province,
      postalCode,
      couponCode,
      items,
    } = validatedData.data;

    // Use Supabase RPC for atomic transaction
    const { data: order, error } = await supabase.rpc('create_order', {
      p_user_id: userId,
      p_customer_name: customerName,
      p_customer_email: customerEmail,
      p_phone: phone,
      p_address: address,
      p_city: city,
      p_province: province,
      p_postal_code: postalCode,
      p_coupon_code: couponCode,
      p_items: items
    });

    if (error) {
      console.error('Supabase RPC error:', error);
      return NextResponse.json(
        { error: error.message || 'Checkout failed due to a server transaction error.' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        message: 'Order placed successfully',
        orderId: order.id,
        order: order,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST /api/orders error:', error);
    return NextResponse.json(
      { error: error.message || 'Checkout failed due to a server transaction error.' },
      { status: 400 }
    );
  }
}
