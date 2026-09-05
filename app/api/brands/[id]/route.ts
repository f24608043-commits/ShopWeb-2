import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireAdmin } from '@/lib/admin-auth';
import { brandSchema } from '@/lib/validations/category-brand';

// GET /api/brands/[id]
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    
    const { data: brand } = await supabase
      .from('brands')
      .select(`
        *,
        products:products(count)
      `)
      .eq('id', id)
      .single();

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    return NextResponse.json(brand);
  } catch (error) {
    console.error('GET /api/brands/[id] error:', error);
    return NextResponse.json({ error: 'Failed to fetch brand' }, { status: 500 });
  }
}

// PUT /api/brands/[id] - Admin update
export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = await params;
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

    // Check slug collision with other brands
    const { data: existingSlug } = await supabase
      .from('brands')
      .select('id')
      .eq('slug', slug)
      .neq('id', id)
      .single();

    if (existingSlug) {
      return NextResponse.json(
        { error: 'Another brand is already using this slug.' },
        { status: 409 }
      );
    }

    const { data: updatedBrand, error } = await supabase
      .from('brands')
      .update({ name, slug, logo_url: logoUrl || null })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Supabase update error:', error);
      return NextResponse.json({ error: 'Failed to update brand' }, { status: 500 });
    }

    return NextResponse.json(updatedBrand);
  } catch (error) {
    console.error('PUT /api/brands/[id] error:', error);
    return NextResponse.json({ error: 'Failed to update brand' }, { status: 500 });
  }
}

// DELETE /api/brands/[id] - Admin delete
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAdmin();
    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = await params;
    const supabase = await createClient();

    const { error } = await supabase
      .from('brands')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Supabase delete error:', error);
      return NextResponse.json({ error: 'Failed to delete brand' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Brand deleted successfully' });
  } catch (error) {
    console.error('DELETE /api/brands/[id] error:', error);
    return NextResponse.json({ error: 'Failed to delete brand' }, { status: 500 });
  }
}
