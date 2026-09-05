import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/products/[id]/variations - Fetch variations for a specific product
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data: variations, error } = await supabase
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
      .eq('product_id', id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({ error: 'Failed to fetch product variations' }, { status: 500 });
    }

    return NextResponse.json(variations);
  } catch (error) {
    console.error('GET /api/products/[id]/variations error:', error);
    return NextResponse.json({ error: 'Failed to fetch product variations' }, { status: 500 });
  }
}
