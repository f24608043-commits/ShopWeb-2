import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cartVerifySchema } from '@/lib/validations/coupon-cart';

// POST /api/cart/verify - Server-side Cart Price & Stock Verification
export async function POST(req: Request) {
  try {
    const supabase = await createClient();
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
      const { data: product } = await supabase
        .from('products')
        .select(`
          *,
          images:product_images(order)
        `)
        .eq('id', item.productId)
        .single();

      if (!product) {
        stockErrors.push(`Product ID ${item.productId} is no longer available.`);
        continue;
      }

      let unitPrice = Number(product.base_price);
      let availableStock = product.stock ?? 0;
      let variationDetails = null;

      // 2. If VARIABLE product, fetch variation
      if (product.product_type === 'VARIABLE' && item.variationId) {
        const { data: variation } = await supabase
          .from('product_variations')
          .select(`
            *,
            values:product_variation_values(
              *,
              option_value:product_option_values(
                *,
                option:product_options(*)
              )
            )
          `)
          .eq('id', item.variationId)
          .single();

        if (!variation) {
          stockErrors.push(`Selected variation for "${product.name}" is no longer available.`);
          continue;
        }

        unitPrice = Number(variation.price);
        availableStock = variation.stock;
        
        // Format option summary (e.g. "Size: 5ft, Fabric: Velvet, Color: Beige")
        if (variation.values) {
          variationDetails = variation.values
            .map((v: any) => `${v.option_value.option.name}: ${v.option_value.value}`)
            .join(', ');
        }
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
        image: product.images?.[0]?.url || '/placeholder.jpg',
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
