import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { checkoutSchema } from '@/lib/validations/checkout';

// GET /api/orders - List orders for authenticated customer or all orders for admin
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const isPageAdmin = session.user.role === 'ADMIN';

    const orders = await prisma.order.findMany({
      where: isPageAdmin ? {} : { userId: session.user.id },
      include: {
        items: true,
        coupon: { select: { code: true, discountType: true, discountValue: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('GET /api/orders error:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}

// POST /api/orders - Atomic Checkout & Database Transaction Endpoint
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;

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

    // Execute entire checkout inside an ATOMIC DATABASE TRANSACTION
    const createdOrder = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      const orderItemDatas = [];
      const stockUpdates = [];

      // 1. Verify Products, Variations, Stock & Calculate Real Subtotal
      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          throw new Error(`Product "${item.productId}" is no longer available.`);
        }

        let unitPrice = Number(product.basePrice);
        let currentStock = product.stock ?? 0;
        let variationSku: string | null = null;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        let selectedOptionsData: any = undefined;

        if (product.productType === 'VARIABLE' && item.variationId) {
          const variation = await tx.productVariation.findUnique({
            where: { id: item.variationId },
            include: {
              values: {
                include: {
                  optionValue: {
                    include: { option: true },
                  },
                },
              },
            },
          });

          if (!variation) {
            throw new Error(`Selected variation for product "${product.name}" is unavailable.`);
          }

          unitPrice = Number(variation.price);
          currentStock = variation.stock;
          variationSku = variation.sku;
          selectedOptionsData = variation.values.map((v) => ({
            option: v.optionValue.option.name,
            value: v.optionValue.value,
          }));

          // Queue variation stock decrease
          stockUpdates.push(() =>
            tx.productVariation.update({
              where: { id: item.variationId! },
              data: { stock: { decrement: item.quantity } },
            })
          );
        } else {
          // Queue simple product stock decrease
          stockUpdates.push(() =>
            tx.product.update({
              where: { id: product.id },
              data: { stock: { decrement: item.quantity } },
            })
          );
        }

        // Verify stock sufficiency
        if (currentStock < item.quantity) {
          throw new Error(
            `Insufficient stock for "${product.name}". Available: ${currentStock}, Requested: ${item.quantity}`
          );
        }

        const totalPrice = unitPrice * item.quantity;
        subtotal += totalPrice;

        // Queue immutable OrderItem snapshot data
        orderItemDatas.push({
          productId: product.id,
          productName: product.name,
          productSlug: product.slug,
          variationId: item.variationId || null,
          variationSku,
          quantity: item.quantity,
          unitPrice,
          totalPrice,
          selectedOptions: selectedOptionsData,
        });
      }

      // 2. Validate Coupon & Calculate Discount
      let discount = 0;
      let appliedCouponId: string | null = null;

      if (couponCode) {
        const coupon = await tx.coupon.findUnique({
          where: { code: couponCode.toUpperCase() },
        });

        if (!coupon || !coupon.active) {
          throw new Error('Invalid or inactive coupon code.');
        }

        if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
          throw new Error('Coupon has expired.');
        }

        if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
          throw new Error('Coupon usage limit reached.');
        }

        if (subtotal < Number(coupon.minOrderValue || 0)) {
          throw new Error(`Minimum order value of Rs. ${coupon.minOrderValue} required for coupon.`);
        }

        const discountVal = Number(coupon.discountValue);
        if (coupon.discountType === 'PERCENTAGE') {
          discount = (subtotal * discountVal) / 100;
        } else {
          discount = Math.min(discountVal, subtotal);
        }

        appliedCouponId = coupon.id;

        // Increment coupon usage count
        await tx.coupon.update({
          where: { id: coupon.id },
          data: { usedCount: { increment: 1 } },
        });
      }

      const finalTotal = Math.max(0, subtotal - discount);

      // 3. Create Order
      const order = await tx.order.create({
        data: {
          userId,
          status: 'PENDING',
          subtotal,
          discount,
          total: finalTotal,
          customerName,
          customerEmail,
          phone,
          address,
          city,
          province,
          postalCode,
          couponId: appliedCouponId,
          items: {
            create: orderItemDatas,
          },
        },
        include: {
          items: true,
        },
      });

      // 4. Decrease Stock
      for (const updateStockFn of stockUpdates) {
        await updateStockFn();
      }

      return order;
    });

    return NextResponse.json(
      {
        message: 'Order placed successfully',
        orderId: createdOrder.id,
        order: createdOrder,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST /api/orders atomic transaction error:', error);
    return NextResponse.json(
      { error: error.message || 'Checkout failed due to a server transaction error.' },
      { status: 400 }
    );
  }
}
