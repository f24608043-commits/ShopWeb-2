import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin-auth';
import { brandSchema } from '@/lib/validations/category-brand';

// GET /api/brands - Public listing of brands
export async function GET() {
  try {
    const supabase = await createClient();
    
    const { data: brands } = await supabase
      .from('brands')
      .select(`
        *,
        products:products(count)
      `)
      .order('name', { ascending: true });

    return NextResponse.json(brands);
  } catch (error) {
    console.error('GET /api/brands error:', error);
    return NextResponse.json({ error: 'Failed to fetch brands' }, { status: 500 });
  }
}

// POST /api/brands - Admin-protected brand creation
export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return auth.response;
    }

    const supabase = await createClient();
    const body = await req.json();
    const validatedData = brandSchema.safeParse(body);

    if (!validatedData.success) {
      return NextResponse.json(
        { error: 'Invalid input fields', details: validatedData.error.flatten().fieldErrors },
        { status: 422 }
      );
    }

    const { name, slug, logoUrl } = validatedData.data;

    // Check for existing slug
    const { data: existingBrand } = await supabase
      .from('brands')
      .select('id')
      .eq('slug', slug)
      .single();

    if (existingBrand) {
      return NextResponse.json(
        { error: 'A brand with this slug already exists.' },
        { status: 409 }
      );
    }

    const { data: newBrand, error } = await supabase
      .from('brands')
      .insert({ name, slug, logo_url: logoUrl || null })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return NextResponse.json({ error: 'Failed to create brand' }, { status: 500 });
    }

    return NextResponse.json(newBrand, { status: 201 });
  } catch (error) {
    console.error('POST /api/brands error:', error);
    return NextResponse.json({ error: 'Failed to create brand' }, { status: 500 });
  }
}
