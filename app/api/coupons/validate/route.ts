import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { couponValidateSchema } from '@/lib/validations/coupon-cart';

// POST /api/coupons/validate - Validate coupon against cart subtotal
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    const body = await req.json();
    const validatedData = couponValidateSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid coupon validation payload', details: validatedData.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { code, items } = validatedData.data;

    // 1. Calculate verified subtotal from database prices
    let subtotal = 0;
    for (const item of items) {
      const { data: product } = await supabase
        .from('products')
        .select('base_price, product_type')
        .eq('id', item.productId)
        .single();

      if (!product) continue;

      let unitPrice = Number(product.base_price);

      if (product.product_type === 'VARIABLE' && item.variationId) {
        const { data: variation } = await supabase
          .from('product_variations')
          .select('price')
          .eq('id', item.variationId)
          .single();
        if (variation) {
          unitPrice = Number(variation.price);
        }
      }

      subtotal += unitPrice * item.quantity;
    }

    // 2. Fetch Coupon from DB
    const { data: coupon } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .single();

    if (!coupon) {
      return NextResponse.json({ error: 'Invalid coupon code.' }, { status: 404 });
    }

    // 3. Active status check
    if (!coupon.active) {
      return NextResponse.json({ error: 'This coupon is no longer active.' }, { status: 400 });
    }

    // 4. Expiration check
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This coupon has expired.' }, { status: 400 });
    }

    // 5. Usage limit check
    if (coupon.usage_limit !== null && coupon.used_count >= coupon.usage_limit) {
      return NextResponse.json({ error: 'Coupon usage limit has been reached.' }, { status: 400 });
    }

    // 6. Minimum order value check
    const minOrderVal = Number(coupon.min_order_value || 0);
    if (subtotal < minOrderVal) {
      return NextResponse.json(
        { error: `Minimum order value of Rs. ${minOrderVal.toLocaleString()} required to use this coupon.` },
        { status: 400 }
      );
    }

    // 7. Calculate Discount
    let discountAmount = 0;
    const discountVal = Number(coupon.discount_value);

    if (coupon.discount_type === 'PERCENTAGE') {
      discountAmount = (subtotal * discountVal) / 100;
    } else if (coupon.discount_type === 'FIXED') {
      discountAmount = Math.min(discountVal, subtotal);
    }

    const total = Math.max(0, subtotal - discountAmount);

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        discountType: coupon.discount_type,
        discountValue: discountVal,
      },
      subtotal,
      discount: discountAmount,
      total,
    });
  } catch (error) {
    console.error('POST /api/coupons/validate error:', error);
    return NextResponse.json({ error: 'Failed to validate coupon' }, { status: 500 });
  }
}
