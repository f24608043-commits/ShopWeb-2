import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin-auth';
import { updateVariationSchema } from '@/lib/validations/global-form';

// PUT /api/products/[id]/variations/[variationId] - Update variation SKU, price, stock
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string; variationId: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return auth.response;
    }

    const { variationId } = await params;
    const supabase = await createClient();
    const body = await req.json();
    const validatedData = updateVariationSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid input fields', details: validatedData.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { sku, price, stock } = validatedData.data;

    // Check unique SKU collision if updated
    if (sku) {
      const { data: existingSku } = await supabase
        .from('product_variations')
        .select('id')
        .eq('sku', sku)
        .neq('id', variationId)
        .single();

      if (existingSku) {
        return NextResponse.json(
          { error: 'Another variation is already using this SKU.' },
          { status: 409 }
        );
      }
    }

    const { data: updatedVariation, error } = await supabase
      .from('product_variations')
      .update({
        ...(sku !== undefined && { sku }),
        ...(price !== undefined && { price }),
        ...(stock !== undefined && { stock }),
      })
      .eq('id', variationId)
      .select(`
        *,
        values:product_variation_values(
          *,
          option_value:product_option_values(*)
        )
      `)
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json({ error: 'Failed to update variation' }, { status: 500 });
    }

    return NextResponse.json(updatedVariation);
  } catch (error) {
    console.error('PUT /api/products/[id]/variations/[variationId] error:', error);
    return NextResponse.json({ error: 'Failed to update variation' }, { status: 500 });
  }
}
