import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cartVerifySchema } from '@/lib/validations/coupon-cart';

// POST /api/cart/verify - Server-side Cart Price & Stock Verification
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validatedData = cartVerifySchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid cart payload', details: validatedData.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { items } = validatedData.data;

    let subtotal = 0;
    const verifiedItems = [];
    const stockErrors = [];

    for (const item of items) {
      // 1. Fetch Product
      const product = await prisma.product.findUnique({
        where: { id: item.productId },
        include: {
          images: { orderBy: { order: 'asc' }, take: 1 },
        },
      });

      if (!product) {
        stockErrors.push(`Product ID ${item.productId} is no longer available.`);
        continue;
      }

      let unitPrice = Number(product.basePrice);
      let availableStock = product.stock ?? 0;
      let variationDetails = null;

      // 2. If VARIABLE product, fetch variation
      if (product.productType === 'VARIABLE' && item.variationId) {
        const variation = await prisma.productVariation.findUnique({
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
          stockErrors.push(`Selected variation for "${product.name}" is no longer available.`);
          continue;
        }

        unitPrice = Number(variation.price);
        availableStock = variation.stock;
        
        // Format option summary (e.g. "Size: 5ft, Fabric: Velvet, Color: Beige")
        variationDetails = variation.values
          .map((v) => `${v.optionValue.option.name}: ${v.optionValue.value}`)
          .join(', ');
      }

      // 3. Stock Check
      if (item.quantity > availableStock) {
        stockErrors.push(
          `Requested quantity (${item.quantity}) for "${product.name}" exceeds available stock (${availableStock}).`
        );
      }

      const itemTotal = unitPrice * item.quantity;
      subtotal += itemTotal;

      verifiedItems.push({
        productId: product.id,
        variationId: item.variationId || null,
        productName: product.name,
        productSlug: product.slug,
        image: product.images[0]?.url || '/placeholder.jpg',
        variationDetails,
        quantity: item.quantity,
        unitPrice,
        totalPrice: itemTotal,
        availableStock,
        isOutOfStock: availableStock === 0,
      });
    }

    return NextResponse.json({
      items: verifiedItems,
      subtotal,
      hasStockErrors: stockErrors.length > 0,
      stockErrors,
    });
  } catch (error) {
    console.error('POST /api/cart/verify error:', error);
    return NextResponse.json({ error: 'Failed to verify cart items' }, { status: 500 });
  }
}
