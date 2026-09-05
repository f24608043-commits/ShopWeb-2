import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin-auth';
import { dealSchema } from '@/lib/validations/engagement';

// GET /api/deals - Fetch active bundle promotional deals
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: deals, error } = await supabase
      .from('deals')
      .select(`
        *,
        products:deal_products(
          *,
          product:products(
            *,
            images:product_images(limit: 1)
          )
        )
      `)
      .eq('active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Supabase query error:', error);
      return NextResponse.json({ error: 'Failed to fetch deals' }, { status: 500 });
    }

    return NextResponse.json(deals);
  } catch (error) {
    console.error('GET /api/deals error:', error);
    return NextResponse.json({ error: 'Failed to fetch deals' }, { status: 500 });
  }
}

// POST /api/deals - Admin create deal
export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return auth.response;
    }

    const supabase = await createClient();
    const body = await req.json();
    const validatedData = dealSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid deal data', details: validatedData.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { title, description, dealPrice, active, expiresAt, productIds } = validatedData.data;

    const { data: newDeal, error: insertError } = await supabase
      .from('deals')
      .insert({
        title,
        description,
        deal_price: dealPrice,
        active,
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      })
      .select()
      .single();

    if (insertError) {
      console.error('Supabase insert error:', insertError);
      return NextResponse.json({ error: 'Failed to create deal' }, { status: 500 });
    }

    // Create deal products
    if (productIds && productIds.length > 0) {
      const dealProductInserts = productIds.map((productId) => ({
        deal_id: newDeal.id,
        product_id: productId,
      }));

      const { error: productsError } = await supabase
        .from('deal_products')
        .insert(dealProductInserts);

      if (productsError) {
        console.error('Failed to create deal products:', productsError);
      }
    }

    // Fetch complete deal with products
    const { data: completeDeal } = await supabase
      .from('deals')
      .select(`
        *,
        products:deal_products(
          *,
          product:products(*)
        )
      `)
      .eq('id', newDeal.id)
      .single();

    return NextResponse.json(completeDeal, { status: 201 });
  } catch (error) {
    console.error('POST /api/deals error:', error);
    return NextResponse.json({ error: 'Failed to create deal' }, { status: 500 });
  }
}
