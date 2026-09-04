import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/admin-auth';
import { couponSchema } from '@/lib/validations/coupon-cart';

// GET /api/coupons - Admin fetch all coupons
export async function GET() {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return auth.response;
    }

    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(coupons);
  } catch (error) {
    console.error('GET /api/coupons error:', error);
    return NextResponse.json({ error: 'Failed to fetch coupons' }, { status: 500 });
  }
}

// POST /api/coupons - Admin create coupon
export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return auth.response;
    }

    const body = await req.json();
    const validatedData = couponSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid coupon data', details: validatedData.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { code, discountType, discountValue, minOrderValue, usageLimit, expiresAt, active } = validatedData.data;

    // Check unique code
    const existingCoupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (existingCoupon) {
      return NextResponse.json({ error: 'A coupon with this code already exists.' }, { status: 409 });
    }

    const newCoupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        discountType,
        discountValue,
        minOrderValue: minOrderValue || 0,
        usageLimit: usageLimit || null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        active,
      },
    });

    return NextResponse.json(newCoupon, { status: 201 });
  } catch (error) {
    console.error('POST /api/coupons error:', error);
    return NextResponse.json({ error: 'Failed to create coupon' }, { status: 500 });
  }
}
